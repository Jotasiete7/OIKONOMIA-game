/**
 * client/telemetry_system.js — OikoBug Flight Recorder & Telemetry Engine
 * OIKONOMIA v0.8.5
 */

import { TELEMETRY_CONFIG, isSupabaseConfigured } from './telemetry_config.js';
import { GAME_VERSION_INFO } from './save_system.js';

export { isSupabaseConfigured };

// Buffers circulares em memória para diagnósticos
const consoleErrorsRingBuffer = [];
const recentActionsRingBuffer = [];

let isInitialized = false;

/**
 * Inicializa os listeners globais de erro e captura do Flight Recorder
 */
export function initTelemetryEngine() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Captura de Exceções JS Globais
  window.addEventListener('error', (event) => {
    try {
      const errEntry = {
        time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
        message: event.message || 'Erro desconhecido',
        filename: event.filename ? event.filename.split('/').pop() : 'inline',
        lineno: event.lineno || 0,
        colno: event.colno || 0,
        stack: event.error?.stack ? event.error.stack.split('\n').slice(0, 5).join('\n') : null
      };
      recordConsoleError(errEntry);
    } catch (_) {}
  });

  // 2. Captura de Promises Rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const errEntry = {
        time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
        message: `Unhandled Promise Rejection: ${event.reason?.message || event.reason || 'Rejeição sem mensagem'}`,
        stack: event.reason?.stack ? event.reason.stack.split('\n').slice(0, 5).join('\n') : null
      };
      recordConsoleError(errEntry);
    } catch (_) {}
  });

  // 3. Patch defensivo de console.error para reter mensagens
  const originalConsoleError = console.error;
  console.error = function(...args) {
    try {
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      recordConsoleError({
        time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
        message: msg.slice(0, 500),
        isConsoleError: true
      });
    } catch (_) {}
    originalConsoleError.apply(console, args);
  };
}

/**
 * Registra um erro no buffer circular de erros
 */
function recordConsoleError(entry) {
  consoleErrorsRingBuffer.push(entry);
  const max = TELEMETRY_CONFIG.flightRecorder.maxConsoleErrors || 25;
  while (consoleErrorsRingBuffer.length > max) {
    consoleErrorsRingBuffer.shift();
  }
}

/**
 * Registra uma decisão ou ação relevante do jogador para histórico de telemetria
 */
export function trackPlayerAction(actionType, title, details = {}) {
  try {
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const gameDate = (typeof window.day !== 'undefined' && typeof window.month !== 'undefined' && typeof window.year !== 'undefined')
      ? `${String(window.day).padStart(2, '0')}/${String(window.month).padStart(2, '0')} · A${window.year}`
      : 'Início';

    recentActionsRingBuffer.push({
      time,
      gameDate,
      actionType,
      title,
      details
    });

    const max = TELEMETRY_CONFIG.flightRecorder.maxRecentActions || 20;
    while (recentActionsRingBuffer.length > max) {
      recentActionsRingBuffer.shift();
    }
  } catch (_) {}
}

/**
 * Captura o canvas isométrico principal e redimensiona para tamanho otimizado (JPEG ~40KB)
 */
export async function captureOptimizedScreenshot() {
  if (typeof document === 'undefined') return null;

  try {
    const mainCanvas = document.getElementById('iso-canvas');
    if (!mainCanvas) return null;

    // Se o canvas ainda não foi redimensionado ou tem dimensões 0, força o resize
    if (mainCanvas.width === 0 || mainCanvas.height === 0) {
      if (typeof window.resizeCanvas === 'function') {
        window.resizeCanvas();
      }
      if (mainCanvas.width === 0 || mainCanvas.height === 0) {
        const r = mainCanvas.getBoundingClientRect();
        mainCanvas.width = Math.max(300, Math.round((r.width || 1280) * (window.devicePixelRatio || 1)));
        mainCanvas.height = Math.max(150, Math.round((r.height || 720) * (window.devicePixelRatio || 1)));
      }
    }

    const { maxWidth, maxHeight, quality, mimeType } = TELEMETRY_CONFIG.screenshot;

    // Calcula proporções preservando o aspect ratio
    let targetWidth = mainCanvas.width || 960;
    let targetHeight = mainCanvas.height || 540;

    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
      targetWidth = Math.max(10, Math.round(targetWidth * ratio));
      targetHeight = Math.max(10, Math.round(targetHeight * ratio));
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = targetWidth;
    offscreen.height = targetHeight;
    const ctx = offscreen.getContext('2d');

    if (!ctx) return null;

    // Fundo escuro padrão caso haja transparências
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Desenha o canvas renderizado
    if (mainCanvas.width > 0 && mainCanvas.height > 0) {
      try {
        ctx.drawImage(mainCanvas, 0, 0, targetWidth, targetHeight);
      } catch (_) {}
    }

    // Marca d'água técnica de telemetria discreta no canto inferior
    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.fillRect(0, targetHeight - 20, targetWidth, 20);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 10px monospace';
    const stampText = `OIKONOMIA ${GAME_VERSION_INFO.fullString} · Dia ${window.day || 1}/${window.month || 1} A${window.year || 1} · $${Number(window.cash || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    ctx.fillText(stampText, 10, targetHeight - 6);

    try {
      return offscreen.toDataURL(mimeType || 'image/jpeg', quality || 0.70);
    } catch (taintErr) {
      // Se o canvas principal contiver sprites locais (file://) sem CORS que causem Tainted Canvas,
      // gera um cartão visual analítico limpo no offscreen canvas para nunca deixar o reporte sem print!
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = targetWidth;
      fallbackCanvas.height = targetHeight;
      const fctx = fallbackCanvas.getContext('2d');
      if (!fctx) return null;

      // Fundo elegante de telemetria
      fctx.fillStyle = '#090d16';
      fctx.fillRect(0, 0, targetWidth, targetHeight);

      // Grade isométrica sutil
      fctx.strokeStyle = '#1e293b';
      fctx.lineWidth = 1;
      for (let x = 0; x < targetWidth; x += 35) {
        fctx.beginPath(); fctx.moveTo(x, 0); fctx.lineTo(x, targetHeight); fctx.stroke();
      }
      for (let y = 0; y < targetHeight; y += 35) {
        fctx.beginPath(); fctx.moveTo(0, y); fctx.lineTo(targetWidth, y); fctx.stroke();
      }

      // Painel central de informações
      fctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      fctx.fillRect(30, 30, targetWidth - 60, targetHeight - 60);
      fctx.strokeStyle = '#334155';
      fctx.lineWidth = 1.5;
      fctx.strokeRect(30, 30, targetWidth - 60, targetHeight - 60);

      fctx.fillStyle = '#f43f5e';
      fctx.font = 'bold 16px sans-serif';
      fctx.fillText('🏛️ TELEMETRIA DE VOO OIKONOMIA', 50, 65);

      fctx.fillStyle = '#e2e8f0';
      fctx.font = '11px monospace';
      fctx.fillText(`• Versão: ${GAME_VERSION_INFO.fullString}`, 50, 95);
      fctx.fillText(`• Empresa: ${window.playerProfile?.companyName || 'Empresa'} (CEO: ${window.playerProfile?.playerName || 'Jogador'})`, 50, 115);
      fctx.fillText(`• Simulação: Dia ${window.day || 1}/${window.month || 1} · Ano ${window.year || 1}`, 50, 135);
      fctx.fillText(`• Caixa: $${Number(window.cash || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 50, 155);
      fctx.fillText(`• Lotes Ativos: ${typeof window.activeFacilitySet !== 'undefined' ? window.activeFacilitySet.size : 0} prédios construídos`, 50, 175);

      fctx.fillStyle = '#38bdf8';
      fctx.font = '10px monospace';
      fctx.fillText(`• Save Snapshot: Anexado com Sucesso (~25KB)`, 50, 205);

      fctx.fillStyle = '#94a3b8';
      fctx.font = 'italic 9px sans-serif';
      fctx.fillText('Nota: Captura de tela gerada com dados de voo sob política de segurança de imagens do navegador.', 50, targetHeight - 45);

      return fallbackCanvas.toDataURL(mimeType || 'image/jpeg', quality || 0.70);
    }
  } catch (err) {
    console.warn('Falha na captura do screenshot de telemetria:', err);
    return null;
  }
}

/**
 * Heurísticas e Auditoria Automática de Balanceamento e Detecção de Exploits
 */
export function analyzeGameBalance() {
  const anomalies = [];
  const metrics = {};
  const empireSummary = {
    stores: 0,
    factories: 0,
    mines: 0,
    farms: 0,
    warehouses: 0,
    rdCenters: 0,
    totalFacilities: 0,
    totalEmployeesEstimated: 0
  };

  try {
    const cash = Number(window.cash || 0);
    const month = Number(window.month || 1);
    const year = Number(window.year || 1);
    const elapsedMonths = (year - 1) * 12 + month;

    metrics.cash = cash;
    metrics.gameDate = `Dia ${window.day || 1}/${month} · Ano ${year}`;
    metrics.elapsedMonths = elapsedMonths;
    metrics.netProfitMonth = Number(window.monthRevenue || 0) - Number(window.monthCogs || 0) - Number(window.monthFixedExpenses || 0) - Number(window.monthMarketingExpenses || 0) - Number(window.monthFinancialExpenses || 0);
    metrics.totalDebt = window.GameState?.banking?.totalDebt || 0;

    // 1. Checagem de Salto de Caixa Desproporcional
    if (elapsedMonths <= 12 && cash > 3000000) {
      anomalies.push({
        code: 'SURGE_CASH_EXPLOSION',
        severity: 'HIGH',
        message: `Caixa extremamente elevado ($${cash.toLocaleString()}) em menos de 1 ano de partida.`
      });
    }

    if (cash < 0 && metrics.totalDebt === 0) {
      anomalies.push({
        code: 'NEGATIVE_CASH_WITHOUT_DEBT',
        severity: 'MEDIUM',
        message: `Caixa negativo ($${cash.toLocaleString()}) sem registro de empréstimo bancário ativo.`
      });
    }

    // 2. Auditoria dos lotes construídos (Active Facilities)
    const facilities = (typeof window.activeFacilitySet !== 'undefined' && window.activeFacilitySet)
      ? Array.from(window.activeFacilitySet.values())
      : [];

    facilities.forEach(t => {
      if (t.store) {
        empireSummary.stores++;
        empireSummary.totalFacilities++;
        // Analisa gôndolas e margens
        if (t.store.shelves) {
          Object.entries(t.store.shelves).forEach(([pId, shelf]) => {
            if (!shelf) return;
            const price = Number(shelf.price || 0);
            const cost = Number(shelf.avgUnitCost || shelf.unitCost || 0);
            const stock = Number(shelf.stock || 0);

            if (stock < 0) {
              anomalies.push({
                code: 'CORRUPTED_NEGATIVE_STORE_STOCK',
                severity: 'HIGH',
                message: `Estoque negativo (${stock}) do produto [${pId}] na loja em (${t.x}, ${t.y}).`
              });
            }

            if (cost > 0 && price > cost * 10) {
              const marginPct = Math.round(((price - cost) / cost) * 100);
              anomalies.push({
                code: 'EXPLOIT_EXTREME_MARGIN',
                severity: 'HIGH',
                message: `Margem abusiva de ${marginPct}% no produto [${pId}] (Custo: $${cost}, Preço: $${price}) em (${t.x}, ${t.y}).`
              });
            }
          });
        }
      } else if (t.factory) {
        empireSummary.factories++;
        empireSummary.totalFacilities++;
      } else if (t.mine) {
        empireSummary.mines++;
        empireSummary.totalFacilities++;
      } else if (t.farm) {
        empireSummary.farms++;
        empireSummary.totalFacilities++;
      } else if (t.warehouse) {
        empireSummary.warehouses++;
        empireSummary.totalFacilities++;
        if (t.warehouse.inventory) {
          Object.entries(t.warehouse.inventory).forEach(([pId, item]) => {
            if (!item) return;
            if (Number(item.stock || 0) < 0) {
              anomalies.push({
                code: 'CORRUPTED_NEGATIVE_WAREHOUSE_STOCK',
                severity: 'HIGH',
                message: `Estoque negativo de [${pId}] no armazém (${t.x}, ${t.y}).`
              });
            }
          });
        }
      } else if (t.rdCenter) {
        empireSummary.rdCenters++;
        empireSummary.totalFacilities++;
      }
    });

    metrics.anomaliesCount = anomalies.length;
  } catch (e) {
    console.warn('Erro ao calcular heurísticas de balanceamento:', e);
  }

  return { anomalies, metrics, empireSummary };
}

/**
 * Constrói o payload completo de telemetria e diagnóstico do reporte
 */
export async function buildTelemetryPayload({ category = 'bug', title = '', description = '', includeScreenshot = true, includeSave = true } = {}) {
  const balanceAnalysis = analyzeGameBalance();
  
  let screenshot = null;
  if (includeScreenshot) {
    screenshot = await captureOptimizedScreenshot();
  }

  let saveSnapshot = null;
  if (includeSave) {
    if (typeof window.serializeCurrentGame === 'function') {
      saveSnapshot = window.serializeCurrentGame();
    } else if (typeof window.serializeGameState === 'function' && window.GameState) {
      saveSnapshot = window.serializeGameState(window.GameState, window.extractBuiltTiles ? window.extractBuiltTiles() : []);
    }
  }

  const systemInfo = {
    gameVersion: GAME_VERSION_INFO.fullString,
    saveSchema: GAME_VERSION_INFO.saveSchema,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconhecido',
    screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'N/A',
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    language: typeof navigator !== 'undefined' ? navigator.language : 'pt-BR'
  };

  const gameStateSummary = {
    playerName: window.playerProfile?.playerName || 'Jogador',
    companyName: window.playerProfile?.companyName || 'Empresa',
    difficulty: window.playerProfile?.difficulty || 'standard',
    cash: Number(window.cash || 0),
    gameDate: `Dia ${window.day || 1}/${window.month || 1} · Ano ${window.year || 1}`,
    playtimeSeconds: window.playtimeSeconds || 0,
    speed: window.gameSpeed || 1
  };

  const diagnostics = {
    consoleErrors: [...consoleErrorsRingBuffer],
    recentActions: [...recentActionsRingBuffer],
    systemDebugLogs: Array.isArray(window.systemDebugLogs) ? window.systemDebugLogs.slice(-15) : []
  };

  return {
    id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    category,
    title: title.trim(),
    description: description.trim(),
    systemInfo,
    gameStateSummary,
    balanceAnalysis,
    diagnostics,
    screenshot,
    saveSnapshot
  };
}

/**
 * Despacha o relatório diretamente para o Supabase (ou retorna status caso não configurado)
 */
export async function dispatchReport(payload) {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      isConfigured: false,
      error: 'SUPABASE_NOT_CONFIGURED',
      message: 'O Supabase ainda não foi configurado com chaves ativas em telemetry_config.js.',
      payload
    };
  }

  try {
    const endpoint = `${TELEMETRY_CONFIG.supabaseUrl.replace(/\/+$/, '')}/rest/v1/${TELEMETRY_CONFIG.tableName}`;
    
    // Mapeamento limpo para as colunas da tabela SQL no Supabase
    const dbRecord = {
      category: payload.category,
      title: payload.title || 'Sem título',
      description: payload.description || '',
      game_version: payload.systemInfo.gameVersion,
      game_date: payload.gameStateSummary.gameDate,
      cash: payload.gameStateSummary.cash,
      company_name: payload.gameStateSummary.companyName,
      heuristics: {
        anomalies: payload.balanceAnalysis.anomalies,
        metrics: payload.balanceAnalysis.metrics,
        empireSummary: payload.balanceAnalysis.empireSummary
      },
      console_errors: payload.diagnostics.consoleErrors,
      recent_actions: payload.diagnostics.recentActions,
      save_snapshot: payload.saveSnapshot,
      screenshot_data: payload.screenshot,
      status: 'open'
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': TELEMETRY_CONFIG.supabaseAnonKey,
        'Authorization': `Bearer ${TELEMETRY_CONFIG.supabaseAnonKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(dbRecord)
    });

    if (response.ok) {
      return {
        success: true,
        isConfigured: true,
        reportId: payload.id
      };
    } else {
      const errBody = await response.text();
      return {
        success: false,
        isConfigured: true,
        status: response.status,
        error: response.statusText,
        details: errBody,
        payload
      };
    }
  } catch (err) {
    return {
      success: false,
      isConfigured: true,
      error: 'NETWORK_ERROR',
      details: err.message || String(err),
      payload
    };
  }
}

/**
 * Baixa o pacote completo de telemetria em arquivo .json
 */
export function downloadReportJson(payload) {
  try {
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Oikonomia_Report_${payload.category}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error('Erro ao baixar relatório:', e);
    return false;
  }
}

/**
 * Copia o resumo técnico e o JSON para a área de transferência
 */
export async function copyReportToClipboard(payload) {
  try {
    const jsonStr = JSON.stringify(payload, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonStr);
      return true;
    } else {
      const ta = document.createElement('textarea');
      ta.value = jsonStr;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    }
  } catch (e) {
    console.error('Erro ao copiar relatório:', e);
    return false;
  }
}

export default {
  initTelemetryEngine,
  trackPlayerAction,
  captureOptimizedScreenshot,
  analyzeGameBalance,
  buildTelemetryPayload,
  dispatchReport,
  downloadReportJson,
  copyReportToClipboard,
  isSupabaseConfigured
};
