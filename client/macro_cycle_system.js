/**
 * macro_cycle_system.js - Motor Macroeconômico de Ciclos Plurianuais (10 Anos)
 * OIKONOMIA Tycoon Engine (Ondas de Kitchin / Juglar / Flutuações de PIB e Insumos)
 */
const MacroCycleSystem = (() => {
  const CYCLE_DURATION_YEARS = 10;

  const PHASES = [
    {
      phase: 1,
      name: 'Retomada & Estabilidade',
      code: 'RECOVERY',
      emoji: '🌱',
      badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800',
      years: [1, 2],
      gdpDemandMult: 1.05,
      wholesaleCostMult: 1.00,
      techDiscount: 0.0,
      desc: 'Crescimento moderado e sustentável. Momento seguro para construir e expandir.',
      startAlert: '🔥 🌱 BANCO CENTRAL: A economia entra no ciclo de Retomada! PIB em alta (+5%) e crédito estabilizado.'
    },
    {
      phase: 2,
      name: 'Expansão & Superaquecimento',
      code: 'BOOM',
      emoji: '🔥',
      badgeClass: 'bg-amber-950 text-amber-300 border-amber-800',
      years: [3, 4, 5],
      gdpDemandMult: 1.20,
      wholesaleCostMult: 1.15,
      techDiscount: 0.0,
      desc: 'Boom de consumo nas cidades (+20%). Matérias-primas e insumos sobem +15% pela alta procura.',
      startAlert: '🔥 🚀 BOOM ECONÔMICO: A economia entra em Superaquecimento! Demanda de consumo salta +20% no varejo.'
    },
    {
      phase: 3,
      name: 'Saturação & Desaceleração',
      code: 'SATURATION',
      emoji: '⚠️',
      badgeClass: 'bg-orange-950 text-orange-300 border-orange-800',
      years: [6, 7],
      gdpDemandMult: 0.95,
      wholesaleCostMult: 1.05,
      techDiscount: 0.10,
      desc: 'Estoques acumulados no varejo. Margens apertadas e concorrência agressiva.',
      startAlert: '🚨 ⚠️ RELATÓRIO DE MERCADO: Economia atinge o topo do ciclo. Vendas desaceleram e estoques começam a encalhar.'
    },
    {
      phase: 4,
      name: 'Recessão & Liquidação de Ativos',
      code: 'RECESSION',
      emoji: '📉',
      badgeClass: 'bg-rose-950 text-rose-300 border-rose-800',
      years: [8, 9, 10],
      gdpDemandMult: 0.80,
      wholesaleCostMult: 0.80,
      techDiscount: 0.35,
      desc: 'Consumo retrai -20%. Insumos no porto caem -20% e patentes de concorrentes com 35% de desconto!',
      startAlert: '🚨 📉 RECESSÃO & AJUSTE MACRO: Consumo retrai -20%. Insumos caem -20% e patentes rivais entram em liquidação (-35%)!'
    }
  ];

  function getCycleYear(year) {
    const y = Number(year) || 1;
    return ((y - 1) % CYCLE_DURATION_YEARS) + 1; // Retorna de 1 a 10
  }

  function getPhaseInfo(year) {
    const cy = getCycleYear(year);
    return PHASES.find(p => p.years.includes(cy)) || PHASES[0];
  }

  function getDemandMultiplier(year) {
    return getPhaseInfo(year).gdpDemandMult || 1.0;
  }

  function getWholesaleCostMultiplier(year) {
    return getPhaseInfo(year).wholesaleCostMult || 1.0;
  }

  function getTechDiscountMultiplier(year) {
    return getPhaseInfo(year).techDiscount || 0.0;
  }

  function onYearChange(oldYear, newYear) {
    const oldPhase = getPhaseInfo(oldYear);
    const newPhase = getPhaseInfo(newYear);

    // Se o novo ano iniciou uma nova fase macroeconômica, emite alerta de transição
    if (oldPhase.phase !== newPhase.phase) {
      if (typeof addLog === 'function') {
        addLog(newPhase.startAlert, 'text-amber-300 font-bold', { isAlert: true });
      }
    }
  }

  function getHUDLabel(year) {
    const cy = getCycleYear(year);
    const phase = getPhaseInfo(year);
    return {
      text: `${phase.emoji} Ano ${cy}/10 · ${phase.name}`,
      shortText: `${phase.emoji} Ano ${cy} · ${phase.code}`,
      badgeClass: phase.badgeClass,
      desc: phase.desc
    };
  }

  return {
    CYCLE_DURATION_YEARS,
    PHASES,
    getCycleYear,
    getPhaseInfo,
    getCurrentCycle: getPhaseInfo,
    getDemandMultiplier,
    getWholesaleCostMultiplier,
    getTechDiscountMultiplier,
    onYearChange,
    getHUDLabel
  };
})();

export default MacroCycleSystem;
