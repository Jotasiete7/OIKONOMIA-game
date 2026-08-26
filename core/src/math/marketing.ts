/**
 * math/marketing.ts — Motor Matemático de Mídia, Publicidade e Evolução de Marca
 */

export interface MediaOutletDef {
  id: string;
  name: string;
  type: string;
  monthlyCost: number;
  brandBoostMonthly: number;
  brandCap: number;
  reachPct: number;
}

/**
 * Calcula o custo diário de uma lista de contratos de publicidade ativos
 */
export function calculateDailyMarketingExpense(
  activeOutlets: MediaOutletDef[]
): number {
  const monthlyTotal = activeOutlets.reduce((sum, o) => sum + o.monthlyCost, 0);
  return Number((monthlyTotal / 30).toFixed(2));
}

/**
 * Atualiza o Brand Rating mensal considerando contratos de mídia e decaimento natural
 * @param currentBrand Rating de marca atual (0-100)
 * @param activeOutlets Veículos de mídia ativos contratados para este produto
 * @param isProfitable Indica se a empresa teve lucro no mês (leve bônus residual)
 */
export function updateProductBrandWithMarketing(
  currentBrand: number,
  activeOutlets: MediaOutletDef[],
  isProfitable: boolean = true
): number {
  if (activeOutlets.length === 0) {
    // Sem publicidade ativa: decaimento de marca com piso residual de 10
    const decay = isProfitable ? 1 : 2;
    return Math.max(10, currentBrand - decay);
  }

  // Soma os impulsos dos contratos ativos
  let totalBoost = activeOutlets.reduce((sum, o) => sum + o.brandBoostMonthly, 0);
  if (isProfitable) totalBoost += 1;

  // O teto é o maior teto dentre os veículos contratados
  const maxCap = Math.max(...activeOutlets.map(o => o.brandCap));

  const newBrand = Math.min(maxCap, currentBrand + totalBoost);
  return Math.min(100, Math.max(10, newBrand));
}
