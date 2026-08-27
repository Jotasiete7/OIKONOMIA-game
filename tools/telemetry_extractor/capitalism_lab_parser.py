#!/usr/bin/env python3
"""
capitalism_lab_parser.py
=========================
Parser READ-ONLY do arquivo .SAV do Capitalism Lab.

Estratégia comprovada via engenharia reversa:
  - Arquivo .SAV = header binário + 1 bloco zlib (offset 26041)
  - Após descompressão: ~7MB de dados estruturados
  - Dados financeiros como IEEE754 double (float64) little-endian
  - Market share como int32 × 100 (3718 = 37.18%)
  - Nomes de empresas/goals como strings ASCII null-terminated

⚠️  REGRA DE SEGURANÇA: Abre arquivos SOMENTE com open(..., 'rb').
     NUNCA escreve em arquivos do jogo. Toda saída vai para
     game_telemetry_report.md dentro deste diretório.

Uso:
    python capitalism_lab_parser.py [caminho_do_save.SAV]
    python capitalism_lab_parser.py --watch   # monitora AUTO.SAV
"""

import os
import re
import sys
import zlib
import struct
import time
import argparse
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# Caminhos (read-only para o jogo)
# ---------------------------------------------------------------------------
_USER = Path(os.environ.get("USERPROFILE", Path.home()))
SAVE_DIR    = _USER / "Documents" / "My Games" / "Capitalism Lab" / "SAVE"
AUTO_SAV    = SAVE_DIR / "AUTO.SAV"
REPORT_PATH = Path(__file__).resolve().parent / "game_telemetry_report.md"

# ---------------------------------------------------------------------------
# Estrutura de dados
# ---------------------------------------------------------------------------
@dataclass
class BalanceSheet:
    cash:             Optional[float] = None
    inventory:        Optional[float] = None
    business_assets:  Optional[float] = None
    land_resources:   Optional[float] = None
    common_stock:     Optional[float] = None
    loans:            Optional[float] = None

    def fmt(self, v: Optional[float]) -> str:
        if v is None: return "N/A"
        if abs(v) >= 1e9:  return f"${v/1e9:.3f}B"
        if abs(v) >= 1e6:  return f"${v/1e6:.2f}M"
        if abs(v) >= 1e3:  return f"${v/1e3:.1f}K"
        return f"${v:,.0f}"

@dataclass
class MarketShareGoal:
    product:     str
    current_pct: Optional[float] = None
    target_pct:  float = 50.0

    @property
    def status(self) -> str:
        if self.current_pct is None: return "⚪ UNKNOWN"
        return "✅ OK" if self.current_pct >= self.target_pct else f"🔴 DEFICIT ({self.current_pct:.2f}% / {self.target_pct}%)"

@dataclass
class FinancialGoal:
    name:        str
    current:     Optional[float] = None
    target:      Optional[float] = None

    def pct(self) -> str:
        if self.current and self.target and self.target > 0:
            return f"{self.current/self.target*100:.1f}%"
        return "N/A"

@dataclass
class TelemetrySnapshot:
    save_path:     str
    save_date:     str  # data do arquivo
    player_name:   Optional[str] = None
    company_name:  Optional[str] = None
    competitors:   list = field(default_factory=list)
    balance:       BalanceSheet = field(default_factory=BalanceSheet)
    ms_goals:      list = field(default_factory=list)
    fin_goals:     list = field(default_factory=list)
    ingame_date:   Optional[str] = None
    years_played:  Optional[float] = None
    warnings:      list = field(default_factory=list)

# ---------------------------------------------------------------------------
# Parser principal (READ-ONLY)
# ---------------------------------------------------------------------------
class CapLabSaveParser:
    """Parser read-only do .SAV do Capitalism Lab."""

    ZLIB_OFFSET = 26041  # offset do bloco zlib no arquivo raw

    # Padrão de goal de market share
    GOAL_MS_MARKER = b'\x59\x68\x25\x00\x01'  # bytes antes do nome do produto

    # Empresas AI clássicas do jogo (para filtrar da lista de nomes)
    KNOWN_AI_COMPANIES = {
        "Quest International", "Quest Intl.",
        "Rising Sun International", "Rising Sun Intl.",
        "SSA Corporation", "SSA Corp.",
        "Magnet Corporation", "Magnet Corp.",
        "Parallel Inc.", "Archor Works",
        "Victory Group", "Zeta Group", "Phat Group",
        "Mankind", "Meilleur", "Memory Today",
        "New Lunar", "Ninja Star", "Platinum Coil",
        "Power Company", "Pristine Essence", "Pur Treasure",
        "Raid Group", "Radiate Star", "Radial Fleur",
        "Relay Power", "Resonic", "Revolver",
        "Round Petal", "Sage Bloom", "Samurai Trinity",
        "Serpentine", "Shining Star", "Single Mind",
        "Sky Image", "Smashing Guard", "Southern Lines",
        "Speedy Avion", "SSA Corporation",
        "Stacking Blocks", "Star Ultima", "Super Force",
        "Target Strike", "Three Brothers", "Topnotch Shield",
        "Touch Base", "Treasure Pit", "Tricubic Space",
        "Trio Unison", "Two Wheels", "United Array",
        "Vent Fort", "Victory Group", "Vigor Points",
        "Vita Nexus", "West End", "Whirlwind Genie",
        "Wind Speed", "Zeta Group", "Circle Cross",
        "Pyramid", "Ideas Hotbed", "Ion Industries",
    }

    def __init__(self, save_path: Path):
        self.path = save_path

    def _load_and_decompress(self) -> Optional[bytes]:
        """Lê e descomprime o bloco zlib do save. READ-ONLY."""
        try:
            with open(self.path, 'rb') as f:     # ← SOMENTE LEITURA
                raw = f.read()
        except (OSError, PermissionError) as e:
            print(f"[ERRO] Não foi possível ler {self.path}: {e}")
            return None

        if len(raw) < self.ZLIB_OFFSET + 4:
            print(f"[ERRO] Arquivo muito pequeno: {len(raw)} bytes")
            return None

        try:
            # Pula os 2 bytes de header zlib (CMF + FLG)
            return zlib.decompress(raw[self.ZLIB_OFFSET + 2:], wbits=-15)
        except zlib.error as e:
            print(f"[ERRO] Falha na descompressão: {e}")
            return None

    def _extract_strings(self, data: bytes, min_len: int = 3, max_len: int = 40) -> list:
        """Extrai strings ASCII legíveis do bloco binário."""
        results = []
        pat = re.compile(rb'[ -~]{' + str(min_len).encode() + rb',' + str(max_len).encode() + rb'}')
        for m in pat.finditer(data):
            s = m.group(0).decode('latin-1', errors='replace').strip()
            if any(c.isalpha() for c in s):
                results.append((m.start(), s))
        return results

    def _find_string(self, data: bytes, s: str) -> int:
        """Encontra primeira ocorrência de string ASCII no bloco."""
        sb = s.encode('ascii')
        idx = data.find(sb)
        return idx

    def _read_double_at(self, data: bytes, offset: int) -> Optional[float]:
        """Lê double IEEE754 LE no offset especificado."""
        if offset < 0 or offset + 8 > len(data):
            return None
        val = struct.unpack_from('<d', data, offset)[0]
        import math
        if math.isnan(val) or math.isinf(val):
            return None
        return val

    def _scan_balance_sheet(self, data: bytes) -> BalanceSheet:
        """
        Scan dinâmico do balanço financeiro.
        Estratégia: varre o arquivo procurando cluster de doubles financeiros
        (Cash, Inventory, BizAssets, Land) adjacentes com padrão [00][double].
        """
        bs = BalanceSheet()

        # Varre procurando padrão [00][double na faixa 50M-5B]
        i = 0
        while i < len(data) - 80:
            if data[i] == 0x00 and i + 9 <= len(data):
                d1 = self._read_double_at(data, i + 1)
                if d1 and 5e7 < d1 < 5e9:      # 50M - 5B: faixa de Cash plausível
                    # Verifica próximo double adjacente (Inventory)
                    d2 = self._read_double_at(data, i + 10)  # +9 bytes
                    if d2 and 1e7 < d2 < 5e9:
                        d3 = self._read_double_at(data, i + 19)  # BizAssets
                        d4 = self._read_double_at(data, i + 28)  # Land & Res
                        if d3 and d4 and d3 > 1e7 and d4 > 1e7:
                            # Cluster encontrado!
                            bs.cash            = d1
                            bs.inventory       = d2
                            bs.business_assets = d3
                            bs.land_resources  = d4
                            # Continua lendo campos adicionais
                            # Common Stock (depois de bloco de zeros)
                            offset_stock = i + 96
                            if offset_stock + 9 <= len(data) and data[offset_stock] == 0x00:
                                d_stock = self._read_double_at(data, offset_stock + 1)
                                if d_stock and d_stock > 1e8:
                                    bs.common_stock = d_stock
                            return bs
            i += 1
        return bs

    def _scan_market_share_goals(self, data: bytes) -> list:
        """
        Extrai goals de market share.
        Padrão: [59 68 25 00 01] [ProductName] [" Market Share"] [NULL]
        Valor atual: série de int32 (×100 = permilagem) após o goal text block.
        """
        goals = []
        marker = b'\x59\x68\x25\x00\x01'
        ms_suffix = b' Market Share'

        pos = 0
        while True:
            idx = data.find(marker, pos)
            if idx == -1:
                break

            # Lê nome do produto após o marker
            str_start = idx + len(marker)
            str_end   = str_start
            while str_end < len(data) and 0x20 <= data[str_end] <= 0x7E:
                str_end += 1

            full_str = data[str_start:str_end].decode('latin-1', errors='replace').strip()

            if ms_suffix.decode() in full_str:
                product = full_str.replace(' Market Share', '').strip()
                if product:
                    # Tenta encontrar o valor atual (int × 100)
                    # O valor atual é o int32 mais recente em uma série crescente/decrescente
                    current_pct = None
                    # Procura no bloco de 2048 bytes APÓS o goal text
                    search_start = str_end
                    search_end   = min(len(data), str_end + 2048)
                    # Série de int32 com padrão de percentual (100-5000 = 1%-50%)
                    # Pega o último da série antes do próximo marcador
                    series = []
                    j = search_start
                    while j < search_end - 4:
                        val = struct.unpack_from('<i', data, j)[0]
                        if 50 <= val <= 5000:   # 0.50% a 50.00%
                            series.append(val)
                            j += 4
                        else:
                            if series:
                                break
                            j += 1
                    if series:
                        current_pct = series[-1] / 100.0  # converte de permilagem

                    goals.append(MarketShareGoal(
                        product=product,
                        current_pct=current_pct
                    ))

            pos = idx + 1

        return goals

    def _scan_financial_goals(self, data: bytes) -> list:
        """Extrai goals financeiros (Revenue Goal, Profit Goal) com target e current."""
        goals = []

        for goal_text, goal_name in [
            (b'Revenue Goal', 'Revenue Goal'),
            (b'Profit Goal',  'Profit Goal'),
        ]:
            pos = 0
            seen_offsets = set()
            while True:
                idx = data.find(goal_text, pos)
                if idx == -1:
                    break
                if idx not in seen_offsets:
                    seen_offsets.add(idx)
                    # Target está nos bytes seguintes como int32 (em milhões?)
                    # Encontrado: 512,000,000 como int32 a +X bytes do texto do goal
                    target = None
                    current = None
                    for off in range(0, 512, 4):
                        vi = data[idx + off : idx + off + 4]
                        if len(vi) < 4:
                            break
                        val = struct.unpack('<i', vi)[0]
                        if 100_000_000 <= val <= 5_000_000_000:
                            if target is None:
                                target = float(val)
                            elif current is None and abs(val - target) > 1000:
                                current = float(val)
                                break

                    goals.append(FinancialGoal(
                        name=goal_name,
                        target=target,
                        current=current
                    ))
                pos = idx + 1
                if len(seen_offsets) >= 2:
                    break  # máx 2 instâncias por tipo

        # Deduplica por nome
        seen = set()
        unique = []
        for g in goals:
            if g.name not in seen:
                seen.add(g.name)
                unique.append(g)
        return unique

    def _scan_competitors(self, data: bytes) -> list:
        """Extrai nomes de empresas concorrentes."""
        strings = self._extract_strings(data, min_len=5, max_len=30)
        competitors = []
        for _, s in strings:
            if s in self.KNOWN_AI_COMPANIES:
                # Só inclui a versão longa (sem abreviação)
                if '.' not in s and 'Intl' not in s:
                    if s not in competitors:
                        competitors.append(s)
        return sorted(competitors)

    def parse(self) -> Optional[TelemetrySnapshot]:
        """Executa o parse completo do save."""
        print(f"[Parser] Lendo {self.path.name}...")

        data = self._load_and_decompress()
        if data is None:
            return None
        print(f"[Parser] Descomprimido: {len(data):,} bytes")

        snap = TelemetrySnapshot(
            save_path=str(self.path),
            save_date=datetime.fromtimestamp(self.path.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
        )

        # Nomes do jogador e empresa
        snap.player_name  = self._find_player_name(data)
        snap.company_name = self._find_company_name(data)

        # Balanço financeiro
        print("[Parser] Buscando balanço...")
        snap.balance = self._scan_balance_sheet(data)

        # Goals de market share
        print("[Parser] Buscando market share goals...")
        snap.ms_goals = self._scan_market_share_goals(data)

        # Goals financeiros
        print("[Parser] Buscando financial goals...")
        snap.fin_goals = self._scan_financial_goals(data)

        # Concorrentes
        print("[Parser] Buscando concorrentes...")
        snap.competitors = self._scan_competitors(data)

        print(f"[Parser] Concluído. "
              f"Cash={snap.balance.fmt(snap.balance.cash)} | "
              f"Goals={len(snap.ms_goals)} | "
              f"Concorrentes={len(snap.competitors)}")
        return snap

    def _find_player_name(self, data: bytes) -> Optional[str]:
        """Encontra nome do jogador (string antes do bloco de goals)."""
        # O nome do jogador aparece como string após um padrão de zeros
        strings = self._extract_strings(data, min_len=4, max_len=20)
        # Usa heurística: nome aparece perto do início, não é empresa conhecida, não é keyword
        keywords = {'Goal', 'Market', 'Your', 'You', 'This', 'Set', 'Launch', 'test'}
        for off, s in strings[:200]:
            if (s not in self.KNOWN_AI_COMPANIES and
                    not any(kw in s for kw in keywords) and
                    s.replace(' ', '').isalnum() and
                    len(s) >= 4):
                return s
        return None

    def _find_company_name(self, data: bytes) -> Optional[str]:
        """Encontra nome da empresa do jogador."""
        strings = self._extract_strings(data, min_len=4, max_len=25)
        keywords = {'Goal', 'Market', 'Your', 'You', 'This', 'test', 'launch'}
        for off, s in strings:
            if (s not in self.KNOWN_AI_COMPANIES and
                    not any(kw.lower() in s.lower() for kw in keywords) and
                    (' ' in s or len(s) >= 5) and
                    off > 0x10000):  # empresa vem depois no arquivo
                return s
        return None


# ---------------------------------------------------------------------------
# Gerador de relatório Markdown
# ---------------------------------------------------------------------------
class ReportBuilder:
    """Gera game_telemetry_report.md a partir de um TelemetrySnapshot."""

    def build(self, snap: TelemetrySnapshot) -> str:
        ts  = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        bs  = snap.balance
        fmt = bs.fmt

        lines = [
            "# CAPITALISM LAB — TELEMETRY REPORT",
            f"**Gerado em:** {ts}  |  **Save:** {Path(snap.save_path).name}  |  **Atualizado:** {snap.save_date}",
            "",
            "---",
            "",
            "## 🏢 Identidade",
            f"- **Empresa:** {snap.company_name or 'N/A'}",
            f"- **Jogador:** {snap.player_name or 'N/A'}",
            f"- **Data in-game:** {snap.ingame_date or 'N/A'}",
            f"- **Anos jogados:** {snap.years_played or 'N/A'}",
            "",
            "---",
            "",
            "## 💰 Balanço Patrimonial",
            f"| Campo | Valor |",
            f"|---|---|",
            f"| Cash | **{fmt(bs.cash)}** |",
            f"| Inventory | {fmt(bs.inventory)} |",
            f"| Business Assets | {fmt(bs.business_assets)} |",
            f"| Land & Natural Resources | {fmt(bs.land_resources)} |",
            f"| Common Stock | {fmt(bs.common_stock)} |",
            f"| Loans | {fmt(bs.loans) if bs.loans else '**$0 (sem dívida)**'} |",
        ]

        if bs.cash and bs.loans:
            net = bs.cash - bs.loans
            lines.append(f"| **Net Cash Position** | **{fmt(net)}** |")

        lines += ["", "---", "", "## 🎯 Goals de Market Share"]
        if snap.ms_goals:
            lines += ["| Produto | Atual | Target | Status |", "|---|---|---|---|"]
            for g in snap.ms_goals:
                cur = f"{g.current_pct:.2f}%" if g.current_pct is not None else "N/A"
                lines.append(f"| {g.product} | {cur} | {g.target_pct}% | {g.status} |")
        else:
            lines.append("_Nenhum goal de market share encontrado._")

        lines += ["", "---", "", "## 📈 Goals Financeiros"]
        if snap.fin_goals:
            for g in snap.fin_goals:
                cur_str = fmt(g.current) if g.current else "N/A"
                tgt_str = fmt(g.target) if g.target else "N/A"
                lines.append(f"- **{g.name}:** {cur_str} / Target: {tgt_str} ({g.pct()})")
        else:
            lines.append("_Nenhum goal financeiro encontrado._")

        lines += [
            "", "---", "",
            "## 🏭 Concorrentes Ativos no Jogo",
        ]
        if snap.competitors:
            for c in snap.competitors:
                lines.append(f"- {c}")
        else:
            lines.append("_Nenhum concorrente identificado._")

        if snap.warnings:
            lines += ["", "---", "", "## ⚠️ Avisos do Parser"]
            for w in snap.warnings:
                lines.append(f"- {w}")

        lines += [
            "", "---",
            "",
            "> **Como usar:** Envie este arquivo para uma LLM com sua pergunta estratégica.",
            "> Ex: *'Analise minha posição e me dê as 3 ações mais urgentes.'*",
            "",
            f"_Parser v1.0 — gerado automaticamente a partir de {Path(snap.save_path).name}_"
        ]

        return "\n".join(lines)

    def save(self, snap: TelemetrySnapshot, output: Path = REPORT_PATH) -> None:
        content = self.build(snap)
        with open(output, 'w', encoding='utf-8') as f:  # escrita SOMENTE no relatório
            f.write(content)
        print(f"[Report] Relatório salvo: {output}")
        print(f"[Report] {len(content)} caracteres | {len(content.splitlines())} linhas")


# ---------------------------------------------------------------------------
# Modo watcher (monitora AUTO.SAV)
# ---------------------------------------------------------------------------
def watch_mode(interval_sec: int = 60):
    """Monitora AUTO.SAV e regera o relatório quando o arquivo muda."""
    print(f"[Watcher] Monitorando {AUTO_SAV}")
    print(f"[Watcher] Intervalo de verificação: {interval_sec}s")
    print(f"[Watcher] Pressione Ctrl+C para sair\n")

    last_mtime = 0
    parser  = None
    builder = ReportBuilder()

    while True:
        try:
            if AUTO_SAV.exists():
                mtime = AUTO_SAV.stat().st_mtime
                if mtime != last_mtime:
                    last_mtime = mtime
                    print(f"\n[Watcher] AUTO.SAV atualizado! Regenerando relatório...")
                    time.sleep(1)  # aguarda o jogo terminar de escrever
                    parser = CapLabSaveParser(AUTO_SAV)
                    snap   = parser.parse()
                    if snap:
                        builder.save(snap)
                        print(f"[Watcher] ✅ Relatório atualizado às {datetime.now().strftime('%H:%M:%S')}")
            time.sleep(interval_sec)
        except KeyboardInterrupt:
            print("\n[Watcher] Encerrando.")
            break


# ---------------------------------------------------------------------------
# Entry-point
# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(
        description="Capitalism Lab Save Parser — Read-Only Game Companion"
    )
    ap.add_argument(
        'save', nargs='?',
        help='Caminho do arquivo .SAV (default: AUTO.SAV mais recente)'
    )
    ap.add_argument(
        '--watch', action='store_true',
        help='Modo watcher: monitora AUTO.SAV e regera relatório a cada autosave'
    )
    ap.add_argument(
        '--interval', type=int, default=30,
        help='Intervalo do watcher em segundos (default: 30)'
    )
    ap.add_argument(
        '--output', type=str, default=str(REPORT_PATH),
        help='Caminho do relatório de saída'
    )
    args = ap.parse_args()

    if args.watch:
        watch_mode(args.interval)
        return

    # Determina qual save usar
    if args.save:
        save_path = Path(args.save)
    else:
        # Usa o AUTO.SAV ou o save mais recente
        saves = list(SAVE_DIR.glob("*.SAV"))
        if not saves:
            print(f"[ERRO] Nenhum .SAV encontrado em {SAVE_DIR}")
            sys.exit(1)
        save_path = max(saves, key=lambda p: p.stat().st_mtime)
        print(f"[Parser] Usando save mais recente: {save_path.name}")

    parser  = CapLabSaveParser(save_path)
    snap    = parser.parse()

    if snap is None:
        print("[ERRO] Falha ao parsear o save.")
        sys.exit(1)

    builder = ReportBuilder()
    output  = Path(args.output)
    builder.save(snap, output)

    print(f"\n✅ Relatório gerado: {output}")
    print(f"   → Envie este arquivo para uma LLM com sua pergunta estratégica.")


if __name__ == '__main__':
    main()
