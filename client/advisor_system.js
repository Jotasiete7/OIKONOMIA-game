/**
 * advisor_system.js — Diretoria Executiva & Inteligência Estratégica (CFO, COO & CMO)
 * OIKONOMIA v0.8.5
 *
 * Motor analítico unificado com:
 * 1. Pulso de Saúde Corporativa (6 KPIs semaforizados).
 * 2. Grafo de Diagnóstico Causal Cruzado (identificação de causa-raiz da produção ao varejo).
 * 3. Máquina de Estados de Alertas (New, Acknowledged, Snoozed, Resolved) com regra anti-spam de +20%.
 * 4. Filtros de Contexto (período de graça para novas construções, detecção de loss-leader e colchão de caixa).
 */

import { PRODUCT_CATALOG, RD_CATEGORIES } from './data_catalogs.js';

/**
 * Converte dia/mês/ano em contagem contínua de dias no jogo para cálculo de idade e prazos
 */
export function getAbsoluteGameDays(day = 1, month = 1, year = 1) {
  return ((year - 1) * 360) + ((month - 1) * 30) + day;
}

/**
 * Computa a quantidade real de clientes (lojas, fábricas, granjas) abastecidos por um armazém
 */
export function countWarehouseClients(whTile, activeFacilities) {
  if (!whTile?.warehouse) return 0;
  const whId = `warehouse_${whTile.x}_${whTile.y}`;
  let count = 0;

  for (const dstTile of activeFacilities.values()) {
    // Varejo / Lojas
    if (dstTile.store?.shelves) {
      for (const shelf of Object.values(dstTile.store.shelves)) {
        if (shelf.supplierId === whId) {
          count++;
          break; // 1 cliente por loja
        }
      }
    }
    // Indústrias / Fábricas
    if (dstTile.factory?.lines) {
      for (const line of Object.values(dstTile.factory.lines)) {
        const inputs = line.inputsConfig || line.ingredients || {};
        if (Object.values(inputs).some(cfg => cfg?.supplierId === whId)) {
          count++;
          break; // 1 cliente por fábrica
        }
      }
    }
    // Granjas / Fazendas (ração)
    if (dstTile.farm?.feedConfig?.active && dstTile.farm.feedConfig.supplierId === whId) {
      count++;
    }
  }

  return count;
}

/**
 * 1. Avalia o Pulso de Saúde Corporativa (6 KPIs semaforizados)
 */
export function evaluateCorporatePulse(context) {
  const { state, activeFacilitySet, rdLabs } = context;

  const currentCash = state.cash || 0;
  const monthRev = state.monthRevenue || 0;
  const monthFixed = state.monthFixedExpenses || 0;
  const monthCogs = state.monthCogs || 0;
  const monthMkt = state.monthMarketingExpenses || 0;
  const monthFin = state.monthFinancialExpenses || 0;
  const totalExpenses = monthFixed + monthCogs + monthMkt + monthFin;
  const netProfit = monthRev - totalExpenses;
  const netMarginPct = monthRev > 0 ? (netProfit / monthRev) * 100 : (netProfit < 0 ? -100 : 0);

  // 1. Saúde Financeira (CFO)
  let finStatus = 'healthy';
  let finScore = 85;
  if (currentCash < 0 || (netProfit < -3000 && currentCash < 20000)) {
    finStatus = 'critical';
    finScore = 20;
  } else if (netMarginPct < 5 || (netProfit < 0 && currentCash < 50000)) {
    finStatus = 'warning';
    finScore = 55;
  } else if (netMarginPct >= 20) {
    finScore = 95;
  }

  // 2. Eficiência Fabril & Produção (COO)
  let totalFactoryLines = 0;
  let activeFactoryLines = 0;
  let idleLinesCount = 0;

  for (const tile of activeFacilitySet.values()) {
    if (tile.factory && tile.factory.lines) {
      for (const line of Object.values(tile.factory.lines)) {
        totalFactoryLines++;
        if (line.outputProductId) {
          activeFactoryLines++;
        } else {
          idleLinesCount++;
        }
      }
    }
  }

  const factoryRatio = totalFactoryLines > 0 ? (activeFactoryLines / totalFactoryLines) : 1;
  let factoryStatus = 'healthy';
  let factoryScore = 90;
  if (totalFactoryLines > 0) {
    if (factoryRatio < 0.5) {
      factoryStatus = 'critical';
      factoryScore = 30;
    } else if (factoryRatio < 0.8 || idleLinesCount > 1) {
      factoryStatus = 'warning';
      factoryScore = 65;
    }
  }

  // 3. Logística & Armazenamento (COO)
  let totalWarehouses = 0;
  let overloadedWarehouses = 0;
  let emptyWarehouses = 0;
  let lonelyWarehouses = 0; // armazéns sem nenhum cliente

  for (const tile of activeFacilitySet.values()) {
    if (tile.warehouse) {
      totalWarehouses++;
      const cap = tile.warehouse.maxCapacity || tile.warehouse.capacity || 25000;
      let occ = tile.warehouse.totalStoredVolume || 0;
      if (!occ && tile.warehouse.inventory) {
        occ = Object.values(tile.warehouse.inventory).reduce((s, it) => s + (it.stock || 0), 0);
      }
      const pct = (occ / cap) * 100;
      if (pct > 92) overloadedWarehouses++;
      if (pct < 5) emptyWarehouses++;

      const clientsCount = countWarehouseClients(tile, activeFacilitySet);
      if (clientsCount === 0) lonelyWarehouses++;
    }
  }

  let logisticsStatus = 'healthy';
  let logisticsScore = 90;
  if (totalWarehouses > 0) {
    if (overloadedWarehouses > 0 || (lonelyWarehouses > 0 && totalWarehouses <= 2)) {
      logisticsStatus = 'warning';
      logisticsScore = 60;
    }
    if (overloadedWarehouses >= 2 || (lonelyWarehouses >= 2)) {
      logisticsStatus = 'critical';
      logisticsScore = 35;
    }
  }

  // 4. Abastecimento de Varejo & Ruptura de Gôndola (COO / CMO)
  let totalShelves = 0;
  let emptyShelves = 0;

  for (const tile of activeFacilitySet.values()) {
    if (tile.store && tile.store.shelves) {
      for (const [prodId, shelf] of Object.entries(tile.store.shelves)) {
        totalShelves++;
        if ((shelf.stock || 0) <= 0.05) {
          emptyShelves++;
        }
      }
    }
  }

  const stockoutRate = totalShelves > 0 ? (emptyShelves / totalShelves) : 0;
  let retailStatus = 'healthy';
  let retailScore = 95;
  if (totalShelves > 0) {
    if (stockoutRate > 0.25) {
      retailStatus = 'critical';
      retailScore = 25;
    } else if (stockoutRate > 0.05 || emptyShelves >= 2) {
      retailStatus = 'warning';
      retailScore = 60;
    }
  }

  // 5. Competitividade & Market Share (CMO)
  let storeCount = 0;
  let storesWithSales = 0;
  for (const tile of activeFacilitySet.values()) {
    if (tile.store) {
      storeCount++;
      const lastRev = tile.lastMonthMetrics?.revenue || tile.monthlyMetrics?.revenue || 0;
      if (lastRev > 0) storesWithSales++;
    }
  }

  let marketStatus = 'healthy';
  let marketScore = 80;
  if (storeCount > 0) {
    const activeSellingRatio = storesWithSales / storeCount;
    if (activeSellingRatio < 0.4) {
      marketStatus = 'critical';
      marketScore = 30;
    } else if (activeSellingRatio < 0.8) {
      marketStatus = 'warning';
      marketScore = 60;
    } else {
      marketScore = 90;
    }
  }

  // 6. Liderança Tecnológica (CMO / Inovação)
  const activeLabs = rdLabs ? Object.values(rdLabs).filter(p => p.status === 'active').length : 0;
  let techStatus = 'healthy';
  let techScore = 75;
  if (activeLabs > 0) {
    techScore = 95;
  } else if (storeCount >= 3 && activeLabs === 0) {
    techStatus = 'warning';
    techScore = 55;
  }

  // Score composto global
  const compositeScore = Math.round((finScore + factoryScore + logisticsScore + retailScore + marketScore + techScore) / 6);

  return {
    compositeScore,
    finance: {
      status: finStatus,
      score: finScore,
      netMarginPct: Number(netMarginPct.toFixed(1)),
      netProfit: Math.round(netProfit),
      cash: Math.round(currentCash)
    },
    factory: {
      status: factoryStatus,
      score: factoryScore,
      activeRatio: Number((factoryRatio * 100).toFixed(0)),
      totalLines: totalFactoryLines,
      idleLines: idleLinesCount
    },
    logistics: {
      status: logisticsStatus,
      score: logisticsScore,
      totalWarehouses,
      overloaded: overloadedWarehouses,
      lonely: lonelyWarehouses
    },
    retail: {
      status: retailStatus,
      score: retailScore,
      totalShelves,
      emptyShelves,
      stockoutRatePct: Number((stockoutRate * 100).toFixed(1))
    },
    market: {
      status: marketStatus,
      score: marketScore,
      storeCount,
      storesWithSales
    },
    tech: {
      status: techStatus,
      score: techScore,
      activeLabs
    }
  };
}

/**
 * 2. Motor Heurístico Unificado com Grafo de Causalidade Cruzada
 */
export function diagnoseCorporateIssues(context) {
  const { state, activeFacilitySet, rdLabs } = context;
  const currentDays = getAbsoluteGameDays(state.day, state.month, state.year);
  const rawAlerts = [];

  const GRACE_PERIOD_DAYS = 30; // 30 dias de tolerância para construções novas
  const currentCash = state.cash || 0;
  const monthRev = state.monthRevenue || 0;
  const monthFixed = state.monthFixedExpenses || 0;
  const monthProfit = monthRev - (monthFixed + (state.monthCogs || 0));

  // =========================================================================
  // A. CFO: SANGRIA FINANCEIRA & INSOLVÊNCIA
  // =========================================================================
  if (currentCash < 0) {
    rawAlerts.push({
      id: 'cfo_negative_cash',
      category: 'CFO',
      severity: 'critical',
      title: 'Caixa Negativo em Cheque Especial',
      message: `A holding encerrou com saldo devedor de -$${Math.abs(Math.round(currentCash)).toLocaleString('en-US')}. O banco está cobrando 3.5% ao mês em juros sobre o saldo a descoberto.`,
      rootCause: 'Custos operacionais fixos e aquisição de insumos superaram as receitas recebidas no período.',
      deepLink: { type: 'modal', modalId: 'banking-modal', label: '🏦 Abrir Central Bancária (Crédito)' },
      metricVal: Math.abs(currentCash)
    });
  } else if (monthProfit < -4000 && currentCash < 25000) {
    rawAlerts.push({
      id: 'cfo_cash_bleed_risk',
      category: 'CFO',
      severity: 'warning',
      title: 'Sangria de Caixa Acelerada',
      message: `Prejuízo mensal projetado de -$${Math.abs(Math.round(monthProfit)).toLocaleString('en-US')}. Com o caixa atual ($${Math.round(currentCash).toLocaleString('en-US')}), a empresa suportará menos de 2 meses de operação antes da insolvência.`,
      rootCause: 'Custos de manutenção de prédios ociosos ou despesas com frete superam as margens líquidas.',
      deepLink: { type: 'modal', modalId: 'dre-modal', label: '📊 Inspecionar DRE Consolidada' },
      metricVal: Math.abs(monthProfit)
    });
  }

  // CFO: Custo de Oportunidade de Caixa Excessivo Ocioso
  if (currentCash > 160000 && monthFixed > 0 && currentCash > (monthFixed * 4)) {
    rawAlerts.push({
      id: 'cfo_idle_cash_opportunity',
      category: 'CFO',
      severity: 'opportunity',
      title: 'Capital Ocioso em Caixa',
      message: `Você possui $${Math.round(currentCash).toLocaleString('en-US')} em caixa rendendo zero. O custo de oportunidade é alto.`,
      rootCause: 'Caixa acumulado sem reinvestimento ativo em P&D, novas filiais ou aquisição de minas.',
      deepLink: { type: 'action', actionId: 'open_rd_or_store', label: '🔬 Investir em P&D ou Expansão' },
      metricVal: currentCash
    });
  }

  // =========================================================================
  // B. COO & CAUSA-RAIZ: RUPTURA DE GÔNDOLAS NO VAREJO
  // =========================================================================
  // =========================================================================
  // B. COO & CAUSA-RAIZ: RUPTURA DE GÔNDOLAS NO VAREJO
  // =========================================================================
  for (const [tileKey, tile] of activeFacilitySet.entries()) {
    const buildingDaysAge = tile.createdAtDay ? (currentDays - tile.createdAtDay) : 999;
    if (buildingDaysAge < GRACE_PERIOD_DAYS) continue;

    if (tile.store && tile.store.shelves) {
      for (const [prodId, shelf] of Object.entries(tile.store.shelves)) {
        const prod = PRODUCT_CATALOG[prodId];
        const stock = shelf.stock || 0;

        // Se o estoque está zerado na prateleira
        if (stock <= 0.05) {
          // Rastreamento Causal da Causa-Raiz da Ruptura
          let causalExplanation = 'A gôndola não possui fornecedor conectado ou a reposição está desativada.';
          let deepLinkAction = { type: 'tile', x: tile.x, y: tile.y, label: `🏪 Inspecionar ${tile.store.name || 'Loja'}` };

          if (shelf.supplierId?.startsWith('warehouse_')) {
            const parts = shelf.supplierId.split('_');
            const whX = Number(parts[1]), whY = Number(parts[2]);
            const whTile = activeFacilitySet.get(`${whX},${whY}`);
            if (whTile && whTile.warehouse) {
              const wh = whTile.warehouse;
              const whItem = wh.inventory?.[prodId];
              const whStock = whItem?.stock || 0;
              if (whStock <= 0.1) {
                const totalWhStock = Object.values(wh.inventory || {}).reduce((s, i) => s + (i.stock || 0), 0);
                const maxCap = wh.maxCapacity || 25000;
                const isSaturated = (totalWhStock / Math.max(1, maxCap)) >= 0.98;

                if (isSaturated) {
                  causalExplanation = `🚨 Gargalo Sistêmico: O Armazém fornecedor (${whTile.x}, ${whTile.y}) atingiu lotação máxima (${Math.round(totalWhStock).toLocaleString()}/${maxCap.toLocaleString()} un - 100%) com outros produtos e bloqueou coletas das fábricas! Amplie o armazém ou reduza cotas dos itens cheios para liberar espaço.`;
                  deepLinkAction = { type: 'tile', x: whTile.x, y: whTile.y, label: '🚚 Liberar Espaço no Armazém' };
                } else if (!whItem) {
                  causalExplanation = `O Armazém fornecedor (${whTile.x}, ${whTile.y}) não possui ${prod ? prod.name : prodId} cadastrado no inventário. Aloque o produto no armazém.`;
                  deepLinkAction = { type: 'tile', x: whTile.x, y: whTile.y, label: '🚚 Alocar no Armazém' };
                } else {
                  // Verifica se há fábricas, fazendas ou minas próprias produzindo este produto
                  let hasProducer = false;
                  for (const fac of activeFacilitySet.values()) {
                    if (fac.factory?.lines) {
                      for (const l of Object.values(fac.factory.lines)) {
                        if (l.outputProductId === prodId) { hasProducer = true; break; }
                      }
                    }
                    if (fac.farm && (fac.farm.cropId === prodId || (prodId === 'eggs' && fac.farm.cropId === 'poultry'))) {
                      hasProducer = true;
                    }
                    if (fac.mine && fac.mine.resourceId === prodId) {
                      hasProducer = true;
                    }
                    if (hasProducer) break;
                  }

                  if (!hasProducer && !whItem.autoRestockPort) {
                    causalExplanation = `O Armazém (${whTile.x}, ${whTile.y}) está sem estoque de ${prod ? prod.name : prodId}: nenhuma fábrica/fazenda produz este produto e o Porto está desativado.`;
                  } else {
                    causalExplanation = `O Armazém fornecedor (${whTile.x}, ${whTile.y}) está temporariamente sem estoque de ${prod ? prod.name : prodId}. A produção própria não atendeu ao ritmo das vendas.`;
                  }
                  deepLinkAction = { type: 'tile', x: whTile.x, y: whTile.y, label: '🚚 Inspecionar Armazém' };
                }
              } else {
                causalExplanation = `O Armazém possui estoque (${Math.round(whStock)} un), mas a reposição diária ainda não abasteceu a gôndola.`;
              }
            }
          } else if (shelf.supplierId?.startsWith('factory_')) {
            const parts = shelf.supplierId.split('_');
            const facX = Number(parts[1]), facY = Number(parts[2]);
            const facTile = activeFacilitySet.get(`${facX},${facY}`);
            if (facTile && facTile.factory) {
              causalExplanation = `A fábrica fornecedora (${facTile.x}, ${facTile.y}) não está entregando lotes suficientes de ${prod ? prod.name : prodId}.`;
              deepLinkAction = { type: 'tile', x: facTile.x, y: facTile.y, label: '🏭 Inspecionar Fábrica' };
            }
          } else if (shelf.supplierId?.startsWith('farm_')) {
            const parts = shelf.supplierId.split('_');
            const farmX = Number(parts[1]), farmY = Number(parts[2]);
            const farmTile = activeFacilitySet.get(`${farmX},${farmY}`);
            if (farmTile && farmTile.farm) {
              causalExplanation = `A fazenda/granja fornecedora (${farmTile.x}, ${farmTile.y}) está com estoque ou colheita insuficiente.`;
              deepLinkAction = { type: 'tile', x: farmTile.x, y: farmTile.y, label: '🌾 Inspecionar Fazenda' };
            }
          } else {
            causalExplanation = `Fornecimento via Porto Marítimo atingiu a cota diária máxima ou o saldo foi insuficiente.`;
            deepLinkAction = { type: 'modal', modalId: 'seaport-modal', label: '⚓ Abrir Porto Marítimo' };
          }

          rawAlerts.push({
            id: `coo_stockout_${tileKey}_${prodId}`,
            category: 'COO',
            severity: 'critical',
            title: `Ruptura de Gôndola: ${prod ? prod.name : prodId}`,
            message: `A filial em ${tile.district?.name || 'Distrito'} está sem ${prod ? prod.name : prodId} na prateleira, perdendo receita diária.`,
            rootCause: causalExplanation,
            deepLink: deepLinkAction,
            metricVal: 1
          });
        }
      }
    }
  }

  // =========================================================================
  // C. COO & CAUSA-RAIZ: FÁBRICAS E LINHAS OCIOSAS
  // =========================================================================
  for (const [tileKey, tile] of activeFacilitySet.entries()) {
    const buildingDaysAge = tile.createdAtDay ? (currentDays - tile.createdAtDay) : 999;
    if (buildingDaysAge < GRACE_PERIOD_DAYS) continue;

    if (tile.factory && tile.factory.lines) {
      for (const [lineId, line] of Object.entries(tile.factory.lines)) {
        if (!line.outputProductId) {
          rawAlerts.push({
            id: `coo_idle_line_${tileKey}_${lineId}`,
            category: 'COO',
            severity: 'warning',
            title: `Linha Fabril Inativa: Linha #${lineId}`,
            message: `A Fábrica em (${tile.x}, ${tile.y}) possui uma linha sem nenhuma receita configurada, gerando custo de solo e manutenção sem produzir.`,
            rootCause: 'Capacidade fabril ociosa por falta de atribuição de linha de manufatura.',
            deepLink: { type: 'tile', x: tile.x, y: tile.y, label: '⚙️ Configurar Receita Fabril' },
            metricVal: 1
          });
        }
      }
    }
  }

  // =========================================================================
  // D. COO: ARMAZÉM DESCONECTADO (SEM CLIENTES) OU SUPERLOTADO
  // =========================================================================
  for (const [tileKey, tile] of activeFacilitySet.entries()) {
    const buildingDaysAge = tile.createdAtDay ? (currentDays - tile.createdAtDay) : 999;
    if (buildingDaysAge < GRACE_PERIOD_DAYS) continue;

    if (tile.warehouse) {
      const clientsCount = countWarehouseClients(tile, activeFacilitySet);
      const cap = tile.warehouse.maxCapacity || tile.warehouse.capacity || 25000;
      let occ = tile.warehouse.totalStoredVolume || 0;
      if (!occ && tile.warehouse.inventory) {
        occ = Object.values(tile.warehouse.inventory).reduce((s, it) => s + (it.stock || 0), 0);
      }
      const pct = (occ / cap) * 100;

      if (clientsCount === 0) {
        rawAlerts.push({
          id: `coo_lonely_warehouse_${tileKey}`,
          category: 'COO',
          severity: 'warning',
          title: `Armazém Logístico sem Clientes`,
          message: `O Armazém Logístico em (${tile.x}, ${tile.y}) não possui nenhuma loja ou fábrica consumindo suas mercadorias.`,
          rootCause: 'Custos diários de solo e infraestrutura sem escoamento de estoque.',
          deepLink: { type: 'tile', x: tile.x, y: tile.y, label: '🚚 Conectar Lojas ao Armazém' },
          metricVal: 1
        });
      }

      if (pct >= 98) {
        rawAlerts.push({
          id: `coo_overloaded_warehouse_${tileKey}`,
          category: 'COO',
          severity: 'critical',
          title: `Armazém Saturado (100%) - Coletas Travadas`,
          message: `O Armazém em (${tile.x}, ${tile.y}) atingiu capacidade máxima (${Math.round(occ).toLocaleString()}/${cap.toLocaleString()} un). Novas coletas das fábricas e fazendas foram suspensas e produtos estão em risco de ruptura!`,
          rootCause: 'O armazém está 100% cheio com outros produtos. Sem espaço livre, ele bloqueia a coleta de mercadorias das fábricas.',
          deepLink: { type: 'tile', x: tile.x, y: tile.y, label: '📦 Ampliar Armazém ou Ajustar Cotas' },
          metricVal: pct
        });
      } else if (pct > 90) {
        rawAlerts.push({
          id: `coo_overloaded_warehouse_${tileKey}`,
          category: 'COO',
          severity: 'warning',
          title: `Armazém Próximo à Lotação Máxima (${pct.toFixed(0)}%)`,
          message: `O Armazém em (${tile.x}, ${tile.y}) está com ${pct.toFixed(0)}% de ocupação. Fábricas fornecedoras em breve terão que interromper linhas de produção.`,
          rootCause: 'A entrada de produtos supera a velocidade de escoamento e venda no varejo.',
          deepLink: { type: 'tile', x: tile.x, y: tile.y, label: '📦 Expandir Armazém ou Acelerar Vendas' },
          metricVal: pct
        });
      }
    }
  }

  // =========================================================================
  // E. CMO: QUALIDADE DE PRODUTO (QR DEFASADO VS MERCADO)
  // =========================================================================
  const checkedProducts = new Set();
  for (const tile of activeFacilitySet.values()) {
    if (tile.store && tile.store.shelves) {
      for (const [prodId, shelf] of Object.entries(tile.store.shelves)) {
        if (checkedProducts.has(prodId)) continue;
        checkedProducts.add(prodId);

        const currentQR = shelf.quality || 50;
        const prod = PRODUCT_CATALOG[prodId];

        // Se o produto está no varejo mas seu QR é o mais básico (<= 52)
        if (currentQR <= 52 && prod && (prod.qualityWeight || 50) >= 45) {
          const hasActiveResearch = rdLabs && Object.values(rdLabs).some(p => p.productId === prodId && p.status === 'active');
          if (!hasActiveResearch) {
            rawAlerts.push({
              id: `cmo_low_qr_${prodId}`,
              category: 'CMO',
              severity: 'opportunity',
              title: `Oportunidade de Inovação: ${prod.name}`,
              message: `Seu produto ${prod.name} opera com Qualidade básica (${currentQR.toFixed(0)} QR). Produtos concorrentes ou importados podem roubar seu market share neste setor sensível a qualidade.`,
              rootCause: 'Ausência de pesquisa científica em P&D para aprimorar as receitas e sementes.',
              deepLink: { type: 'action', actionId: 'open_rd_wizard_for_prod', productId: prodId, label: `🔬 Iniciar P&D em ${prod.name}` },
              metricVal: currentQR
            });
          }
        }
      }
    }
  }

  return rawAlerts;
}

/**
 * 3. Máquina de Estados de Alertas (com supressão anti-spam de +20%)
 */
export function updateAdvisorAlertStates(advisorState, rawAlerts, currentMonth, currentYear) {
  if (!advisorState) {
    advisorState = {
      verbosity: 'novato',
      activeAlerts: {},
      alertHistory: [],
      lastPulse: null
    };
  }

  const activeMap = advisorState.activeAlerts || {};
  const currentRawIds = new Set(rawAlerts.map(a => a.id));
  const updatedActive = {};

  // 1. Processa alertas detectados nesta rodada
  for (const raw of rawAlerts) {
    const existing = activeMap[raw.id];

    if (!existing) {
      // Novo Alerta
      updatedActive[raw.id] = {
        ...raw,
        state: 'new',
        detectedMonth: currentMonth,
        detectedYear: currentYear,
        lastSeenMonth: currentMonth,
        lastSeenYear: currentYear
      };
    } else {
      // Alerta já existente
      let nextState = existing.state;

      // Se estava snoozed (adiado), verifica se o prazo expirou
      if (existing.state === 'snoozed') {
        const snoozeEndDays = getAbsoluteGameDays(1, existing.snoozeUntilMonth || currentMonth, existing.snoozeUntilYear || currentYear);
        const curDays = getAbsoluteGameDays(1, currentMonth, currentYear);
        if (curDays >= snoozeEndDays) {
          nextState = 'new';
        }
      }

      // Regra de reincidência de +20%: Se estava dispensado (acknowledged), só revive se piorar 20%
      if (existing.state === 'acknowledged') {
        const oldVal = existing.metricVal || 0;
        const newVal = raw.metricVal || 0;
        if (oldVal > 0 && newVal >= (oldVal * 1.20)) {
          nextState = 'new';
          raw.title = `[Piora +20%] ${raw.title}`;
        }
      }

      updatedActive[raw.id] = {
        ...raw,
        state: nextState,
        detectedMonth: existing.detectedMonth || currentMonth,
        detectedYear: existing.detectedYear || currentYear,
        lastSeenMonth: currentMonth,
        lastSeenYear: currentYear,
        snoozeUntilMonth: existing.snoozeUntilMonth,
        snoozeUntilYear: existing.snoozeUntilYear
      };
    }
  }

  // 2. Alertas que foram resolvidos (estavam ativos, mas não existem mais no raw)
  const history = advisorState.alertHistory || [];
  for (const [oldId, oldAlert] of Object.entries(activeMap)) {
    if (!currentRawIds.has(oldId)) {
      history.unshift({
        id: oldId,
        category: oldAlert.category,
        title: oldAlert.title,
        message: `✅ Problema normalizado! ${oldAlert.title} foi solucionado na operação corporativa.`,
        resolvedMonth: currentMonth,
        resolvedYear: currentYear,
        state: 'resolved'
      });
    }
  }

  // Mantém apenas os últimos 20 registros históricos
  advisorState.alertHistory = history.slice(0, 20);
  advisorState.activeAlerts = updatedActive;
  advisorState.lastEvaluatedMonth = currentMonth;
  advisorState.lastEvaluatedYear = currentYear;

  return advisorState;
}

/**
 * 4. Filtra Alertas por Verbosidade (Novato, Expert, Silencioso)
 */
export function filterAdvisorByVerbosity(alerts, verbosity = 'novato') {
  if (verbosity === 'silencioso') {
    // Modo Silencioso: Apenas alertas de falência/caixa crítico
    return alerts.filter(a => a.severity === 'critical');
  }

  if (verbosity === 'expert') {
    // Modo Expert: Mostra critical e warning de forma resumida
    return alerts.filter(a => a.severity === 'critical' || a.severity === 'warning');
  }

  // Modo Novato: Exibe todos (critical, warning, opportunity e info) com contexto educativo
  return alerts;
}

export default {
  getAbsoluteGameDays,
  countWarehouseClients,
  evaluateCorporatePulse,
  diagnoseCorporateIssues,
  updateAdvisorAlertStates,
  filterAdvisorByVerbosity
};
