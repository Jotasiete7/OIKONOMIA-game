"""
Capitalism Lab — Game Companion Telemetry Tool
==============================================
Pacote de módulos para captura passiva (read-only / OCR) de dados
do jogo Capitalism Lab e geração de relatórios para consumo por LLMs.

⚠️  REGRA DE SEGURANÇA: Este pacote NUNCA escreve em arquivos do jogo.
     Toda escrita ocorre somente em game_telemetry_report.md e companion/cache/.
"""

__version__ = "1.0.0"
__author__ = "Capitalism Lab Companion — Sidecar/Read-Only Tool"

from .config import CompanionConfig
from .data_model import TelemetrySnapshot, FinanceData, MarketShareGoal

__all__ = [
    "CompanionConfig",
    "TelemetrySnapshot",
    "FinanceData",
    "MarketShareGoal",
]
