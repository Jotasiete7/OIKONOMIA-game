/**
 * ticker_system.js - Ticker de Notícias & Diário Corporativo em Tempo Real
 * OIKONOMIA Tycoon Engine (Reaproveitamento de eventos via addLog)
 */
const TickerSystem = (() => {
  let _enabled = true;
  let _items = []; // Fila de dados, máx 25 — só o que passou pela allowlist
  const MAX_ITEMS = 25;
  const RENDER_INTERVAL_MS = 8000; // Renderiza em lote a cada 8s para evitar saltos no marquee
  let _domTrack = null;
  let _renderTimer = null;
  let _pendingRender = false;

  // Só cores que o próprio jogo já usa pra sinalizar evento relevante viram notícia no ticker.
  // Log rotineiro (reabastecimento, produção do dia, sem destaque) fica só na lista lateral.
  const ALLOWED_COLOR_KEYWORDS = [
    'emerald-400 font-bold',
    'rose-400 font-bold',
    'amber-400 font-bold',
    'amber-300 font-bold',
    'rose-500 font-bold',
    'sky-400 font-bold',
    'teal-300 font-bold',
    'orange-400 font-bold',
    'indigo-400 font-bold',
    'purple-400 font-bold'
  ];

  function init(trackElementId) {
    _domTrack = document.getElementById(trackElementId);
    const saved = localStorage.getItem('oiko_ticker_enabled');
    _enabled = saved === null ? true : saved === 'true';
    
    const bar = document.getElementById('financial-news-ticker');
    if (bar) {
      bar.style.display = _enabled ? 'flex' : 'none';
    }

    if (_renderTimer) clearInterval(_renderTimer);
    _renderTimer = setInterval(_flushRender, RENDER_INTERVAL_MS);
    _render();
  }

  const SYSTEM_BLACKLIST_KEYWORDS = [
    'JOGO SALVO',
    'SAVE CARREGADO',
    'BACKUP EXPORTADO',
    'DEV SANDBOX'
  ];

  // Chamado a partir do addLog() já existente no jogo — não cria fonte de dado nova.
  // options.actionType é opcional (ex: 'OPEN_DRE', 'OPEN_RD') — só nos eventos que valem atalho.
  function pushFromLog(text, colorClass, options = {}) {
    if (!colorClass || !text) return;

    // 1. Filtro explícito de categoria (ignora sistema, autosaves, backups e sandbox)
    if (options.category === 'system' || options.category === 'save') return;

    // 2. Filtro por palavras-chave de sistema (camada de proteção extra)
    if (SYSTEM_BLACKLIST_KEYWORDS.some(kw => text.includes(kw))) return;

    // 3. Allowlist por cor de destaque
    const isRelevant = ALLOWED_COLOR_KEYWORDS.some(kw => colorClass.includes(kw));
    if (!isRelevant) return; // Filtra ruído operacional na origem

    _items.unshift({
      id: Date.now() + Math.random(),
      text,
      colorClass,
      actionType: options.actionType || null
    });

    if (_items.length > MAX_ITEMS) {
      _items.pop();
    }

    _pendingRender = true; // Marca para o próximo lote
  }

  function toggleEnabled(isEnabled) {
    _enabled = isEnabled;
    localStorage.setItem('oiko_ticker_enabled', String(isEnabled));
    const bar = document.getElementById('financial-news-ticker');
    if (bar) {
      bar.style.display = isEnabled ? 'flex' : 'none';
    }
  }

  function isEnabled() {
    return _enabled;
  }

  // Renderiza só se algo novo chegou desde o último lote — evita reconstruir o DOM à toa
  function _flushRender() {
    if (!_pendingRender) return;
    _pendingRender = false;
    _render();
  }

  const PIXELS_PER_SECOND = 55; // Velocidade linear constante (px/s) para leitura confortável independente da quantidade de itens

  function _render() {
    if (!_domTrack) return;
    if (_items.length === 0) {
      const placeholder = '<div class="ticker-item text-slate-400">🏛️ OIKONOMIA Corp — Pregão aberto e simulação em andamento</div><span class="mx-6 text-slate-600">•</span>';
      _domTrack.innerHTML = placeholder + placeholder;
    } else {
      const html = _items.map(it => {
        const clickAttr = it.actionType
          ? `onclick="TickerSystem.handleClick('${it.actionType}')" style="cursor:pointer" title="Clique para abrir detalhes"`
          : '';
        return `<div class="ticker-item ${it.colorClass}" ${clickAttr}>${it.text}</div><span class="mx-6 text-slate-600">•</span>`;
      }).join('');

      // Duplica o conteúdo uma vez para o loop do marquee ficar contínuo sem salto visual
      _domTrack.innerHTML = html + html;
    }

    // Calcula a duração dinâmica para manter a velocidade em pixels por segundo CONSTANTE
    // independente de ter 1 item ou 25 itens na fila!
    requestAnimationFrame(() => {
      if (!_domTrack) return;
      const halfWidth = _domTrack.scrollWidth / 2;
      const duration = Math.max(12, halfWidth / PIXELS_PER_SECOND);
      _domTrack.style.animationDuration = `${duration.toFixed(2)}s`;
    });
  }

  // Ponte simples pros modais que já existem no jogo — sem sistema de roteamento novo
  function handleClick(actionType) {
    if (actionType === 'OPEN_DRE' && typeof toggleDREModal === 'function') {
      toggleDREModal();
    }
    if (actionType === 'OPEN_RD' && typeof openTechTreeModal === 'function') {
      openTechTreeModal();
    }
  }

  return {
    init,
    pushFromLog,
    toggleEnabled,
    isEnabled,
    handleClick
  };
})();
