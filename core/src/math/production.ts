/**
 * math/production.ts — Motor Matemático de Transformação Fabril e Produção Agrícola
 */

export interface RecipeInput {
  standardCost: number;
  quality: number;
  quantity: number;
}

export interface RecipeCalculationResult {
  unitCost: number;
  outputQuality: number;
}

/**
 * Calcula o custo unitário e a qualidade resultante de uma receita de manufatura
 * @param inputs Lista de insumos utilizados na receita com seus custos e qualidades
 * @param processingCost Custo operacional/mão-de-obra de transformação por unidade
 * @param qualityBonus Bônus de acabamento fabril da receita
 */
export function calculateRecipeOutput(
  inputs: RecipeInput[],
  processingCost: number,
  qualityBonus: number = 5
): RecipeCalculationResult {
  let totalInputCost = 0;
  let totalWeightedQuality = 0;
  let totalUnits = 0;

  for (const input of inputs) {
    totalInputCost += input.standardCost * input.quantity;
    totalWeightedQuality += input.quality * input.quantity;
    totalUnits += input.quantity;
  }

  const avgInputQuality = totalUnits > 0 ? totalWeightedQuality / totalUnits : 50;
  const unitCost = Number((totalInputCost + processingCost).toFixed(3));
  const outputQuality = Math.min(100, Math.round(avgInputQuality + qualityBonus));

  return {
    unitCost,
    outputQuality
  };
}

/**
 * Calcula a produção diária efetiva baseada na capacidade e na disponibilidade de insumos
 */
export function calculateDailyFactoryYield(
  dailyCapacity: number,
  availableRawUnits: number,
  ratioPerOutput: number = 1
): { producedUnits: number; consumedRaw: number } {
  const maxPossible = Math.floor(availableRawUnits / ratioPerOutput);
  const producedUnits = Math.min(dailyCapacity, maxPossible);
  const consumedRaw = producedUnits * ratioPerOutput;
  return { producedUnits, consumedRaw };
}
