"""
companion/file_inspector.py
============================
Fase 1 — Inspeção Passiva de Arquivos (STRICTLY READ-ONLY).

REGRA DE SEGURANÇA:
  - Todos os arquivos são abertos com open(f, 'r') ou open(f, 'rb').
  - Nenhuma chamada de escrita é feita em caminhos do jogo.
  - Este módulo é um leitor passivo; não modifica, renomeia ou copia nada.

Extrai:
  - Lista de produtos disponíveis (via PRODUCTS/ dir names)
  - Nomes de saves existentes (via SAVE/*.SAV filenames)
  - Strings legíveis de HALLOFAME.DAT (nome de empresa/jogador)
  - Lista canônica de produtos do diretório text/ do install dir
"""

import os
import re
import struct
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime

from .config import (
    GAME_SAVE_DIR,
    GAME_PRODUCTS_DIR,
    GAME_HALLOFAME,
    GAME_TEXT_DIR,
    GAME_INSTALL_DIR,
)


# ---------------------------------------------------------------------------
# Utilitários internos (read-only)
# ---------------------------------------------------------------------------

def _extract_strings_from_binary(
    filepath: Path,
    min_length: int = 4,
    max_length: int = 64,
    encoding: str = "latin-1",
) -> List[str]:
    """
    Extrai strings legíveis de um arquivo binário (read-only, 'rb').
    Simula comportamento do comando `strings` do Unix.
    """
    results: List[str] = []
    try:
        with open(filepath, "rb") as fh:  # ← READ-ONLY binário
            data = fh.read()
    except (OSError, PermissionError) as exc:
        print(f"  [inspector] Não foi possível ler {filepath.name}: {exc}")
        return results

    # Regex para sequências de caracteres imprimíveis ASCII/latin-1
    pattern = rb"[\x20-\x7E]{" + str(min_length).encode() + rb",}" 
    for match in re.finditer(pattern, data):
        s = match.group(0).decode(encoding, errors="replace").strip()
        if len(s) <= max_length and s.isprintable():
            results.append(s)
    return results


def _read_text_file_safe(filepath: Path, encoding: str = "latin-1") -> Optional[str]:
    """Lê arquivo de texto de forma segura (read-only, 'r')."""
    try:
        with open(filepath, "r", encoding=encoding, errors="replace") as fh:  # ← READ-ONLY
            return fh.read()
    except (OSError, PermissionError) as exc:
        print(f"  [inspector] Não foi possível ler {filepath.name}: {exc}")
        return None


# ---------------------------------------------------------------------------
# Inspeção de Produtos
# ---------------------------------------------------------------------------

def get_product_list_from_products_dir() -> List[str]:
    """
    Retorna lista de nomes de produtos via os.listdir() no diretório PRODUCTS/.
    Somente listagem de diretório — nenhuma leitura de arquivo aqui.
    """
    products: List[str] = []
    if not GAME_PRODUCTS_DIR.exists():
        return products
    try:
        for entry in sorted(GAME_PRODUCTS_DIR.iterdir()):
            if entry.is_dir():
                products.append(entry.name)
    except (OSError, PermissionError) as exc:
        print(f"  [inspector] Erro ao listar PRODUCTS: {exc}")
    return products


def get_product_list_from_text_dir() -> List[str]:
    """
    Tenta extrair lista canônica de produtos dos arquivos de texto
    do diretório install/text/ (arquivos .txt legíveis do jogo).
    """
    products: List[str] = []
    if not GAME_TEXT_DIR.exists():
        return products

    # Procura arquivos que possam conter listas de produtos
    candidates = list(GAME_TEXT_DIR.glob("*.txt")) + list(GAME_TEXT_DIR.glob("*.TXT"))
    for candidate in candidates[:10]:  # limita para não demorar
        content = _read_text_file_safe(candidate)
        if content and len(content) > 10:
            lines = [l.strip() for l in content.splitlines() if l.strip()]
            if lines:
                products.extend(lines[:50])  # máx 50 por arquivo
    return list(dict.fromkeys(products))  # deduplica preservando ordem


# ---------------------------------------------------------------------------
# Inspeção de Saves
# ---------------------------------------------------------------------------

@dataclass_like = None  # placeholder para evitar import circular


def get_save_files_info() -> List[Dict]:
    """
    Lista arquivos .SAV com metadados (tamanho, data de modificação).
    Abre APENAS para leitura do header binário (primeiros 256 bytes).
    """
    saves: List[Dict] = []
    if not GAME_SAVE_DIR.exists():
        return saves

    try:
        for sav_file in sorted(GAME_SAVE_DIR.glob("*.SAV")):
            info: Dict = {
                "filename":   sav_file.name,
                "size_mb":    sav_file.stat().st_size / (1024 * 1024),
                "modified":   datetime.fromtimestamp(sav_file.stat().st_mtime),
                "strings":    [],
            }
            # Lê primeiros 512 bytes para tentar extrair nome do jogador/empresa
            try:
                with open(sav_file, "rb") as fh:  # ← READ-ONLY binário
                    header = fh.read(512)
                # Extrai strings ASCII do header
                for m in re.finditer(rb"[\x20-\x7E]{4,32}", header):
                    s = m.group(0).decode("latin-1", errors="replace").strip()
                    if s and not all(c in "0123456789.,- " for c in s):
                        info["strings"].append(s)
            except (OSError, PermissionError):
                pass
            saves.append(info)
    except (OSError, PermissionError) as exc:
        print(f"  [inspector] Erro ao listar saves: {exc}")

    return saves


# ---------------------------------------------------------------------------
# Inspeção do Hall of Fame
# ---------------------------------------------------------------------------

def get_hallofame_strings() -> List[str]:
    """
    Extrai strings legíveis de HALLOFAME.DAT (read-only binário).
    Pode conter nomes de empresa e do jogador de partidas anteriores.
    """
    if not GAME_HALLOFAME.exists():
        return []
    strings = _extract_strings_from_binary(GAME_HALLOFAME, min_length=3, max_length=40)
    # Filtra strings que parecem nomes (não URLs, não caminhos)
    filtered = [
        s for s in strings
        if not s.startswith(("http", "C:\\", "/", "cap", "Cap"))
        and len(s) >= 3
    ]
    return filtered[:20]  # retorna no máx 20 strings candidatas


# ---------------------------------------------------------------------------
# Relatório de Diagnóstico
# ---------------------------------------------------------------------------

class GameFileInspector:
    """
    Inspetor principal de arquivos do jogo.
    Coleta metadados sem modificar nada.
    """

    def __init__(self) -> None:
        self.products:       List[str] = []
        self.saves:          List[Dict] = []
        self.hof_strings:    List[str] = []
        self.warnings:       List[str] = []

    def run(self) -> None:
        """Executa toda a inspeção (somente leitura)."""
        print("\n[GameFileInspector] Iniciando inspeção read-only...")
        print(f"  Save dir    : {GAME_SAVE_DIR}")
        print(f"  Products dir: {GAME_PRODUCTS_DIR}")
        print()

        # 1. Produtos
        self.products = get_product_list_from_products_dir()
        if not self.products:
            self.products = get_product_list_from_text_dir()
        print(f"  ✅ {len(self.products)} produtos encontrados")

        # 2. Saves
        self.saves = get_save_files_info()
        print(f"  ✅ {len(self.saves)} arquivos de save encontrados")
        for sv in self.saves:
            print(f"     • {sv['filename']:20s}  {sv['size_mb']:.2f} MB  "
                  f"({sv['modified'].strftime('%Y-%m-%d %H:%M')})")
            if sv["strings"]:
                candidates = [s for s in sv["strings"] if len(s) > 4][:3]
                if candidates:
                    print(f"       Strings candidatas: {candidates}")

        # 3. Hall of Fame
        self.hof_strings = get_hallofame_strings()
        if self.hof_strings:
            print(f"\n  ✅ HALLOFAME strings: {self.hof_strings[:5]}")

        print(f"\n[GameFileInspector] Inspeção concluída. Nenhum arquivo foi modificado.")

    def get_product_list(self) -> List[str]:
        """Retorna lista de produtos para uso em outros módulos."""
        return self.products.copy()

    def print_diagnostic(self) -> None:
        """Imprime relatório de diagnóstico formatado."""
        print("\n" + "=" * 60)
        print("  DIAGNÓSTICO DE ARQUIVOS DO JOGO (READ-ONLY)")
        print("=" * 60)

        if self.products:
            print(f"\n  PRODUTOS ({len(self.products)} total):")
            for i, p in enumerate(self.products[:20]):
                print(f"    {i+1:3d}. {p}")
            if len(self.products) > 20:
                print(f"    ... e mais {len(self.products)-20} produtos")

        if self.saves:
            print(f"\n  SAVES ({len(self.saves)} encontrados):")
            for sv in self.saves:
                print(f"    • {sv['filename']:20s}  {sv['size_mb']:.2f} MB")

        if self.warnings:
            print(f"\n  ⚠️  AVISOS:")
            for w in self.warnings:
                print(f"    - {w}")

        print("\n  ⚠️  NOTA: Arquivos .SAV e .DAT são binários proprietários.")
        print("     Dados financeiros só podem ser obtidos via OCR de tela.")
        print("=" * 60)
