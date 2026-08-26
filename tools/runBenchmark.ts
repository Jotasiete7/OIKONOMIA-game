/**
 * tools/runBenchmark.ts — Benchmark Rápido no Console (30 a 365 Dias)
 */

import { loadMasterData } from '../core/src/loader/stateLoader.ts';
import { tickDay } from '../core/src/simulation/tick.ts';
import type { GameState } from '../core/src/types/index.ts';

function formatMoney(val: number): string {
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function runBenchmark(totalDays: number = 30): void {
  console.log('==============================================================================');
  console.log('             OIKONOMIA — BENCHMARK DO MOTOR ECONÔMICO (CLI)                   ');
  console.log('==============================================================================\n');

  let state: GameState = loadMasterData();

  console.log(`🏙️  Cidade: ${state.cityName} | Quarteirões: ${state.districts.length}`);
  console.log(`💰 Capital Inicial: ${formatMoney(state.cash)}`);
  console.log(`📦 Catálogo: ${Object.keys(state.catalog).length} produtos mapeados\n`);

  console.log('------------------------------------------------------------------------------');
  console.log('Executando simulação de ' + totalDays + ' dias...\n');

  let cumulativeRevenue = 0;

  for (let d = 1; d <= totalDays; d++) {
    state = tickDay(state);
    cumulativeRevenue += state.monthRevenue;

    if (state.lastMonthReport && state.day === 1) {
      const rep = state.lastMonthReport;
      console.log(`📅 [FIM DO MÊS ${rep.month}] Receita: ${formatMoney(rep.grossRevenue)} | CPV: ${formatMoney(rep.cogs)} | Lucro Líquido: ${formatMoney(rep.netProfit)} | Caixa: ${formatMoney(rep.endingCash)}`);
    }
  }

  console.log('\n==============================================================================');
  console.log('                         RESULTADO FINAL DO BENCHMARK                         ');
  console.log('==============================================================================');
  console.log(`💵 Caixa Final:        ${formatMoney(state.cash)}`);
  console.log(`📈 Data Final:         Dia ${state.day} / Mês ${state.month} / Ano ${state.year}`);
  console.log(`🏷️  Brand Ratings:`);
  for (const [pId, br] of Object.entries(state.playerBrandRating)) {
    console.log(`   - ${pId.toUpperCase()}: ${br}/100`);
  }
  console.log('==============================================================================\n');
}

runBenchmark(30);
