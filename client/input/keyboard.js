// ===========================================================================
// OIKONOMIA — SISTEMA DE CONTROLE DE TECLADO & ATALHOS EXECUTIVOS
// client/input/keyboard.js
// ===========================================================================

export class KeyboardController {
  constructor() {
    this.activeKeys = new Set();
    this.isTheaterMode = false;
    this.isCameraLoopRunning = false;
    this._boundKeyDown = this.handleKeyDown.bind(this);
    this._boundKeyUp = this.handleKeyUp.bind(this);
    this._boundCameraLoop = this.updateKeyboardCamera.bind(this);
  }

  init() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
    this.startCameraLoop();
  }

  destroy() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);
    this.isCameraLoopRunning = false;
    this.activeKeys.clear();
  }

  toggleTheaterMode() {
    this.isTheaterMode = !this.isTheaterMode;
    const leftCol = document.querySelector('section.col-span-12.lg\\:col-span-8');
    const rightCol = document.querySelector('section.col-span-12.lg\\:col-span-4');
    const canvasEl = document.getElementById('iso-canvas');
    const btn = document.getElementById('btn-theater-mode');

    if (this.isTheaterMode) {
      if (leftCol) {
        leftCol.classList.remove('lg:col-span-8');
        leftCol.classList.add('lg:col-span-12');
      }
      if (rightCol) {
        rightCol.classList.add('hidden');
      }
      if (canvasEl && canvasEl.parentElement) {
        canvasEl.parentElement.classList.remove('min-h-[520px]', 'max-h-[660px]');
        canvasEl.parentElement.classList.add('min-h-[740px]', 'max-h-[860px]');
      }
      if (btn) btn.innerHTML = '⛶ Restaurar Painéis';
    } else {
      if (leftCol) {
        leftCol.classList.remove('lg:col-span-12');
        leftCol.classList.add('lg:col-span-8');
      }
      if (rightCol) {
        rightCol.classList.remove('hidden');
      }
      if (canvasEl && canvasEl.parentElement) {
        canvasEl.parentElement.classList.remove('min-h-[740px]', 'max-h-[860px]');
        canvasEl.parentElement.classList.add('min-h-[520px]', 'max-h-[660px]');
      }
      if (btn) btn.innerHTML = '⛶ Expandir Mapa';
    }

    setTimeout(() => {
      const resizeFn = window.CanvasRenderer?.resizeCanvas || window.resizeCanvas;
      if (typeof resizeFn === 'function') resizeFn();
      const renderFn = window.CanvasRenderer?.scheduleRender || window.scheduleRender;
      if (typeof renderFn === 'function') renderFn();
    }, 50);
  }

  handleKeyDown(e) {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
      if (e.key === 'Escape' || e.code === 'Escape') {
        document.activeElement.blur();
      }
      return;
    }

    const k = e.key ? e.key.toLowerCase() : '';
    const code = e.code || '';
    const isPlaying = (typeof window !== 'undefined')
      ? ((window.currentAppScreen || window.GameState?.currentAppScreen) === 'PLAYING')
      : true;

    // Teclas de Movimentação Contínua (WASD & Setas)
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(k)) {
      this.activeKeys.add(k);
      return;
    }

    // Zoom rápido por teclado
    if (k === 'q' || k === '-') {
      const zoomFn = window.CameraController?.changeZoom || window.changeZoom;
      if (typeof zoomFn === 'function') zoomFn(-0.1);
      return;
    }
    if (k === 'e' || k === '+' || k === '=') {
      const zoomFn = window.CameraController?.changeZoom || window.changeZoom;
      if (typeof zoomFn === 'function') zoomFn(0.1);
      return;
    }

    // Alternar modo teatro (F)
    if (k === 'f' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      this.toggleTheaterMode();
      return;
    }

    // Tecla Espaço (Pausar / Retomar Simulação)
    if (k === ' ' || code === 'Space') {
      e.preventDefault();
      if (!isPlaying) return;
      const curSpeed = typeof window.gameSpeed !== 'undefined' ? window.gameSpeed : (window.GameState?.gameSpeed || 0);
      const setSpeedFn = window.HUDSystem?.setSpeed || window.setSpeed;
      const lastSpd = (window.HUDSystem && typeof window.HUDSystem.getLastActiveSpeed === 'function')
        ? window.HUDSystem.getLastActiveSpeed()
        : (window.lastActiveSpeed || window.previousSpeedBeforePause || 2);
      if (typeof setSpeedFn === 'function') {
        setSpeedFn(curSpeed === 0 ? lastSpd : 0);
      }
      return;
    }

    // Teclas 1 a 5 & Numpad 1 a 5 (Velocidade de Simulação)
    const numMatch = code.match(/^(?:Digit|Numpad)([1-5])$/) || (['1', '2', '3', '4', '5'].includes(k) && !e.ctrlKey && !e.altKey && !e.metaKey ? [null, k] : null);
    if (numMatch && isPlaying) {
      e.preventDefault();
      const spd = parseInt(numMatch[1], 10);
      const setSpeedFn = window.HUDSystem?.setSpeed || window.setSpeed;
      if (typeof setSpeedFn === 'function') {
        setSpeedFn(spd);
      }
      return;
    }

    // Tecla 0 (Pausa direta)
    if ((k === '0' || code === 'Digit0' || code === 'Numpad0') && isPlaying) {
      e.preventDefault();
      const setSpeedFn = window.HUDSystem?.setSpeed || window.setSpeed;
      if (typeof setSpeedFn === 'function') {
        setSpeedFn(0);
      }
      return;
    }

    // ESC (Pilha de Modais & Menu de Pausa)
    if (k === 'escape') {
      e.preventDefault();
      if (window.ModalManager && typeof window.ModalManager.handleGlobalEscape === 'function') {
        window.ModalManager.handleGlobalEscape();
      } else if (typeof window.handleGlobalEscapeKey === 'function') {
        window.handleGlobalEscapeKey();
      }
      return;
    }

    // Atalhos Executivos de Função (F1 a F4 & F8)
    if (k === 'f1') {
      e.preventDefault();
      const fn = window.toggleEncyclopediaModal || window.openEncyclopediaModal || window.EncyclopediaPanel?.renderEncyclopediaModal;
      if (typeof fn === 'function') fn();
      return;
    }
    if (k === 'f2') {
      e.preventDefault();
      const fn = window.toggleTechTreeModal || window.openTechTreeModal || window.TechTreePanel?.renderTechTreeModal;
      if (typeof fn === 'function') fn();
      return;
    }
    if (k === 'f3') {
      e.preventDefault();
      const fn = window.toggleDevDashboard || window.openDevDashboard || window.DevDashboardPanel?.toggleDevDashboard;
      if (typeof fn === 'function') fn();
      return;
    }
    if (k === 'f4') {
      e.preventDefault();
      const fn = window.toggleDREModal || window.openDREModal || window.DREPanel?.renderDREModal;
      if (typeof fn === 'function') fn();
      return;
    }
    if (k === 'f8') {
      e.preventDefault();
      const fn = window.toggleBugReportModal || window.openBugReportModal || window.DevDashboardPanel?.toggleBugReportModal;
      if (typeof fn === 'function') fn();
      return;
    }
  }

  handleKeyUp(e) {
    if (!e.key) return;
    this.activeKeys.delete(e.key.toLowerCase());
  }

  startCameraLoop() {
    if (this.isCameraLoopRunning) return;
    this.isCameraLoopRunning = true;
    requestAnimationFrame(this._boundCameraLoop);
  }

  updateKeyboardCamera() {
    if (!this.isCameraLoopRunning) return;

    if (this.activeKeys.size > 0) {
      const cam = window.CameraController?.camera || window.camera;
      if (cam) {
        const speed = 24 / (cam.zoom || 1);
        if (this.activeKeys.has('w') || this.activeKeys.has('arrowup')) {
          cam.panY += speed;
        }
        if (this.activeKeys.has('s') || this.activeKeys.has('arrowdown')) {
          cam.panY -= speed;
        }
        if (this.activeKeys.has('a') || this.activeKeys.has('arrowleft')) {
          cam.panX += speed;
        }
        if (this.activeKeys.has('d') || this.activeKeys.has('arrowright')) {
          cam.panX -= speed;
        }
        const renderFn = window.CanvasRenderer?.scheduleRender || window.scheduleRender;
        if (typeof renderFn === 'function') renderFn();
      }
    }

    requestAnimationFrame(this._boundCameraLoop);
  }
}

export const KeyboardSystem = new KeyboardController();

if (typeof window !== 'undefined') {
  window.KeyboardSystem = KeyboardSystem;
  window.toggleTheaterMode = () => KeyboardSystem.toggleTheaterMode();
}
