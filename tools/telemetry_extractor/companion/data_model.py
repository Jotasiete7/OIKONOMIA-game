"""
companion/data_model.py
=======================
Dataclasses tipadas para o snapshot de telemetria do Capitalism Lab.
Nenhuma lógica de I/O aqui — apenas estruturas de dados imutáveis.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from enum import Enum, auto


class GoalStatus(Enum):
    """Status de progresso de uma meta de market share."""
    OK      = auto()  # atual >= target
    DEFICIT = auto()  # atual <  target
    UNKNOWN = auto()  # dados não disponíveis


class ScreenType(Enum):
    """Tipo de tela detectada via OCR."""
    INCOME_STATEMENT = "Income Statement"
    GOALS_TRACKER    = "Goals Tracker"
    FACTORY_VIEW     = "Factory"
    STOCK_EXCHANGE   = "Stock Exchange"
    UNKNOWN          = "Unknown"


# ---------------------------------------------------------------------------
# Finanças
# ---------------------------------------------------------------------------

@dataclass
class FinanceData:
    """Dados extraídos da tela Corporate Income Statement."""
    operating_revenue:  Optional[float] = None   # Receita Operacional
    operating_profit:   Optional[float] = None   # Lucro Operacional
    net_profit:         Optional[float] = None   # Lucro Líquido
    corporate_cash:     Optional[float] = None   # Caixa Corporativo
    personal_cash:      Optional[float] = None   # Caixa Pessoal
    outstanding_loan:   Optional[float] = None   # Dívida Total
    monthly_interest:   Optional[float] = None   # Juros Mensais

    # Alvos (extraídos da tela, quando visíveis)
    revenue_target:     Optional[float] = None
    profit_target:      Optional[float] = None

    def revenue_pct(self) -> Optional[float]:
        """Percentual de progresso da receita em relação ao alvo."""
        if self.operating_revenue and self.revenue_target and self.revenue_target > 0:
            return (self.operating_revenue / self.revenue_target) * 100
        return None

    def profit_pct(self) -> Optional[float]:
        """Percentual de progresso do lucro em relação ao alvo."""
        if self.operating_profit and self.profit_target and self.profit_target > 0:
            return (self.operating_profit / self.profit_target) * 100
        return None

    def is_in_debt(self) -> bool:
        return bool(self.outstanding_loan and self.outstanding_loan > 0)

    def format_usd(self, value: Optional[float]) -> str:
        if value is None:
            return "N/A"
        if abs(value) >= 1_000_000_000:
            return f"${value/1_000_000_000:.2f}B"
        if abs(value) >= 1_000_000:
            return f"${value/1_000_000:.2f}M"
        if abs(value) >= 1_000:
            return f"${value/1_000:.1f}K"
        return f"${value:,.0f}"


# ---------------------------------------------------------------------------
# Metas de Market Share
# ---------------------------------------------------------------------------

@dataclass
class MarketShareGoal:
    """Meta de participação de mercado para um produto."""
    product:     str
    current_pct: float
    target_pct:  float = 50.0

    @property
    def status(self) -> GoalStatus:
        if self.current_pct >= self.target_pct:
            return GoalStatus.OK
        return GoalStatus.DEFICIT

    @property
    def gap(self) -> float:
        """Diferença em pontos percentuais para a meta."""
        return self.target_pct - self.current_pct

    @property
    def status_icon(self) -> str:
        return "✅" if self.status == GoalStatus.OK else "🔴"

    @property
    def status_label(self) -> str:
        return "OK" if self.status == GoalStatus.OK else f"DEFICIT ({self.gap:+.1f}pp)"


# ---------------------------------------------------------------------------
# Alertas de Fábrica / Supply Chain
# ---------------------------------------------------------------------------

@dataclass
class FactoryAlert:
    """Alerta de status de fábrica ou loja de varejo."""
    factory_name: str
    alert_type:   str   # ex: "OUT_OF_STOCK", "NO_INPUT", "CAPACITY_FULL"
    detail:       str   # descrição legível do alerta
    severity:     str = "WARNING"  # "WARNING" | "CRITICAL" | "INFO"

    @property
    def icon(self) -> str:
        icons = {"CRITICAL": "🚨", "WARNING": "⚠️", "INFO": "ℹ️"}
        return icons.get(self.severity, "⚠️")


# ---------------------------------------------------------------------------
# Oportunidades no Mercado de Ações
# ---------------------------------------------------------------------------

@dataclass
class StockOpportunity:
    """Oportunidade identificada no mercado de ações."""
    company:       str
    ticker:        Optional[str]  = None
    price:         Optional[float] = None
    pe_ratio:      Optional[float] = None
    shares_avail:  Optional[int]   = None  # ações disponíveis a mercado
    recommendation: str = "WATCH"  # "BUY" | "WATCH" | "AVOID"

    @property
    def summary(self) -> str:
        parts = [self.company]
        if self.ticker:
            parts.append(f"({self.ticker})")
        if self.price:
            parts.append(f"@ ${self.price:,.2f}")
        if self.pe_ratio:
            parts.append(f"P/E={self.pe_ratio:.1f}")
        parts.append(f"[{self.recommendation}]")
        return " ".join(parts)


# ---------------------------------------------------------------------------
# Snapshot completo de telemetria
# ---------------------------------------------------------------------------

@dataclass
class TelemetrySnapshot:
    """
    Snapshot completo de um momento de captura.
    Agrega todos os dados extraídos via OCR ou inspeção de arquivos.
    """
    timestamp:         datetime = field(default_factory=datetime.now)
    ingame_date:       Optional[str]               = None  # ex: "Jan 15, Year 10"
    screen_detected:   ScreenType                  = ScreenType.UNKNOWN
    finance:           FinanceData                 = field(default_factory=FinanceData)
    goals:             List[MarketShareGoal]       = field(default_factory=list)
    factory_alerts:    List[FactoryAlert]          = field(default_factory=list)
    stock_opps:        List[StockOpportunity]      = field(default_factory=list)
    raw_screenshot:    Optional[str]               = None  # caminho do cache
    product_list:      List[str]                   = field(default_factory=list)  # da inspeção de arquivos
    ocr_confidence:    float                       = 0.0   # 0.0–1.0
    parse_warnings:    List[str]                   = field(default_factory=list)

    def add_warning(self, msg: str) -> None:
        self.parse_warnings.append(msg)

    def goals_ok(self) -> List[MarketShareGoal]:
        return [g for g in self.goals if g.status == GoalStatus.OK]

    def goals_deficit(self) -> List[MarketShareGoal]:
        return [g for g in self.goals if g.status == GoalStatus.DEFICIT]

    def critical_alerts(self) -> List[FactoryAlert]:
        return [a for a in self.factory_alerts if a.severity == "CRITICAL"]

    @property
    def timestamp_str(self) -> str:
        return self.timestamp.strftime("%Y-%m-%d %H:%M:%S")
