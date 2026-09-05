/**
 * banking_system.js — Motor Bancário Corporativo (Banco Central de Nova Atenas)
 * OIKONOMIA v0.8.5
 *
 * Módulo IIFE puro — sem dependências de DOM.
 * Exposto via window.BankingSystem para uso em index.html.
 */
const BankingSystem = (() => {
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // CONSTANTES DE CONFIGURAÇÃO
  // ═══════════════════════════════════════════════════════════

  /** Planos de empréstimo disponíveis: curto, médio e longo prazo */
  const LOAN_PLANS = [
    { months: 6,  monthlyRate: 0.028, label: '6 meses',  riskPremium: 0.003 },
    { months: 12, monthlyRate: 0.020, label: '12 meses', riskPremium: 0.002 },
    { months: 24, monthlyRate: 0.015, label: '24 meses', riskPremium: 0.001 },
  ];

  const TERRITORIAL_BONUS_PER_CITY = 15000; // +$15k de score por cidade com presença
  const TECH_SCORE_CAP             = 200000; // teto de contribuição de P&D
  const REPUTATION_SCORE_CAP       = 150000; // teto de contribuição de reputação
  const CREDIT_LIMIT_RATIO         = 0.60;   // limite de crédito = 60% do score total
  const MAX_ACTIVE_LOANS           = 3;       // máximo de empréstimos simultâneos
  const RECESSION_RATE_DISCOUNT    = 0.003;  // desconto de 0,3%/mês durante Recessão

  /** Níveis de rating de crédito em ordem decrescente */
  const RATING_TIERS = [
    { min: 800000, label: 'AAA', color: 'emerald', tailwind: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-700/60', desc: 'Corporação Elite' },
    { min: 500000, label: 'AA',  color: 'emerald', tailwind: 'text-emerald-300', bg: 'bg-emerald-950/50', border: 'border-emerald-700/50', desc: 'Empresa Sólida' },
    { min: 250000, label: 'A',   color: 'blue',    tailwind: 'text-blue-300',    bg: 'bg-blue-950/60',   border: 'border-blue-700/60',   desc: 'Boa Reputação' },
    { min: 100000, label: 'BBB', color: 'amber',   tailwind: 'text-amber-300',   bg: 'bg-amber-950/60',  border: 'border-amber-700/60',  desc: 'Crédito Moderado' },
    { min: 40000,  label: 'BB',  color: 'orange',  tailwind: 'text-orange-300',  bg: 'bg-orange-950/60', border: 'border-orange-700/60', desc: 'Risco Médio' },
    { min: 0,      label: 'B',   color: 'rose',    tailwind: 'text-rose-300',    bg: 'bg-rose-950/60',   border: 'border-rose-700/60',   desc: 'Crédito Limitado' },
  ];

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO DO SCORE DE CRÉDITO
  // ═══════════════════════════════════════════════════════════

  /**
   * Calcula o Score de Crédito Corporativo com 4 componentes independentes.
   *
   * @param {Object} params
   * @param {number} params.cash                  Caixa atual (pode ser negativo)
   * @param {number} params.facilityAssets        Soma dos ativos de instalações (sem caixa)
   * @param {number} params.totalBankingDebt      Saldo devedor total de empréstimos ativos
   * @param {number} params.citiesWithPresence    Número de cidades com pelo menos uma instalação
   * @param {number} params.unlockedProductsCount Número de produtos desbloqueados via P&D
   * @param {number} params.avgQR                 QR médio dos projetos de P&D pesquisados
   * @param {number} params.avgBrand              Brand rating médio dos produtos ativos
   * @param {number} params.yearsActive           Anos de operação (year - 1)
   * @returns {Object} Score completo com rating, componentes e limites
   */
  function calcCreditScore(params) {
    const {
      cash = 0,
      facilityAssets = 0,
      totalBankingDebt = 0,
      citiesWithPresence = 0,
      unlockedProductsCount = 0,
      avgQR = 0,
      avgBrand = 20,
      yearsActive = 0,
    } = params;

    // Componente A — Patrimônio Líquido
    // cash (pode ser negativo = cheque especial) + ativos - dívida bancária
    const netWorthRaw = cash + facilityAssets - totalBankingDebt;
    const A = Math.max(0, netWorthRaw); // nunca negativo no score

    // Componente B — Cobertura Territorial (diversificação geográfica)
    const B = citiesWithPresence * TERRITORIAL_BONUS_PER_CITY;

    // Componente C — Nível Tecnológico (P&D)
    const techRaw = (unlockedProductsCount * 2000) + (avgQR * 500);
    const C = Math.min(techRaw, TECH_SCORE_CAP);

    // Componente D — Reputação de Mercado (brand + tempo de operação)
    const reputationRaw = (avgBrand * 800) + (yearsActive * 3000);
    const D = Math.min(reputationRaw, REPUTATION_SCORE_CAP);

    const totalScore   = A + B + C + D;
    const rawCreditLimit = totalScore * CREDIT_LIMIT_RATIO;
    const availableLimit = Math.max(0, rawCreditLimit - totalBankingDebt);
    const creditRating   = getCreditRatingLabel(totalScore);

    return {
      netWorth:       A,
      territorial:    B,
      tech:           C,
      reputation:     D,
      totalScore,
      rawCreditLimit,
      availableLimit,
      creditRating,
    };
  }

  /**
   * Retorna o tier de rating para um score dado.
   * @param {number} score
   * @returns {Object} tier com label, color, tailwind, bg, border, desc
   */
  function getCreditRatingLabel(score) {
    for (const tier of RATING_TIERS) {
      if (score >= tier.min) return { ...tier };
    }
    return { ...RATING_TIERS[RATING_TIERS.length - 1] };
  }

  // ═══════════════════════════════════════════════════════════
  // CÁLCULO DE EMPRÉSTIMOS — AMORTIZAÇÃO PRICE
  // ═══════════════════════════════════════════════════════════

  /**
   * Fórmula de amortização Price (parcela constante).
   * @param {number} principal   Valor do empréstimo
   * @param {number} monthlyRate Taxa de juros mensal (ex: 0.020 = 2%)
   * @param {number} months      Número de parcelas
   * @returns {number} Valor da parcela mensal
   */
  function calcMonthlyInstallment(principal, monthlyRate, months) {
    if (monthlyRate === 0 || months === 0) return principal / Math.max(1, months);
    const factor = Math.pow(1 + monthlyRate, months);
    return (principal * (monthlyRate * factor)) / (factor - 1);
  }

  /**
   * Calcula a taxa efetiva ajustando pelo rating (prêmio de risco para ratings baixos).
   * @param {Object} plan         Plano de empréstimo (de LOAN_PLANS)
   * @param {string} ratingLabel  Label do rating (AAA, AA, A, BBB, BB, B)
   * @returns {number} Taxa mensal efetiva
   */
  function getEffectiveRate(plan, ratingLabel) {
    const premiums = { 'AAA': 0, 'AA': 0, 'A': 0.001, 'BBB': 0.002, 'BB': 0.003, 'B': 0.005 };
    return plan.monthlyRate + (premiums[ratingLabel] || 0.005);
  }

  /**
   * Calcula o valor de quitação antecipada com 50% de desconto nos juros futuros.
   * @param {Object} loan Objeto de empréstimo ativo
   * @returns {number} Valor a pagar para quitar antecipadamente
   */
  function calcEarlyPayoffAmount(loan) {
    const totalFuturePayments  = loan.monthlyInstallment * loan.monthsRemaining;
    const remainingInterest    = Math.max(0, totalFuturePayments - loan.remainingBalance);
    const discount             = remainingInterest * 0.50;
    return Math.round(loan.remainingBalance + remainingInterest - discount);
  }

  /**
   * Cria um objeto de empréstimo completo para inserção no estado.
   * @param {number} principal    Valor solicitado
   * @param {Object} plan         Plano selecionado (de LOAN_PLANS)
   * @param {string} ratingLabel  Label do rating atual
   * @param {Object} gameDate     { day, month, year }
   * @returns {Object} Objeto de empréstimo pronto para banking.activeLoans
   */
  function createLoanObject(principal, plan, ratingLabel, gameDate) {
    const effectiveRate      = getEffectiveRate(plan, ratingLabel);
    const monthlyInstallment = calcMonthlyInstallment(principal, effectiveRate, plan.months);
    const id = `loan_${Date.now()}_${Math.floor(Math.random() * 9999)}`;

    return {
      id,
      principal,
      remainingBalance:    principal,
      monthlyInstallment:  Number(monthlyInstallment.toFixed(2)),
      monthlyRate:         effectiveRate,
      monthsRemaining:     plan.months,
      monthsTaken:         0,
      dateTaken:           { ...gameDate },
      plan:                plan.label,
      planMonths:          plan.months,
      earlyPayoff:         false,
      totalPaid:           0,
    };
  }

  /**
   * Processa a parcela mensal de um empréstimo.
   * Durante Recessão, recalcula a parcela com taxa reduzida em 0,3%
   * (desconto de política monetária anticíclica).
   * O objeto do contrato original não é modificado — apenas o mês corrente.
   *
   * @param {Object}  loan        Objeto de empréstimo ativo (será mutado)
   * @param {boolean} isRecession Se true, aplica desconto da recessão
   * @returns {{ installment: number, isFullyPaid: boolean }}
   */
  function processMonthlyInstallment(loan, isRecession) {
    // Determina taxa efetiva deste mês
    let effectiveRate = loan.monthlyRate;
    if (isRecession) {
      effectiveRate = Math.max(0.005, loan.monthlyRate - RECESSION_RATE_DISCOUNT);
    }

    // Recalcula parcela deste mês com taxa vigente (pode ser diferente do contrato durante recessão)
    let installment;
    if (isRecession && loan.monthsRemaining > 1) {
      installment = Number(
        calcMonthlyInstallment(loan.remainingBalance, effectiveRate, loan.monthsRemaining).toFixed(2)
      );
    } else {
      installment = loan.monthlyInstallment;
    }

    // Limita ao saldo devedor (última parcela pode ser menor)
    installment = Math.min(installment, loan.remainingBalance);

    // Amortização Price: parcela - juros do período = amortização
    const interestPortion = loan.remainingBalance * effectiveRate;
    const amortization    = Math.max(0, installment - interestPortion);

    loan.remainingBalance = Math.max(0, Number((loan.remainingBalance - amortization).toFixed(2)));
    loan.monthsRemaining  = Math.max(0, loan.monthsRemaining - 1);
    loan.monthsTaken      = (loan.monthsTaken || 0) + 1;
    loan.totalPaid        = (loan.totalPaid || 0) + installment;

    const isFullyPaid = loan.monthsRemaining <= 0 || loan.remainingBalance < 0.01;

    return { installment, isFullyPaid };
  }

  // ═══════════════════════════════════════════════════════════
  // FORMATAÇÃO AUXILIAR
  // ═══════════════════════════════════════════════════════════

  /** Formata número como moeda compacta ($1.2k, $150k, $1.5M) */
  function fmtCurrency(n) {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
    return `$${Math.round(n).toLocaleString('en-US')}`;
  }

  /** Formata número como moeda completa */
  function fmtFull(n) {
    return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  // ═══════════════════════════════════════════════════════════
  // API PÚBLICA
  // ═══════════════════════════════════════════════════════════

  return {
    // Constantes
    LOAN_PLANS,
    RATING_TIERS,
    MAX_ACTIVE_LOANS,
    TERRITORIAL_BONUS_PER_CITY,
    CREDIT_LIMIT_RATIO,
    // Score
    calcCreditScore,
    getCreditRatingLabel,
    // Empréstimos
    calcMonthlyInstallment,
    calcEarlyPayoffAmount,
    createLoanObject,
    processMonthlyInstallment,
    getEffectiveRate,
    // Helpers
    fmtCurrency,
    fmtFull,
  };
})();

if (typeof window !== 'undefined') window.BankingSystem = BankingSystem;
