/**
 * OIKONOMIA - Price Simulator Panel ("E se?" Sandbox)
 * client/ui/panels/price_simulator_panel.js
 *
 * Simulates pricing scenarios in real time:
 * - Dynamic product rating vs competition
 * - Price elasticity of demand factor
 * - Projected quadratic market share
 * - Expected daily sales, daily revenue, COGS, gross margin & monthly net profit
 */

import CoreMath from '../../core_math.js';

export const PriceSimulatorPanel = {
  priceSimTarget: null,

  openPriceSimulatorModal(x, y, prodId) {
    const grid = typeof window !== 'undefined' ? window.worldGrid : null;
    const catalog = typeof window !== 'undefined' ? window.PRODUCT_CATALOG : null;
    const tile = grid ? grid[x]?.[y] : null;
    const shelf = tile?.store?.shelves?.[prodId];
    const prod = catalog ? catalog[prodId] : null;
    if (!tile || !shelf || !prod) return;

    const brand = (typeof window !== 'undefined' && window.playerBrandRating)
      ? (window.playerBrandRating[prodId] || 20)
      : 20;
    const d = tile.district;

    this.priceSimTarget = {
      x,
      y,
      prodId,
      currentPrice: shelf.price,
      landedCost: shelf.landedCost || prod.baseCost,
      quality: shelf.quality || 50,
      brand,
      standardPrice: prod.standardPrice,
      necessityIndex: prod.necessityIndex,
      perCapitaDailyDemand: prod.perCapitaDailyDemand,
      pop: d.population,
      traffic: d.trafficIndex,
      storeName: tile.store.name,
      districtName: d.name
    };

    const subtitleEl = document.getElementById('sim-product-subtitle');
    if (subtitleEl) {
      subtitleEl.textContent = `${prod.name} · ${this.priceSimTarget.storeName} (${this.priceSimTarget.districtName})`;
    }

    const currLabel = document.getElementById('sim-current-price-label');
    if (currLabel) {
      currLabel.textContent = `Atual: $${shelf.price.toFixed(2)}`;
    }

    const slider = document.getElementById('sim-price-slider');
    if (slider) {
      const minP = Math.max(0.5, Number((prod.standardPrice * 0.3).toFixed(2)));
      const maxP = Number((prod.standardPrice * 2.8).toFixed(2));
      slider.min = minP;
      slider.max = maxP;
      slider.step = minP < 2 ? '0.10' : '0.50';
      slider.value = shelf.price;
    }

    this.updatePriceSimulatorLive();
    const modal = document.getElementById('price-simulator-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closePriceSimulatorModal() {
    const modal = document.getElementById('price-simulator-modal');
    if (modal) modal.classList.add('hidden');
    this.priceSimTarget = null;
  },

  updatePriceSimulatorLive() {
    if (!this.priceSimTarget) return;
    const slider = document.getElementById('sim-price-slider');
    if (!slider) return;

    const simPrice = parseFloat(slider.value);
    const catalog = typeof window !== 'undefined' ? window.PRODUCT_CATALOG : null;
    const prod = catalog ? catalog[this.priceSimTarget.prodId] : null;
    if (!prod) return;

    const priceDisp = document.getElementById('sim-price-display');
    if (priceDisp) priceDisp.textContent = `$${simPrice.toFixed(2)}`;

    // Fórmulas Determinísticas do Core Engine
    const mathMod = (typeof window !== 'undefined' && window.CoreMath) ? window.CoreMath : CoreMath;
    const rating = mathMod.calculateProductRating
      ? mathMod.calculateProductRating(prod, simPrice, this.priceSimTarget.quality, this.priceSimTarget.brand)
      : (typeof window.calcProductRating === 'function' ? window.calcProductRating(prod, simPrice, this.priceSimTarget.quality, this.priceSimTarget.brand) : 50);

    const elast = mathMod.calculatePriceElasticityFactor
      ? mathMod.calculatePriceElasticityFactor(this.priceSimTarget.necessityIndex, this.priceSimTarget.standardPrice, simPrice, this.priceSimTarget.quality)
      : (typeof window.calcElasticity === 'function' ? window.calcElasticity(this.priceSimTarget.necessityIndex, this.priceSimTarget.standardPrice, simPrice, this.priceSimTarget.quality) : 1);

    // Market share real via CoreMath, espelhando exatamente o tick de vendas de simulateDay()
    const grid = typeof window !== 'undefined' ? window.worldGrid : null;
    const simTile = grid ? grid[this.priceSimTarget.x]?.[this.priceSimTarget.y] : null;
    let simCompRating = 0;
    if (simTile && grid) {
      const nb = grid[simTile.x + 1]?.[simTile.y]?.competitor ||
                 grid[simTile.x]?.[simTile.y + 1]?.competitor ||
                 grid[simTile.x - 1]?.[simTile.y]?.competitor ||
                 grid[simTile.x]?.[simTile.y - 1]?.competitor ||
                 simTile.competitor;
      const cs = nb?.shelves?.[this.priceSimTarget.prodId];
      if (cs) {
        simCompRating = mathMod.calculateProductRating
          ? mathMod.calculateProductRating(prod, cs.price, cs.quality, cs.brand || 30)
          : (typeof window.calcProductRating === 'function' ? window.calcProductRating(prod, cs.price, cs.quality, cs.brand || 30) : 40);
      }
    }

    const { playerShare: simShare } = mathMod.calculateQuadraticMarketShare
      ? mathMod.calculateQuadraticMarketShare(rating, simCompRating, 25)
      : { playerShare: 0.5 };

    const rawDailySales = this.priceSimTarget.pop * this.priceSimTarget.perCapitaDailyDemand * (this.priceSimTarget.traffic / 100) * simShare * elast;
    const dailyRevenue = rawDailySales * simPrice;
    const dailyCogs = rawDailySales * this.priceSimTarget.landedCost;
    const dailyGrossProfit = dailyRevenue - dailyCogs;
    const monthlyNetProfit = Math.round(dailyGrossProfit * 30);
    const markupPct = Math.round(((simPrice - this.priceSimTarget.landedCost) / this.priceSimTarget.landedCost) * 100);

    const salesDisplayStr = rawDailySales >= 1.0
      ? `${Math.round(rawDailySales).toLocaleString()} un/dia`
      : `${rawDailySales.toFixed(2)} un/dia (~${Math.round(rawDailySales * 30)} un/mês)`;

    const salesDispEl = document.getElementById('sim-sales-display');
    if (salesDispEl) salesDispEl.textContent = salesDisplayStr;

    const revDispEl = document.getElementById('sim-revenue-display');
    if (revDispEl) revDispEl.textContent = `$${dailyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/dia`;

    const marginDispEl = document.getElementById('sim-margin-display');
    if (marginDispEl) {
      marginDispEl.textContent = `${markupPct >= 0 ? '+' : ''}${markupPct}%`;
      marginDispEl.className = `text-xs font-bold ${markupPct >= 0 ? 'text-amber-300' : 'text-rose-400'}`;
    }

    const profitDispEl = document.getElementById('sim-profit-display');
    if (profitDispEl) {
      profitDispEl.textContent = `${monthlyNetProfit >= 0 ? '+$' : '-$'}${Math.abs(monthlyNetProfit).toLocaleString('en-US')}/mês`;
      profitDispEl.className = `text-xs font-bold ${monthlyNetProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`;
    }

    const ratingBadge = document.getElementById('sim-rating-badge');
    if (ratingBadge) {
      ratingBadge.textContent = `Score de Atratividade: ${rating}/100`;
      ratingBadge.className = `text-[9px] px-1.5 py-0.2 rounded font-mono ${rating >= 60 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : rating >= 40 ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`;
    }

    const analysisText = document.getElementById('sim-analysis-text');
    if (analysisText) {
      const diffPct = Math.round(((simPrice - this.priceSimTarget.currentPrice) / this.priceSimTarget.currentPrice) * 100);
      const diffStr = diffPct === 0
        ? 'mantém o preço atual'
        : (diffPct > 0 ? `aumento de +${diffPct}% sobre o preço atual` : `desconto de ${Math.abs(diffPct)}% sobre o preço atual`);

      let elastAnalysis = '';
      if (elast > 1.2) {
        elastAnalysis = '🚀 Preço super competitivo! Grande atração de clientes sensíveis a preço no bairro.';
      } else if (elast < 0.7) {
        elastAnalysis = '⚠️ Preço elevado reduz o volume de vendas, mas pode ser lucrativo se a margem compensar.';
      } else {
        elastAnalysis = '⚖️ Ponto de equilíbrio equilibrado entre giro de estoque e margem unitária.';
      }

      let qrTip = '';
      if (this.priceSimTarget.quality > 50) {
        const wtpBonus = Math.round((this.priceSimTarget.quality - 50) * 0.75);
        qrTip = ` <span class="text-cyan-300 font-bold">✨ Qualidade Superior (QR ${this.priceSimTarget.quality}):</span> Bônus de tolerância de preço de +${wtpBonus}% pelo valor agregado da marca.`;
      }

      const compNote = simCompRating > 0
        ? ` Projeção considera o concorrente vizinho (rating ${simCompRating}/100) disputando este mercado.`
        : ` Nenhum concorrente vizinho ativo detectado — projeção assume mercado local sem disputa direta.`;
      analysisText.innerHTML = `Com $${simPrice.toFixed(2)} (${diffStr}), sua margem unitária é de <strong>${markupPct}%</strong>. ${elastAnalysis}${qrTip}${compNote}`;
    }
  },

  applyPriceSimulatorResult() {
    if (!this.priceSimTarget) return;
    const slider = document.getElementById('sim-price-slider');
    if (!slider) return;

    const simPrice = parseFloat(slider.value);
    const storeWizard = typeof window !== 'undefined' ? window.StoreWizard : null;
    if (storeWizard && typeof storeWizard.updateShelfPrice === 'function') {
      storeWizard.updateShelfPrice(this.priceSimTarget.x, this.priceSimTarget.y, this.priceSimTarget.prodId, simPrice);
    } else if (typeof window !== 'undefined' && typeof window.updateShelfPrice === 'function') {
      window.updateShelfPrice(this.priceSimTarget.x, this.priceSimTarget.y, this.priceSimTarget.prodId, simPrice);
    }

    const catalog = typeof window !== 'undefined' ? window.PRODUCT_CATALOG : null;
    const prodName = catalog?.[this.priceSimTarget.prodId]?.name || this.priceSimTarget.prodId;

    if (typeof window !== 'undefined' && typeof window.addGameLog === 'function') {
      window.addGameLog(`📊 SIMULADOR 'E SE?': Preço de ${prodName} ajustado para $${simPrice.toFixed(2)}!`, 'text-indigo-300 font-bold');
    } else if (typeof window !== 'undefined' && typeof window.addLog === 'function') {
      window.addLog(`📊 SIMULADOR 'E SE?': Preço de ${prodName} ajustado para $${simPrice.toFixed(2)}!`, 'text-indigo-300 font-bold');
    }
    this.closePriceSimulatorModal();
  }
};

// Global bindings for inline DOM events
if (typeof window !== 'undefined') {
  window.PriceSimulatorPanel = PriceSimulatorPanel;
  window.openPriceSimulatorModal = PriceSimulatorPanel.openPriceSimulatorModal.bind(PriceSimulatorPanel);
  window.closePriceSimulatorModal = PriceSimulatorPanel.closePriceSimulatorModal.bind(PriceSimulatorPanel);
  window.updatePriceSimulatorLive = PriceSimulatorPanel.updatePriceSimulatorLive.bind(PriceSimulatorPanel);
  window.applyPriceSimulatorResult = PriceSimulatorPanel.applyPriceSimulatorResult.bind(PriceSimulatorPanel);
}

export default PriceSimulatorPanel;
