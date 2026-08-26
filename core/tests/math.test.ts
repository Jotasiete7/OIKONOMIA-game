/**
 * tests/math.test.ts — Bateria de Testes Automatizados do Sim-Core Oficial
 */

import { calculatePriceRating, calculateProductRating } from '../src/math/rating.ts';
import { calculatePriceElasticityFactor } from '../src/math/elasticity.ts';
import { calculateQuadraticMarketShare } from '../src/math/marketShare.ts';
import { updateBrandRating } from '../src/math/brand.ts';
import { calculateManhattanDistance, calculateUnitFreight, calculateLandedCost } from '../src/math/logistics.ts';
import { calculateDailyMarketingExpense, updateProductBrandWithMarketing } from '../src/math/marketing.ts';
import { loadMasterData } from '../src/loader/stateLoader.ts';
import { tickDay } from '../src/simulation/tick.ts';
import type { ProductType } from '../src/types/index.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n==============================================================================');
console.log('       OIKONOMIA SIM-CORE — SUÍTE DE TESTES AUTOMATIZADOS OFICIAL             ');
console.log('==============================================================================\n');

// 1. Testes de Rating
console.log('--- 1. Rating & Formula Validation ---');
const dummyItem: ProductType = {
  id: 'bread',
  name: 'Pão',
  category: 'Food',
  standardPrice: 3.50,
  baseCost: 1.75,
  qualityRating: 50,
  brandRating: 0,
  necessityIndex: 85,
  qualityWeight: 45,
  brandWeight: 15,
  perCapitaDailyDemand: 0.025
};

const prNormal = calculatePriceRating(3.50, 3.50);
assert(prNormal === 50, 'Price Rating no Standard Price deve ser 50');

const prDiscount = calculatePriceRating(3.50, 1.75);
assert(prDiscount === 100, 'Price Rating com 50% de desconto deve ser 100');

const overall = calculateProductRating(dummyItem, 3.50, 50, 20);
assert(overall > 0 && overall <= 100, `Overall Rating deve estar entre 0 e 100 (obtido: ${overall})`);

// 2. Testes de Elasticidade
console.log('\n--- 2. Elasticity & Necessity Index ---');
const elastEssential = calculatePriceElasticityFactor(85, 3.50, 4.50);
const elastImpulse = calculatePriceElasticityFactor(30, 4.00, 5.14);

assert(
  elastEssential > elastImpulse,
  `Item essencial (elast: ${elastEssential}) deve reter mais demanda que supérfluo (elast: ${elastImpulse})`
);

// 3. Testes de Market Share
console.log('\n--- 3. Quadratic Market Share ---');
const share = calculateQuadraticMarketShare(60, 40, 25);
assert(share.playerShare > share.compShare, 'Jogador com rating 60 deve ter maior share que IA com rating 40');
assert(share.playerShare + share.compShare < 1.0, 'Soma dos shares corporativos deve deixar margem para comércio informal');

// 4. Testes de Brand & Evolução
console.log('\n--- 4. Brand Evolution & Decaimento ---');
const brandPlus = updateBrandRating(20, 5000);
assert(brandPlus > 20, `Lucro positivo deve expandir a marca (nova: ${brandPlus})`);

// 5. Testes de Logística e Frete
console.log('\n--- 5. Logistics, Distance & Freight Cost ---');
const distShort = calculateManhattanDistance({ x: 6, y: 6 }, { x: 10, y: 8 });
assert(distShort === 6, `Distância Manhattan esperada 6 tiles (obtido: ${distShort})`);

const freightShort = calculateUnitFreight(distShort, 0.015, 0.02);
assert(freightShort === 0.11, `Frete para 6 tiles deve ser $0.11 (obtido: ${freightShort})`);

const landed = calculateLandedCost(1.55, freightShort);
assert(landed === 1.66, `Custo de entrada (Landed Cost) deve ser $1.66 (obtido: ${landed})`);

const distLong = calculateManhattanDistance({ x: 6, y: 6 }, { x: 25, y: 25 });
const freightLong = calculateUnitFreight(distLong, 0.015, 0.02);
assert(freightLong > freightShort, 'Frete de loja distante deve ser maior que de loja próxima');

// 6. Testes de Mídia & Marketing (Tópico 2)
console.log('\n--- 6. Media, Marketing & Brand Campaigns ---');
const mockTvOutlet = {
  id: 'media_tv',
  name: 'Rede Capital TV',
  type: 'Televisão',
  monthlyCost: 2500,
  brandBoostMonthly: 15,
  brandCap: 95,
  reachPct: 100
};
const mockRadioOutlet = {
  id: 'media_radio',
  name: 'Rádio FM',
  type: 'Rádio',
  monthlyCost: 850,
  brandBoostMonthly: 8,
  brandCap: 75,
  reachPct: 65
};

const dailyMktCost = calculateDailyMarketingExpense([mockTvOutlet, mockRadioOutlet]); // (2500 + 850)/30 = 111.67
assert(dailyMktCost === 111.67, `Despesa diária de marketing esperada $111.67 (obtido: ${dailyMktCost})`);

const brandAfterTv = updateProductBrandWithMarketing(20, [mockTvOutlet], true);
assert(brandAfterTv === 36, `Marca inicial 20 com TV (+15+1) deve subir para 36 (obtido: ${brandAfterTv})`);

const brandCapped = updateProductBrandWithMarketing(90, [mockRadioOutlet], true);
assert(brandCapped === 75, `Rádio FM com teto 75 não deve ultrapassar 75 (obtido: ${brandCapped})`);

const brandDecayed = updateProductBrandWithMarketing(50, [], false);
assert(brandDecayed === 48, `Sem marketing ativo, marca 50 deve decair para 48 (obtido: ${brandDecayed})`);

// 7. Testes de Carregamento & Simulação Diária
console.log('\n--- 7. Master Data Loading & 30-Day Pipeline ---');
const state = loadMasterData();
assert(state.districts.length === 6, `Cidade deve conter exatamente 6 distritos (obtido: ${state.districts.length})`);
assert(Object.keys(state.catalog).length >= 10, 'Catálogo mestre deve carregar múltiplos produtos');

let curState = state;
for (let d = 1; d <= 30; d++) {
  curState = tickDay(curState);
}

assert(curState.month === 2, `Após 30 dias a simulação deve ter virado para o Mês 2 (obtido: Mês ${curState.month})`);
assert(curState.cash > 0, `Caixa acumulado deve permanecer positivo (caixa: $${curState.cash.toFixed(2)})`);

console.log('\n==============================================================================');
console.log(`  RESULTADO OFICIAL: ${passed} PASSADOS | ${failed} FALHAS`);
console.log('==============================================================================\n');

if (failed > 0) process.exit(1);
