/**
 * simulation_guard.js — Barreira de Integridade, Anti-NaN e Sanitização Contínua
 * OIKONOMIA v0.8.5
 * 
 * Protege o estado econômico da simulação contra contaminação silenciosa por:
 * - NaN (divisões por zero, multiplicações com undefined)
 * - Infinity / -Infinity (overflows em potências de elasticidade)
 * - Estoques ou preços negativos impossíveis
 * 
 * Funciona de forma não-bloqueante: repara valores anomalos in-place,
 * registra alertas na telemetria de debug e impede corrupção em saves e DRE.
 */

export const SimulationGuard = {
  _anomalies: [],
  maxLogEntries: 50,

  /**
   * Verifica se o valor é estritamente numérico e finito.
   */
  isFiniteNumber(val) {
    return typeof val === 'number' && Number.isFinite(val);
  },

  /**
   * Retorna o número se for finito, caso contrário retorna o fallback seguro.
   */
  safeNumber(val, fallback = 0) {
    return (typeof val === 'number' && Number.isFinite(val)) ? val : fallback;
  },

  /**
   * Divisão matematicamente segura que previne divisão por zero, NaN e Infinity.
   */
  safeDiv(numerator, denominator, fallback = 0) {
    if (typeof numerator !== 'number' || !Number.isFinite(numerator)) return fallback;
    if (typeof denominator !== 'number' || !Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) {
      return fallback;
    }
    const res = numerator / denominator;
    return Number.isFinite(res) ? res : fallback;
  },

  /**
   * Limita um valor entre mínimo e máximo garantindo retorno numérico finito.
   */
  clamp(val, min = 0, max = 100, fallback = min) {
    const num = this.safeNumber(val, fallback);
    const safeMin = this.safeNumber(min, 0);
    const safeMax = this.safeNumber(max, 100);
    if (safeMin > safeMax) return safeMin;
    return Math.max(safeMin, Math.min(safeMax, num));
  },

  /**
   * Valida se um valor econômico é finito. Se detectar NaN/Infinity,
   * emite aviso de auditoria, armazena no buffer de diagnóstico e aplica fallback.
   */
  assertFinite(val, label = 'Variável de Simulação', fallback = 0) {
    if (this.isFiniteNumber(val)) {
      return val;
    }

    const anomaly = {
      timestamp: new Date().toISOString(),
      label,
      invalidValue: String(val),
      repairedValue: fallback
    };

    this._anomalies.push(anomaly);
    if (this._anomalies.length > this.maxLogEntries) {
      this._anomalies.shift();
    }

    console.warn(`[SimulationGuard] ⚠ Detecção de anomalia numérica em "${label}": valor=${val}. Reparado automaticamente para ${fallback}.`);
    return fallback;
  },

  /**
   * Validação de integridade do estado econômico (executado no fechamento diário/mensal).
   * Inspeciona caixa, DRE, dívida e inventários de instalações ativas.
   */
  validateEconomySnapshot(state, activeFacilities = null) {
    if (!state || typeof state !== 'object') {
      return { valid: false, repaired: false, issues: ['Estado de jogo inválido ou nulo'] };
    }

    let repaired = false;
    const issues = [];

    // 1. Caixa Corporativo (Cash)
    if (!this.isFiniteNumber(state.cash)) {
      issues.push(`Caixa inválido (${state.cash}) reparado para 0`);
      state.cash = 0;
      repaired = true;
    }

    // 2. Acumuladores da DRE Mensal
    const dreFields = [
      'monthRevenue',
      'monthCogs',
      'monthFixedExpenses',
      'monthMarketingExpenses',
      'monthFinancialExpenses'
    ];
    for (const f of dreFields) {
      if (!this.isFiniteNumber(state[f])) {
        issues.push(`Campo da DRE "${f}" inválido (${state[f]}) zerado`);
        state[f] = 0;
        repaired = true;
      } else if (state[f] < 0 && f !== 'monthFinancialExpenses') {
        // Receita e custos nominais não devem ser negativos
        state[f] = Math.max(0, state[f]);
        repaired = true;
      }
    }

    // 3. Sistema Bancário & Dívidas
    if (state.banking && typeof state.banking === 'object') {
      if (Array.isArray(state.banking.activeLoans)) {
        for (let i = 0; i < state.banking.activeLoans.length; i++) {
          const l = state.banking.activeLoans[i];
          if (l) {
            if (!this.isFiniteNumber(l.remainingPrincipal) || l.remainingPrincipal < 0) {
              issues.push(`Empréstimo #${l.id || i}: saldo devedor inválido (${l.remainingPrincipal})`);
              l.remainingPrincipal = Math.max(0, this.safeNumber(l.remainingPrincipal, 0));
              repaired = true;
            }
          }
        }
      }
    }

    // 4. Instalações Ativas (Inventários e Gôndolas)
    if (activeFacilities) {
      const facilitiesList = activeFacilities instanceof Map
        ? activeFacilities.values()
        : (Array.isArray(activeFacilities) ? activeFacilities : []);

      for (const tile of facilitiesList) {
        // Fazendas
        if (tile.farm) {
          if (!this.isFiniteNumber(tile.farm.stock) || tile.farm.stock < 0) {
            tile.farm.stock = Math.max(0, this.safeNumber(tile.farm.stock, 0));
            repaired = true;
          }
          if (!this.isFiniteNumber(tile.farm.quality)) {
            tile.farm.quality = 50;
            repaired = true;
          }
        }

        // Minas
        if (tile.mine) {
          if (!this.isFiniteNumber(tile.mine.stock) || tile.mine.stock < 0) {
            tile.mine.stock = Math.max(0, this.safeNumber(tile.mine.stock, 0));
            repaired = true;
          }
        }

        // Armazéns
        if (tile.warehouse && tile.warehouse.inventory) {
          for (const item of Object.values(tile.warehouse.inventory)) {
            if (item) {
              if (!this.isFiniteNumber(item.stock) || item.stock < 0) {
                item.stock = Math.max(0, this.safeNumber(item.stock, 0));
                repaired = true;
              }
              if (!this.isFiniteNumber(item.avgCost) || item.avgCost < 0) {
                item.avgCost = Math.max(0.01, this.safeNumber(item.avgCost, 1.0));
                repaired = true;
              }
            }
          }
        }

        // Lojas (Gôndolas de Varejo)
        if (tile.store && tile.store.shelves) {
          for (const shelf of Object.values(tile.store.shelves)) {
            if (shelf) {
              if (!this.isFiniteNumber(shelf.stock) || shelf.stock < 0) {
                shelf.stock = Math.max(0, this.safeNumber(shelf.stock, 0));
                repaired = true;
              }
              if (!this.isFiniteNumber(shelf.price) || shelf.price <= 0) {
                issues.push(`Loja "${tile.store.name}": Preço inválido na gôndola (${shelf.price})`);
                shelf.price = Math.max(0.10, this.safeNumber(shelf.price, 2.0));
                repaired = true;
              }
            }
          }
        }
      }
    }

    return {
      valid: issues.length === 0,
      repaired,
      issues
    };
  },

  /**
   * Retorna o histórico de anomalias registradas para inspeção no Dev Dashboard.
   */
  getAnomalies() {
    return [...this._anomalies];
  },

  /**
   * Limpa o buffer de anomalias registradas.
   */
  clearAnomalies() {
    this._anomalies = [];
  }
};

// Exposição global para interoperabilidade
if (typeof window !== 'undefined') {
  window.SimulationGuard = SimulationGuard;
}

export default SimulationGuard;
