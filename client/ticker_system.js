/**
 * ticker_system.js - Ticker de Notícias & Diário Corporativo em Tempo Real
 * OIKONOMIA Tycoon Engine (Reciclagem dos 4 recursos do TortaApp)
 *
 * 1. Drag-to-Scroll: Arraste com mouse horizontalmente para ler mensagens antigas
 * 2. Speed Control: Slider de velocidade configurável no menu ESC
 * 3. Jump to Latest: Clique no badge do Diário para reiniciar no começo da fita
 * 4. Smart Alerts: Destaque visual tipo "Flame / Siren" para eventos críticos
 */
const TickerSystem = (() => {
  let _enabled = true;
  let _speedPxPerSec = 55; // Padrão 55 px/s (Lento ~35, Normal ~55, Rápido ~85)
  let _items = []; // Fila de dados, máx 25
  const MAX_ITEMS = 25;
  const RENDER_INTERVAL_MS = 8000; // Renderiza em lote a cada 8s
  let _domTrack = null;
  let _renderTimer = null;
  let _pendingRender = false;

  // Estados do Drag-to-Scroll
  let _isDragging = false;
  let _hasMoved = false;
  let _startX = 0;
  let _baseTranslateX = 0;

  // Allowlist de cores para eventos relevantes
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

  // Blacklist para isolar mensagens de sistema/autosave/debug
  const SYSTEM_BLACKLIST_KEYWORDS = [
    'JOGO SALVO',
    'SAVE CARREGADO',
    'BACKUP EXPORTADO',
    'DEV SANDBOX'
  ];

  // Padrões de eventos críticos que recebem Smart Alert Badge (Flame / Siren)
  const CRITICAL_ALERT_PATTERNS = [
    'FALÊNCIA DECRETADA',
    'ALERTA DE INSOLVÊNCIA',
    'ALERTA JUDICIAL',
    'SOLVÊNCIA RESTAURADA',
    'CIDADE DESBLOQUEADA',
    'FELIZ ANO NOVO',
    'NOVA EMPRESA FUNDADA',
    'P&D CONCLUÍDO',
    'RECORDE',
    'Stockout de',
    'Falta de ração'
  ];

  function init(trackElementId) {
    _domTrack = document.getElementById(trackElementId);
    
    const savedEnabled = localStorage.getItem('oiko_ticker_enabled');
    _enabled = savedEnabled === null ? true : savedEnabled === 'true';

    const savedSpeed = localStorage.getItem('oiko_ticker_speed');
    if (savedSpeed) {
      _speedPxPerSec = Math.max(25, Math.min(100, Number(savedSpeed)));
    }

    const bar = document.getElementById('financial-news-ticker');
    if (bar) {
      bar.style.display = _enabled ? 'flex' : 'none';
    }

    _setupDragListeners();

    if (_renderTimer) clearInterval(_renderTimer);
    _renderTimer = setInterval(_flushRender, RENDER_INTERVAL_MS);
    _render();
  }

  // 1. DRAG-TO-SCROLL (ARRASTAR COM O MOUSE)
  function _setupDragListeners() {
    if (!_domTrack) return;
    const viewport = _domTrack.parentElement;
    if (!viewport) return;

    viewport.style.cursor = 'grab';

    viewport.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Apenas botão principal
      _isDragging = true;
      _hasMoved = false;
      _startX = e.clientX;

      // Extrai a posição atual do marquee pela matriz de transformação computada
      const style = window.getComputedStyle(_domTrack);
      const matrix = new DOMMatrixReadOnly(style.transform);
      _baseTranslateX = matrix.m41 || 0;

      _domTrack.style.animationPlayState = 'paused';
      viewport.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!_isDragging) return;
      const diff = e.clientX - _startX;
      if (Math.abs(diff) > 4) {
        _hasMoved = true;
      }
      const newX = _baseTranslateX + diff;
      _domTrack.style.transform = `translate3d(${newX}px, 0, 0)`;
    });

    window.addEventListener('mouseup', () => {
      if (!_isDragging) return;
      _isDragging = false;
      if (viewport) viewport.style.cursor = 'grab';

      // Restaura a animação suave
      _domTrack.style.transform = '';
      _domTrack.style.animationPlayState = '';
    });
  }

  // 2. CONTROLE DE VELOCIDADE
  function setSpeed(pxPerSec) {
    _speedPxPerSec = Math.max(25, Math.min(100, Number(pxPerSec)));
    localStorage.setItem('oiko_ticker_speed', String(_speedPxPerSec));
    _updateAnimationDuration();
    _updateSpeedLabel();
  }

  function getSpeed() {
    return _speedPxPerSec;
  }

  function _updateSpeedLabel() {
    const lbl = document.getElementById('setting-ticker-speed-label');
    if (!lbl) return;
    let text = 'Normal';
    if (_speedPxPerSec < 45) text = 'Lento';
    else if (_speedPxPerSec > 65) text = 'Rápido';
    lbl.textContent = `${text} (${_speedPxPerSec} px/s)`;
  }

  function _updateAnimationDuration() {
    if (!_domTrack) return;
    const halfWidth = _domTrack.scrollWidth / 2;
    const duration = Math.max(8, halfWidth / _speedPxPerSec);
    _domTrack.style.animationDuration = `${duration.toFixed(2)}s`;
  }

  // 3. JUMP TO LATEST (PULAR PARA A NOTÍCIA MAIS RECENTE)
  function jumpToLatest() {
    if (!_domTrack) return;
    _domTrack.classList.remove('ticker-scroll-track');
    _domTrack.style.transform = 'translate3d(0, 0, 0)';
    void _domTrack.offsetWidth; // Força reflow DOM
    _domTrack.classList.add('ticker-scroll-track');
    _domTrack.style.transform = '';
    _updateAnimationDuration();

    // Feedback sonoro opcional
    if (typeof playSuccessChime === 'function') {
      playSuccessChime();
    }
  }

  // RECEBE EVENTOS DO addLog()
  function pushFromLog(text, colorClass, options = {}) {
    if (!colorClass || !text) return;

    // Filtros de isolamento
    if (options.category === 'system' || options.category === 'save') return;
    if (SYSTEM_BLACKLIST_KEYWORDS.some(kw => text.includes(kw))) return;

    const isRelevant = ALLOWED_COLOR_KEYWORDS.some(kw => colorClass.includes(kw));
    if (!isRelevant) return;

    // 4. SMART ALERTS: Detecta se o evento é crítico/destaque
    const isAlert = options.isAlert || CRITICAL_ALERT_PATTERNS.some(p => text.includes(p));

    _items.unshift({
      id: Date.now() + Math.random(),
      text,
      colorClass,
      actionType: options.actionType || null,
      isAlert
    });

    if (_items.length > MAX_ITEMS) {
      _items.pop();
    }

    _pendingRender = true;
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

  function _flushRender() {
    if (!_pendingRender) return;
    _pendingRender = false;
    _render();
  }

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

        // Renderização com Smart Alert Pill se for evento crítico
        if (it.isAlert) {
          const isDanger = it.colorClass.includes('rose') || it.text.includes('FALÊNCIA') || it.text.includes('Stockout');
          const alertBadge = isDanger
            ? 'bg-rose-950/70 border border-rose-500/60 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
            : 'bg-amber-950/70 border border-amber-500/60 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]';
          const alertIcon = isDanger
            ? '<span class="animate-pulse mr-1">🚨</span>'
            : '<span class="animate-pulse mr-1">🔥</span>';

          return `<div class="ticker-item px-2 py-0.5 rounded-md ${alertBadge} font-bold" ${clickAttr}>${alertIcon}${it.text}</div><span class="mx-6 text-slate-600">•</span>`;
        }

        return `<div class="ticker-item ${it.colorClass}" ${clickAttr}>${it.text}</div><span class="mx-6 text-slate-600">•</span>`;
      }).join('');

      _domTrack.innerHTML = html + html;
    }

    requestAnimationFrame(() => {
      _updateAnimationDuration();
    });
  }

  function handleClick(actionType) {
    if (_hasMoved) return; // Se estava arrastando a fita, não dispara o clique acidentalmente
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
    setSpeed,
    getSpeed,
    jumpToLatest,
    handleClick
  };
})();
