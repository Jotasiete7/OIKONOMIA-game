"""
companion/config.py
===================
Configurações centralizadas do Capitalism Lab Companion.
Caminhos, hotkeys, parâmetros de OCR e ROIs são definidos aqui.

⚠️  READ-ONLY SAFETY: Este módulo apenas LÊ caminhos do sistema.
     Nenhuma escrita é feita em diretórios do jogo.
"""

import os
import sys
from pathlib import Path
from dataclasses import dataclass, field
from typing import Dict, Tuple, Optional

# ---------------------------------------------------------------------------
# Caminhos do jogo (somente leitura)
# ---------------------------------------------------------------------------
_USERPROFILE = Path(os.environ.get("USERPROFILE", Path.home()))
_APPDATA     = Path(os.environ.get("APPDATA", _USERPROFILE / "AppData" / "Roaming"))

GAME_INSTALL_DIR   = Path(__file__).resolve().parent.parent  # pasta onde o CapMain.exe reside
GAME_SAVE_DIR      = _USERPROFILE / "Documents" / "My Games" / "Capitalism Lab" / "SAVE"
GAME_PRODUCTS_DIR  = _USERPROFILE / "Documents" / "My Games" / "Capitalism Lab" / "PRODUCTS"
GAME_CONFIG_DAT    = _USERPROFILE / "Documents" / "My Games" / "Capitalism Lab" / "CONFIG.DAT"
GAME_HALLOFAME     = _USERPROFILE / "Documents" / "My Games" / "Capitalism Lab" / "HALLOFAME.DAT"
GAME_TEXT_DIR      = GAME_INSTALL_DIR / "text"

# ---------------------------------------------------------------------------
# Caminhos do companion (escrita permitida SOMENTE aqui)
# ---------------------------------------------------------------------------
COMPANION_DIR      = Path(__file__).resolve().parent
CACHE_DIR          = COMPANION_DIR / "cache"
REPORT_PATH        = GAME_INSTALL_DIR / "game_telemetry_report.md"

# Garante que cache existe (nunca cria nada dentro do jogo)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Hotkeys configuráveis
# ---------------------------------------------------------------------------
HOTKEY_CAPTURE    = "ctrl+shift+f9"   # Captura tela e gera relatório
HOTKEY_CALIBRATE  = "ctrl+shift+f8"   # Modo calibração de ROIs
HOTKEY_QUIT       = "ctrl+shift+f10"  # Encerra o companion

# ---------------------------------------------------------------------------
# Parâmetros de OCR
# ---------------------------------------------------------------------------
TESSERACT_CMD: Optional[str] = None  # None = auto-detect via PATH
# Caminhos comuns do Tesseract no Windows:
_TESSERACT_CANDIDATES = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    r"C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe".format(
        os.environ.get("USERNAME", "")
    ),
]
for _candidate in _TESSERACT_CANDIDATES:
    if Path(_candidate).exists():
        TESSERACT_CMD = _candidate
        break

# Configuração do Tesseract para extração de dados financeiros
# PSM 6 = assume single uniform block of text
# OEM 3 = LSTM neural net engine
TESSERACT_CONFIG_NUMBERS = "--psm 6 --oem 3 -c tessedit_char_whitelist=0123456789$,.%-+()ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/ "
TESSERACT_CONFIG_FULL    = "--psm 6 --oem 3"

# ---------------------------------------------------------------------------
# ROIs (Regiões de Interesse) — coordenadas RELATIVAS à janela do jogo
# Formato: (x_offset, y_offset, width, height) em pixels
# Calibradas para 1920x1080 com janela maximizada. Ajustar via modo F8.
# ---------------------------------------------------------------------------

@dataclass
class ROIConfig:
    """Regiões de interesse para cada tela do jogo."""

    # --- Income Statement ---
    income_title:           Tuple[int,int,int,int] = (300, 30,  600, 40)
    income_revenue:         Tuple[int,int,int,int] = (300, 80,  500, 28)
    income_op_profit:       Tuple[int,int,int,int] = (300, 115, 500, 28)
    income_net_profit:      Tuple[int,int,int,int] = (300, 150, 500, 28)
    income_cash:            Tuple[int,int,int,int] = (300, 185, 500, 28)
    income_loan:            Tuple[int,int,int,int] = (300, 220, 500, 28)
    income_interest:        Tuple[int,int,int,int] = (300, 255, 500, 28)
    income_ingame_date:     Tuple[int,int,int,int] = (10,  5,   250, 28)

    # --- SubGoals / Goals Tracker ---
    goals_panel:            Tuple[int,int,int,int] = (10,  50,  900, 600)

    # --- Factory View ---
    factory_name:           Tuple[int,int,int,int] = (10,  30,  400, 30)
    factory_status_block:   Tuple[int,int,int,int] = (10,  70,  900, 500)

    # --- Stock Exchange ---
    stock_panel:            Tuple[int,int,int,int] = (10,  50,  900, 550)

    # --- HUD geral (data do jogo sempre visível) ---
    hud_date:               Tuple[int,int,int,int] = (5,   3,   200, 22)

# ROI padrão (pode ser sobrescrito por companion/cache/rois.json se calibrado)
DEFAULT_ROI = ROIConfig()

# ---------------------------------------------------------------------------
# Nomes de janela do processo
# ---------------------------------------------------------------------------
GAME_WINDOW_TITLE   = "Capitalism Lab"
GAME_PROCESS_NAME   = "CapMain.exe"

# ---------------------------------------------------------------------------
# Limiares de alerta
# ---------------------------------------------------------------------------
MARKET_SHARE_TARGET    = 50.0   # % alvo de market share (configurável)
STOCK_LEVEL_ALERT      = 0      # nível de estoque que dispara alerta
LOW_CASH_ALERT_USD     = 1_000_000  # \$1M — alerta de caixa baixo

# ---------------------------------------------------------------------------
# Impressão de diagnóstico
# ---------------------------------------------------------------------------
def print_config_summary() -> None:
    """Imprime sumário de configuração no console."""
    print("=" * 60)
    print("  CAPITALISM LAB COMPANION — CONFIG SUMMARY")
    print("=" * 60)
    print(f"  Install dir : {GAME_INSTALL_DIR}")
    print(f"  Save dir    : {GAME_SAVE_DIR} ({'✅ encontrado' if GAME_SAVE_DIR.exists() else '❌ não encontrado'})")
    print(f"  Products dir: {GAME_PRODUCTS_DIR} ({'✅ encontrado' if GAME_PRODUCTS_DIR.exists() else '❌ não encontrado'})")
    print(f"  Tesseract   : {TESSERACT_CMD or '⚠️  não encontrado (OCR desabilitado)'}")
    print(f"  Cache dir   : {CACHE_DIR}")
    print(f"  Relatório   : {REPORT_PATH}")
    print(f"  Hotkey      : {HOTKEY_CAPTURE.upper()} → capturar + reportar")
    print(f"  Calibrar    : {HOTKEY_CALIBRATE.upper()} → calibrar ROIs")
    print(f"  Sair        : {HOTKEY_QUIT.upper()} → encerrar companion")
    print("=" * 60)
