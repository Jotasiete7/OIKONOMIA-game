/**
 * OIKONOMIA - Dev Dashboard, Debug System & Flight Recorder Panel (F3 / F8)
 * client/ui/panels/dev_dashboard_panel.js
 *
 * Responsável por:
 * - Painel de Desenvolvedor (F3): estatísticas de runtime, diagnósticos e galeria de assets
 * - Buffer de logs de depuração (systemDebugLogs) com terminal virtual
 * - Ferramentas de Sandbox (adicionar caixa, avançar mês, desbloquear cidades, dump JSON)
 * - Flight Recorder & Bug Reporter (F8): captura/colagem de print, telemetria Supabase
 * - Bug Replayer: carregamento e reprodução de snapshots de erro
 */

import { GAME_VERSION_INFO, CURRENT_SAVE_VERSION } from '../../save_system.js';

export const DevDashboardPanel = {
  systemDebugLogs: [],
  currentBugReportScreenshot: null,
  currentBugReportCachedPayload: null,

  // ===========================================================================
  // 1. SISTEMA DE LOGS DE DEPURAÇÃO
  // ===========================================================================
  logDebug(message, category = 'ENGINE') {
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const entry = { time, category, message };
    this.systemDebugLogs.push(entry);
    if (this.systemDebugLogs.length > 300) this.systemDebugLogs.shift();

    const countEl = document.getElementById('dev-logs-count');
    if (countEl) countEl.textContent = this.systemDebugLogs.length;

    const term = document.getElementById('dev-logs-terminal');
    if (term) {
      const line = document.createElement('div');
      const color = category === 'ERROR' ? 'text-rose-400 font-bold'
        : (category === 'WARN' ? 'text-amber-400 font-bold'
        : (category === 'SAVE' ? 'text-emerald-400'
        : (category === 'SANDBOX' ? 'text-purple-300' : 'text-sky-300')));
      line.innerHTML = `<span class="text-slate-500">[${time}]</span> <span class="${color}">[${category}]</span> ${message}`;
      term.appendChild(line);
      term.scrollTop = term.scrollHeight;
    }
  },

  clearDebugLogs() {
    this.systemDebugLogs.length = 0;
    const term = document.getElementById('dev-logs-terminal');
    if (term) term.innerHTML = '<div class="text-slate-600 italic">Logs limpos.</div>';
    const countEl = document.getElementById('dev-logs-count');
    if (countEl) countEl.textContent = '0';
  },

  // ===========================================================================
  // 2. PAINEL DE DESENVOLVIMENTO (F3)
  // ===========================================================================
  toggleDevDashboard() {
    const modal = document.getElementById('dev-dashboard-modal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
      this.openDevDashboard();
    } else {
      this.closeDevDashboard();
    }
  },

  openDevDashboard() {
    const modal = document.getElementById('dev-dashboard-modal');
    if (!modal) return;

    const facCount = (typeof window !== 'undefined' && window.activeFacilitySet) ? window.activeFacilitySet.size : 0;
    const sparseEl = document.getElementById('dev-stat-sparse-tiles');
    if (sparseEl) sparseEl.textContent = `${facCount} tiles indexados`;

    const protoEl = document.getElementById('dev-stat-protocol');
    if (protoEl && typeof window !== 'undefined') protoEl.textContent = window.location.protocol;

    const prof = (typeof window !== 'undefined' && window.playerProfile) ? window.playerProfile : {};
    const compEl = document.getElementById('dev-session-company');
    if (compEl) compEl.textContent = `${prof.playerName || 'Jogador'} (${prof.companyName || 'Empresa'})`;

    const d = typeof window !== 'undefined' ? (window.day || 1) : 1;
    const m = typeof window !== 'undefined' ? (window.month || 1) : 1;
    const y = typeof window !== 'undefined' ? (window.year || 1) : 1;
    const dateEl = document.getElementById('dev-session-date');
    if (dateEl) dateEl.textContent = `Dia ${String(d).padStart(2, '0')} / Mês ${String(m).padStart(2, '0')} / Ano ${y}`;

    const cashVal = typeof window !== 'undefined' && typeof window.cash === 'number' ? window.cash : 0;
    const cashEl = document.getElementById('dev-session-cash');
    if (cashEl) cashEl.textContent = `$${cashVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const cities = (typeof window !== 'undefined' && window.unlockedCities) ? window.unlockedCities : {};
    const citiesEl = document.getElementById('dev-session-cities');
    if (citiesEl) {
      const unlocked = Object.values(cities).filter(Boolean).length;
      citiesEl.textContent = `${unlocked} / ${Object.keys(cities).length} cidades`;
    }

    modal.classList.remove('hidden');
    this.switchDevTab('diag');
    this.logDebug('Painel de Desenvolvimento aberto.', 'DEV_UI');
  },

  closeDevDashboard() {
    const modal = document.getElementById('dev-dashboard-modal');
    if (modal) modal.classList.add('hidden');
  },

  switchDevTab(tab) {
    ['diag', 'assets', 'logs', 'tools', 'replayer'].forEach(t => {
      const content = document.getElementById(`dev-tab-${t}`);
      const btn = document.getElementById(`dev-tab-btn-${t}`);
      if (content) content.classList.toggle('hidden', t !== tab);
      if (btn) {
        btn.className = t === tab
          ? 'px-3 py-1 rounded-lg font-bold bg-indigo-600 text-white'
          : 'px-3 py-1 rounded-lg font-bold text-slate-400 hover:bg-slate-800';
      }
    });

    if (tab === 'assets') {
      this.renderDevAssetsGallery();
    }
  },

  renderDevAssetsGallery() {
    const grid = document.getElementById('dev-assets-gallery-grid');
    const spriteMgr = typeof window !== 'undefined' ? window.SpriteManager : null;
    if (!grid || !spriteMgr || !spriteMgr.ASSET_CATALOG) return;

    const catalog = spriteMgr.ASSET_CATALOG;
    const categories = {
      '🏪 Lojas & Varejo': Object.keys(catalog).filter(k => k.startsWith('lojas/')),
      '🏭 Empresas & Manufatura': Object.keys(catalog).filter(k => k.startsWith('empresas/')),
      '🏡 Casas & Urbanismo': Object.keys(catalog).filter(k => k.startsWith('casas/')),
      '🛣️ Estradas & Vias': Object.keys(catalog).filter(k => k.startsWith('estradas/')),
      '🌾 Agropecuária': Object.keys(catalog).filter(k => k.startsWith('agro/')),
      '⛏️ Minas & Recursos': Object.keys(catalog).filter(k => k.startsWith('minas/')),
      '⚓ Logística & Mídia': Object.keys(catalog).filter(k => k.startsWith('logistica_midia/')),
      '🗺️ Terrenos Base': Object.keys(catalog).filter(k => k.startsWith('terrenos/'))
    };

    grid.innerHTML = Object.entries(categories).map(([catTitle, keys]) => `
      <div class="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
        <div class="text-xs font-bold text-slate-200 border-b border-slate-800/80 pb-1.5 flex justify-between">
          <span>${catTitle}</span>
          <span class="text-[10px] text-slate-500 font-mono">${keys.length} itens</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          ${keys.map(k => {
            const filename = catalog[k];
            const name = k.split('/')[1];
            return `
              <div class="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-col items-center text-center gap-1 hover:border-emerald-500 transition">
                <div class="w-12 h-12 flex items-center justify-center bg-slate-950 rounded-lg p-0.5 border border-slate-800/60 shadow-inner">
                  <img src="${filename}" class="max-w-full max-h-full object-contain" alt="${name}" onerror="this.outerHTML='<span class=\\'text-xs text-rose-500\\'>Erro</span>'">
                </div>
                <span class="text-[9px] font-mono text-slate-300 truncate w-full" title="${filename}">${name}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  },

  copyDiagnosticReport() {
    const prof = (typeof window !== 'undefined' && window.playerProfile) ? window.playerProfile : {};
    const d = typeof window !== 'undefined' ? (window.day || 1) : 1;
    const m = typeof window !== 'undefined' ? (window.month || 1) : 1;
    const y = typeof window !== 'undefined' ? (window.year || 1) : 1;
    const cashVal = typeof window !== 'undefined' && typeof window.cash === 'number' ? window.cash : 0;
    const facCount = (typeof window !== 'undefined' && window.activeFacilitySet) ? window.activeFacilitySet.size : 0;
    const cities = (typeof window !== 'undefined' && window.unlockedCities) ? window.unlockedCities : {};
    const mktContracts = (typeof window !== 'undefined' && window.activeMarketingContracts) ? window.activeMarketingContracts.size : 0;
    const playtime = typeof window !== 'undefined' && typeof window.playtimeSeconds === 'number' ? window.playtimeSeconds : 0;
    const vInfo = (typeof window !== 'undefined' && window.GAME_VERSION_INFO) ? window.GAME_VERSION_INFO : GAME_VERSION_INFO;

    const report = [
      "===================================================================",
      "🏛️ OIKONOMIA — RELATÓRIO DE DIAGNÓSTICO DO SISTEMA & SUPORTE",
      "===================================================================",
      `Versão Oficial: ${vInfo.fullString}`,
      `Save Schema: ${vInfo.saveSchema}`,
      `Ambiente / Protocolo: ${typeof window !== 'undefined' ? window.location.protocol : 'file:'}`,
      `Data da Partida: Dia ${d} / Mês ${m} / Ano ${y}`,
      `Empresa: ${prof.companyName || 'Empresa'} (CEO: ${prof.playerName || 'Jogador'})`,
      `Dificuldade: ${prof.difficulty || 'standard'} | Avatar: ${prof.avatarId || 'default'}`,
      `Caixa: $${cashVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Instalações no Sparse Index: ${facCount} tiles`,
      `Cidades Desbloqueadas: ${JSON.stringify(cities)}`,
      `Contratos de Marketing Ativos: ${mktContracts}`,
      `Tempo de Jogo (Playtime): ${Math.floor(playtime / 3600)}h ${Math.floor((playtime % 3600) / 60)}m ${playtime % 60}s (${playtime}s)`,
      "-------------------------------------------------------------------",
      "Últimos 10 Logs de Debug:",
      ...this.systemDebugLogs.slice(-10).map(l => `[${l.time}] [${l.category}] ${l.message}`),
      "==================================================================="
    ].join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(report).then(() => this.showCopyFeedback());
    } else {
      const ta = document.createElement('textarea');
      ta.value = report;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      this.showCopyFeedback();
    }
  },

  showCopyFeedback() {
    const fb = document.getElementById('dev-copy-feedback');
    if (fb) {
      fb.classList.remove('hidden');
      setTimeout(() => fb.classList.add('hidden'), 3500);
    }
    if (typeof window !== 'undefined' && typeof window.playSuccessChime === 'function') {
      window.playSuccessChime();
    }
    this.logDebug('Relatório de diagnóstico copiado com sucesso.', 'REPORT');
  },

  // ===========================================================================
  // 3. SANDBOX DEV HELPERS
  // ===========================================================================
  devAddCash(amt) {
    if (typeof window !== 'undefined') {
      window.cash = (window.cash || 0) + amt;
      if (typeof window.updateUI === 'function') window.updateUI();
      if (typeof window.addLog === 'function') {
        window.addLog(`💵 DEV SANDBOX: Adicionado +$${amt.toLocaleString()} ao caixa.`, 'text-emerald-400 font-bold', { category: 'system' });
      }
    }
    this.logDebug(`Injetado +$${amt} no caixa via Dev Sandbox. Novo saldo: $${window.cash}`, 'SANDBOX');
  },

  devAdvanceMonth() {
    if (typeof window !== 'undefined' && typeof window.simulateDay === 'function') {
      for (let i = 0; i < 30; i++) {
        window.simulateDay();
      }
      if (typeof window.addLog === 'function') {
        window.addLog(`⏩ DEV SANDBOX: Avançados 30 dias de simulação instantaneamente.`, 'text-amber-400 font-bold', { category: 'system' });
      }
    }
    this.logDebug('Avançados 30 dias via Dev Sandbox.', 'SANDBOX');
  },

  devUnlockAllCities() {
    if (typeof window !== 'undefined' && window.unlockedCities) {
      Object.keys(window.unlockedCities).forEach(c => { window.unlockedCities[c] = true; });
      if (typeof window.checkCityUnlocks === 'function') window.checkCityUnlocks();
      if (typeof window.updateUI === 'function') window.updateUI();
      if (typeof window.addLog === 'function') {
        window.addLog(`🔓 DEV SANDBOX: Todas as 4 cidades foram desbloqueadas.`, 'text-sky-400 font-bold', { category: 'system' });
      }
    }
    this.logDebug('Todas as cidades desbloqueadas via Dev Sandbox.', 'SANDBOX');
  },

  devDumpGameState() {
    const serializeFn = (typeof window !== 'undefined' && typeof window.serializeCurrentGame === 'function')
      ? window.serializeCurrentGame
      : null;
    if (!serializeFn) return;

    const dump = serializeFn();
    const str = JSON.stringify(dump, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const saveVer = (typeof window !== 'undefined' && window.CURRENT_SAVE_VERSION) ? window.CURRENT_SAVE_VERSION : CURRENT_SAVE_VERSION;
    a.download = `Oikonomia_GameState_Dump_v${saveVer}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.logDebug('Dump completo de GameState exportado.', 'SANDBOX');
  },

  // ===========================================================================
  // 4. SISTEMA DE REPORTE DE BUGS & FLIGHT RECORDER (F8)
  // ===========================================================================
  async toggleBugReportModal() {
    const modal = document.getElementById('bug-report-modal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
      await this.openBugReportModal();
    } else {
      this.closeBugReportModal();
    }
  },

  async openBugReportModal() {
    const modal = document.getElementById('bug-report-modal');
    if (!modal) return;

    // Pausa o jogo temporariamente para não perder o estado exato
    if (typeof window !== 'undefined' && window.gameSpeed > 0) {
      if (typeof window.setSpeed === 'function') window.setSpeed(0);
    }

    // Reseta inputs
    const titleEl = document.getElementById('bug-report-title');
    if (titleEl) titleEl.value = '';
    const descEl = document.getElementById('bug-report-desc');
    if (descEl) descEl.value = '';
    const catEl = document.getElementById('bug-report-category');
    if (catEl) catEl.value = 'bug';
    const chkScreen = document.getElementById('bug-report-include-screen');
    if (chkScreen) chkScreen.checked = true;
    const chkSave = document.getElementById('bug-report-include-save');
    if (chkSave) chkSave.checked = true;

    const preview = document.getElementById('bug-report-screenshot-preview');
    const placeholder = document.getElementById('bug-report-screenshot-placeholder');
    const statusBadge = document.getElementById('bug-report-screenshot-status');
    if (preview) {
      preview.src = '';
      preview.classList.add('hidden');
    }
    if (placeholder) {
      placeholder.classList.remove('hidden');
    }
    if (statusBadge) statusBadge.textContent = '';

    const fbEl = document.getElementById('bug-report-feedback');
    if (fbEl) {
      fbEl.className = 'hidden';
      fbEl.innerHTML = '';
    }

    const submitBtn = document.getElementById('bug-report-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>🚀 Enviar para a Equipe OIKONOMIA</span>';
    }

    // Tira o screenshot instantâneo antes de exibir o modal
    await this.refreshBugReportScreenshot();

    // Atualiza sumário técnico de transparência
    this.updateBugReportTechSummary();

    modal.classList.remove('hidden');
    if (titleEl) setTimeout(() => titleEl.focus(), 100);
    this.logDebug('Modal de reporte de bugs (Flight Recorder) aberto.', 'BUG_UI');
  },

  closeBugReportModal() {
    const modal = document.getElementById('bug-report-modal');
    if (modal) modal.classList.add('hidden');
  },

  onBugReportCategoryChange() {
    const catEl = document.getElementById('bug-report-category');
    const chkScreen = document.getElementById('bug-report-include-screen');
    const chkSave = document.getElementById('bug-report-include-save');
    const screenContainer = document.getElementById('bug-report-screenshot-container');
    if (!catEl) return;

    if (catEl.value === 'suggestion') {
      if (chkScreen) chkScreen.checked = false;
      if (screenContainer) screenContainer.classList.add('opacity-40');
    } else {
      if (chkScreen) chkScreen.checked = true;
      if (chkSave) chkSave.checked = true;
      if (screenContainer) screenContainer.classList.remove('opacity-40');
    }
  },

  async retakeScreenshotFromGame() {
    const modal = document.getElementById('bug-report-modal');
    const statusBadge = document.getElementById('bug-report-screenshot-status');
    if (statusBadge) statusBadge.textContent = '⏳ Capturando...';

    if (modal && !modal.classList.contains('hidden')) {
      modal.style.opacity = '0';
      if (typeof window !== 'undefined' && typeof window.renderMap === 'function') {
        try { window.renderMap(); } catch (_) {}
      }
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => setTimeout(r, 60));
    }

    await this.refreshBugReportScreenshot();

    if (modal) {
      modal.style.opacity = '1';
    }
  },

  async refreshBugReportScreenshot() {
    const preview = document.getElementById('bug-report-screenshot-preview');
    const placeholder = document.getElementById('bug-report-screenshot-placeholder');
    const statusBadge = document.getElementById('bug-report-screenshot-status');

    if (statusBadge) statusBadge.textContent = '⏳ Capturando...';

    try {
      const shotFn = (typeof window !== 'undefined' && window.captureOptimizedScreenshot) ||
                     (typeof window !== 'undefined' && window.TelemetrySystem && window.TelemetrySystem.captureOptimizedScreenshot) ||
                     null;

      if (shotFn) {
        this.currentBugReportScreenshot = await shotFn();
      }

      if (this.currentBugReportScreenshot && preview) {
        preview.src = this.currentBugReportScreenshot;
        preview.classList.remove('hidden');
        if (placeholder) placeholder.classList.add('hidden');
        if (statusBadge) {
          statusBadge.textContent = '✅ Print pronto';
          setTimeout(() => { if (statusBadge) statusBadge.textContent = ''; }, 3000);
        }
      } else {
        if (statusBadge) statusBadge.textContent = '⚠️ Sem print do jogo';
      }
    } catch (err) {
      console.error('[Telemetry] Erro ao capturar screenshot:', err);
      if (statusBadge) statusBadge.textContent = '⚠️ Erro na captura';
    }
  },

  optimizePastedImage(dataUrl, callback) {
    try {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 960;
        const maxHeight = 540;
        let targetWidth = img.width || 960;
        let targetHeight = img.height || 540;
        if (targetWidth > maxWidth || targetHeight > maxHeight) {
          const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
          targetWidth = Math.max(10, Math.round(targetWidth * ratio));
          targetHeight = Math.max(10, Math.round(targetHeight * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return callback(dataUrl);
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        callback(canvas.toDataURL('image/jpeg', 0.70));
      };
      img.onerror = () => callback(dataUrl);
      img.src = dataUrl;
    } catch (_) {
      callback(dataUrl);
    }
  },

  initClipboardPasteListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('paste', (e) => {
      const modal = document.getElementById('bug-report-modal');
      if (!modal || modal.classList.contains('hidden')) return;

      const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target.result;
            this.optimizePastedImage(dataUrl, (optimizedUrl) => {
              this.currentBugReportScreenshot = optimizedUrl;
              const preview = document.getElementById('bug-report-screenshot-preview');
              const placeholder = document.getElementById('bug-report-screenshot-placeholder');
              const statusBadge = document.getElementById('bug-report-screenshot-status');
              if (preview) {
                preview.src = optimizedUrl;
                preview.classList.remove('hidden');
              }
              if (placeholder) placeholder.classList.add('hidden');
              if (statusBadge) {
                statusBadge.textContent = '📋 Print colado via Clipboard (Ctrl+V)!';
                setTimeout(() => { if (statusBadge) statusBadge.textContent = ''; }, 3000);
              }
              const chkScreen = document.getElementById('bug-report-include-screen');
              if (chkScreen) chkScreen.checked = true;
            });
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    });
  },

  updateBugReportTechSummary() {
    const summaryEl = document.getElementById('bug-report-tech-summary');
    if (!summaryEl) return;

    const cashVal = typeof window !== 'undefined' && typeof window.cash === 'number' ? window.cash : 0;
    const dateStr = `Dia ${window.day || 1}/${window.month || 1} · Ano ${window.year || 1}`;
    const facilitiesCount = (typeof window !== 'undefined' && window.activeFacilitySet) ? window.activeFacilitySet.size : 0;
    const isCfg = (typeof window !== 'undefined' && typeof window.isSupabaseConfigured === 'function')
      ? window.isSupabaseConfigured()
      : false;

    let balanceInfo = 'Sem alertas graves de desbalanceamento';
    if (typeof window !== 'undefined' && typeof window.analyzeGameBalance === 'function') {
      const analysis = window.analyzeGameBalance();
      if (analysis && analysis.anomalies && analysis.anomalies.length > 0) {
        balanceInfo = `<span class="text-rose-400 font-bold">${analysis.anomalies.length} anomalia(s) detectada(s):</span> ` +
          analysis.anomalies.map(a => `<br>• [${a.code}] ${a.message}`).join('');
      }
    }

    summaryEl.innerHTML = `
      <div><strong>Empresa:</strong> ${window.playerProfile?.companyName || 'Empresa'} (CEO: ${window.playerProfile?.playerName || 'Jogador'})</div>
      <div><strong>Data / Caixa:</strong> ${dateStr} · Caixa: $${cashVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div><strong>Instalações no Sparse Index:</strong> ${facilitiesCount} prédios mapeados</div>
      <div><strong>Destino Telemetria:</strong> ${isCfg ? '<span class="text-emerald-400 font-bold">Conectado ao Servidor Oficial</span>' : '<span class="text-amber-400 font-bold">Modo Local / Aguardando chaves</span>'}</div>
      <div class="mt-1 border-t border-slate-800 pt-1"><strong>Status de Balanceamento:</strong> ${balanceInfo}</div>
    `;
  },

  async prepareCurrentReportPayload() {
    const catEl = document.getElementById('bug-report-category');
    const titleEl = document.getElementById('bug-report-title');
    const descEl = document.getElementById('bug-report-desc');
    const chkScreen = document.getElementById('bug-report-include-screen');
    const chkSave = document.getElementById('bug-report-include-save');

    const category = catEl ? catEl.value : 'bug';
    const title = titleEl?.value?.trim() || 'Reporte de Jogo';
    const description = descEl?.value?.trim() || '';
    const includeScreenshot = chkScreen ? chkScreen.checked : true;
    const includeSave = chkSave ? chkSave.checked : true;

    const buildFn = (typeof window !== 'undefined' && typeof window.buildTelemetryPayload === 'function')
      ? window.buildTelemetryPayload
      : null;

    if (buildFn) {
      const payload = await buildFn({
        category,
        title,
        description,
        includeScreenshot,
        includeSave
      });
      if (includeScreenshot && this.currentBugReportScreenshot) {
        payload.screenshot = this.currentBugReportScreenshot;
      }
      return payload;
    }
    return null;
  },

  async submitBugReport() {
    const titleEl = document.getElementById('bug-report-title');
    const fbEl = document.getElementById('bug-report-feedback');
    const submitBtn = document.getElementById('bug-report-submit-btn');

    if (!titleEl || !titleEl.value.trim()) {
      if (fbEl) {
        fbEl.className = 'p-3 rounded-xl text-xs font-bold bg-rose-950/80 border border-rose-700 text-rose-300 block';
        fbEl.innerHTML = '⚠️ Por favor, preencha um título ou resumo curto para o reporte.';
      }
      if (titleEl) titleEl.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="animate-spin">⏳</span> <span>Enviando para a Equipe...</span>';
    }

    if (fbEl) {
      fbEl.className = 'p-3 rounded-xl text-xs font-bold bg-indigo-950/80 border border-indigo-700 text-indigo-300 block';
      fbEl.innerHTML = '🔄 Empacotando telemetria, diagnóstico e enviando para a equipe de desenvolvimento...';
    }

    try {
      const payload = await this.prepareCurrentReportPayload();
      if (!payload) throw new Error('Falha ao gerar payload de telemetria.');

      this.currentBugReportCachedPayload = payload;

      const dispatchFn = (typeof window !== 'undefined' && typeof window.dispatchReport === 'function')
        ? window.dispatchReport
        : null;

      if (!dispatchFn) throw new Error('Mecanismo de despacho de relatórios indisponível.');

      const result = await dispatchFn(payload);

      if (result.success) {
        if (fbEl) {
          fbEl.className = 'p-3 rounded-xl text-xs font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300 block';
          fbEl.innerHTML = `✅ Relatório enviado com sucesso para a Equipe OIKONOMIA! ID: <span class="font-mono text-[11px] text-white">${result.reportId}</span>.<br><span class="text-[10px] text-slate-300">A equipe agradece seu apoio para aprimorar o jogo!</span>`;
        }
        if (submitBtn) {
          submitBtn.innerHTML = '<span>✅ Enviado com Sucesso</span>';
        }
        if (typeof window !== 'undefined' && typeof window.playSuccessChime === 'function') {
          window.playSuccessChime();
        }
        setTimeout(() => {
          this.closeBugReportModal();
        }, 3000);
      } else if (!result.isConfigured) {
        if (fbEl) {
          fbEl.className = 'p-3 rounded-xl text-xs bg-amber-950/80 border border-amber-700 text-amber-200 block';
          fbEl.innerHTML = `
            <strong>ℹ️ Servidor de Relatórios em Manutenção:</strong><br>
            As credenciais ativas do servidor ainda não foram sincronizadas.<br>
            <span class="block mt-1">Você pode clicar em <strong>Copiar Pacote</strong> ou <strong>Baixar .json</strong> abaixo para envio manual!</span>
          `;
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>🚀 Tentar Novamente</span>';
        }
      } else {
        if (fbEl) {
          fbEl.className = 'p-3 rounded-xl text-xs bg-rose-950/80 border border-rose-700 text-rose-300 block';
          fbEl.innerHTML = `
            <strong>❌ Erro ao enviar para o Servidor:</strong> ${result.error || 'Falha de conexão'}<br>
            <span class="text-[10px] text-slate-400">${result.details || ''}</span><br>
            <span class="block mt-1">Você pode clicar em <strong>Copiar Pacote</strong> ou <strong>Baixar .json</strong> abaixo para não perder os dados.</span>
          `;
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>🚀 Tentar Novamente</span>';
        }
      }
    } catch (err) {
      if (fbEl) {
        fbEl.className = 'p-3 rounded-xl text-xs bg-rose-950/80 border border-rose-700 text-rose-300 block';
        fbEl.innerHTML = `❌ Erro inesperado: ${err.message || err}`;
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>🚀 Tentar Novamente</span>';
      }
    }
  },

  async copyBugReportToClipboard() {
    const payload = this.currentBugReportCachedPayload || await this.prepareCurrentReportPayload();
    if (!payload) return;

    const copyFn = (typeof window !== 'undefined' && typeof window.copyReportToClipboard === 'function')
      ? window.copyReportToClipboard
      : null;

    if (!copyFn) return;
    const fbEl = document.getElementById('bug-report-feedback');
    const ok = await copyFn(payload);
    if (ok && fbEl) {
      fbEl.className = 'p-3 rounded-xl text-xs font-bold bg-indigo-950/80 border border-indigo-700 text-indigo-300 block';
      fbEl.innerHTML = '📋 Pacote completo copiado para a Área de Transferência com sucesso!';
      if (typeof window !== 'undefined' && typeof window.playSuccessChime === 'function') {
        window.playSuccessChime();
      }
    }
  },

  async downloadBugReportFile() {
    const payload = this.currentBugReportCachedPayload || await this.prepareCurrentReportPayload();
    if (!payload) return;

    const dlFn = (typeof window !== 'undefined' && typeof window.downloadReportJson === 'function')
      ? window.downloadReportJson
      : null;

    if (!dlFn) return;
    const fbEl = document.getElementById('bug-report-feedback');
    const ok = dlFn(payload);
    if (ok && fbEl) {
      fbEl.className = 'p-3 rounded-xl text-xs font-bold bg-indigo-950/80 border border-indigo-700 text-indigo-300 block';
      fbEl.innerHTML = '💾 Arquivo de relatório baixado com sucesso no seu computador!';
      if (typeof window !== 'undefined' && typeof window.playSuccessChime === 'function') {
        window.playSuccessChime();
      }
    }
  },

  // ===========================================================================
  // 5. BUG REPLAYER
  // ===========================================================================
  clearReplayerInput() {
    const inputEl = document.getElementById('dev-replayer-json-input');
    if (inputEl) inputEl.value = '';
    const fbEl = document.getElementById('dev-replayer-feedback');
    if (fbEl) fbEl.className = 'hidden';
  },

  loadReportSaveFromReplayer() {
    const inputEl = document.getElementById('dev-replayer-json-input');
    const fbEl = document.getElementById('dev-replayer-feedback');
    if (!inputEl || !inputEl.value.trim()) {
      if (fbEl) {
        fbEl.className = 'text-rose-400 bg-rose-950/80 border border-rose-800 p-2.5 rounded-xl block';
        fbEl.textContent = '⚠️ Cole o JSON do reporte ou do save_snapshot no campo acima.';
      }
      return;
    }

    try {
      const rawData = JSON.parse(inputEl.value.trim());

      // Se o desenvolvedor colou o reporte completo, extrai save_snapshot
      let saveObj = rawData;
      if (rawData.save_snapshot && typeof rawData.save_snapshot === 'object') {
        saveObj = rawData.save_snapshot;
      } else if (rawData.saveSnapshot && typeof rawData.saveSnapshot === 'object') {
        saveObj = rawData.saveSnapshot;
      }

      if (!saveObj.playerProfile && !saveObj.cash && !saveObj.builtTiles) {
        throw new Error('O JSON colado não contém uma estrutura de save válida (playerProfile/cash/builtTiles).');
      }

      const loadFn = (typeof window !== 'undefined' && typeof window.loadGameFromData === 'function')
        ? window.loadGameFromData
        : null;

      if (!loadFn) throw new Error('Função loadGameFromData indisponível.');

      const loaded = loadFn(saveObj);
      if (loaded) {
        const cName = (typeof window !== 'undefined' && window.playerProfile) ? window.playerProfile.companyName : 'Empresa';
        if (fbEl) {
          fbEl.className = 'text-emerald-400 bg-emerald-950/80 border border-emerald-800 p-2.5 rounded-xl block';
          fbEl.textContent = `✅ Partida carregada com sucesso! Empresa: [${cName}]. Fechando Dev Dashboard...`;
        }
        setTimeout(() => {
          this.closeDevDashboard();
        }, 1200);
      } else {
        throw new Error('Falha ao processar e migrar os dados do save.');
      }
    } catch (err) {
      if (fbEl) {
        fbEl.className = 'text-rose-400 bg-rose-950/80 border border-rose-800 p-2.5 rounded-xl block';
        fbEl.textContent = `❌ Erro ao carregar save: ${err.message}`;
      }
    }
  }
};

// Inicializa o listener de colagem de imagem por atalho global
DevDashboardPanel.initClipboardPasteListener();

// Global bindings for inline DOM events
if (typeof window !== 'undefined') {
  window.DevDashboardPanel = DevDashboardPanel;
  window.systemDebugLogs = DevDashboardPanel.systemDebugLogs;
  window.logDebug = DevDashboardPanel.logDebug.bind(DevDashboardPanel);
  window.clearDebugLogs = DevDashboardPanel.clearDebugLogs.bind(DevDashboardPanel);
  window.toggleDevDashboard = DevDashboardPanel.toggleDevDashboard.bind(DevDashboardPanel);
  window.openDevDashboard = DevDashboardPanel.openDevDashboard.bind(DevDashboardPanel);
  window.closeDevDashboard = DevDashboardPanel.closeDevDashboard.bind(DevDashboardPanel);
  window.switchDevTab = DevDashboardPanel.switchDevTab.bind(DevDashboardPanel);
  window.renderDevAssetsGallery = DevDashboardPanel.renderDevAssetsGallery.bind(DevDashboardPanel);
  window.copyDiagnosticReport = DevDashboardPanel.copyDiagnosticReport.bind(DevDashboardPanel);
  window.showCopyFeedback = DevDashboardPanel.showCopyFeedback.bind(DevDashboardPanel);
  window.devAddCash = DevDashboardPanel.devAddCash.bind(DevDashboardPanel);
  window.devAdvanceMonth = DevDashboardPanel.devAdvanceMonth.bind(DevDashboardPanel);
  window.devUnlockAllCities = DevDashboardPanel.devUnlockAllCities.bind(DevDashboardPanel);
  window.devDumpGameState = DevDashboardPanel.devDumpGameState.bind(DevDashboardPanel);
  window.toggleBugReportModal = DevDashboardPanel.toggleBugReportModal.bind(DevDashboardPanel);
  window.openBugReportModal = DevDashboardPanel.openBugReportModal.bind(DevDashboardPanel);
  window.closeBugReportModal = DevDashboardPanel.closeBugReportModal.bind(DevDashboardPanel);
  window.onBugReportCategoryChange = DevDashboardPanel.onBugReportCategoryChange.bind(DevDashboardPanel);
  window.retakeScreenshotFromGame = DevDashboardPanel.retakeScreenshotFromGame.bind(DevDashboardPanel);
  window.refreshBugReportScreenshot = DevDashboardPanel.refreshBugReportScreenshot.bind(DevDashboardPanel);
  window.optimizePastedImage = DevDashboardPanel.optimizePastedImage.bind(DevDashboardPanel);
  window.updateBugReportTechSummary = DevDashboardPanel.updateBugReportTechSummary.bind(DevDashboardPanel);
  window.prepareCurrentReportPayload = DevDashboardPanel.prepareCurrentReportPayload.bind(DevDashboardPanel);
  window.submitBugReport = DevDashboardPanel.submitBugReport.bind(DevDashboardPanel);
  window.copyBugReportToClipboard = DevDashboardPanel.copyBugReportToClipboard.bind(DevDashboardPanel);
  window.downloadBugReportFile = DevDashboardPanel.downloadBugReportFile.bind(DevDashboardPanel);
  window.clearReplayerInput = DevDashboardPanel.clearReplayerInput.bind(DevDashboardPanel);
  window.loadReportSaveFromReplayer = DevDashboardPanel.loadReportSaveFromReplayer.bind(DevDashboardPanel);
}

export default DevDashboardPanel;
