/**
 * window_manager.js — Gerenciador de Janelas Flutuantes & Arrastáveis
 * OIKONOMIA v0.8.5 (Fase 6.1 — UI Shell)
 * 
 * Responsável por:
 * - Movimentação por ponteiro (pointer events com suporte a mouse/touch)
 * - Empilhamento dinâmico de z-index (bringWindowToFront)
 * - Limites de tela e restrições de viewport
 * - Persistência das coordenadas no localStorage
 */

let _windowZIndexCounter = 100;

export function getTopZIndex() {
  return _windowZIndexCounter;
}

export function bringWindowToFront(panel) {
  if (!panel) return;
  _windowZIndexCounter += 2;
  panel.style.zIndex = _windowZIndexCounter;
}

export function makeDraggable(panel, handle, storageKey = null) {
  if (!panel || !handle) return;

  // Restaura posição salva no localStorage
  if (storageKey) {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const pos = JSON.parse(saved);
        if (typeof pos.left === 'number' && typeof pos.top === 'number') {
          const maxL = Math.max(0, window.innerWidth - (panel.offsetWidth || 320));
          const maxT = Math.max(0, window.innerHeight - 50);
          const actualTop = Math.max(0, Math.min(pos.top, maxT));
          panel.style.position = 'fixed';
          panel.style.left = Math.max(0, Math.min(pos.left, maxL)) + 'px';
          panel.style.top = actualTop + 'px';
          panel.style.maxHeight = `calc(100vh - ${actualTop}px - 1rem)`;
          panel.style.right = 'auto';
          panel.style.bottom = 'auto';
          panel.style.transform = 'none';
        }
      }
    } catch (_) {}
  }

  handle.classList.add('drag-handle');
  panel.classList.add('draggable-window');

  let dragging = false;
  let startX = 0, startY = 0;
  let initLeft = 0, initTop = 0;

  panel.addEventListener('pointerdown', () => bringWindowToFront(panel));

  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, input, select, textarea, label, a')) return;
    dragging = true;
    bringWindowToFront(panel);

    const r = panel.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    initLeft = r.left;
    initTop = r.top;

    panel.style.position = 'fixed';
    panel.style.left = initLeft + 'px';
    panel.style.top = initTop + 'px';
    panel.style.maxHeight = `calc(100vh - ${initTop}px - 1rem)`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.transform = 'none';
    panel.classList.add('is-dragging');

    try {
      handle.setPointerCapture(e.pointerId);
    } catch (_) {}

    e.preventDefault();
  });

  handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const maxL = Math.max(0, window.innerWidth - panel.offsetWidth);
    const maxT = Math.max(0, window.innerHeight - 40);

    const newL = Math.max(0, Math.min(initLeft + dx, maxL));
    const newT = Math.max(0, Math.min(initTop + dy, maxT));

    panel.style.left = newL + 'px';
    panel.style.top = newT + 'px';
    panel.style.maxHeight = `calc(100vh - ${newT}px - 1rem)`;
  });

  const stopDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove('is-dragging');

    try {
      if (e.pointerId && handle.hasPointerCapture(e.pointerId)) {
        handle.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}

    if (storageKey) {
      try {
        const r = panel.getBoundingClientRect();
        localStorage.setItem(storageKey, JSON.stringify({ left: Math.round(r.left), top: Math.round(r.top) }));
      } catch (_) {}
    }
  };

  handle.addEventListener('pointerup', stopDrag);
  handle.addEventListener('pointercancel', stopDrag);
}

export function initAllDraggableWindows(customModalList = null) {
  // 1. Janela de Gestão de Instalação Flutuante & Tutorial
  const facWin = document.getElementById('floating-facility-window');
  if (facWin) {
    const facHandle = facWin.querySelector('.drag-handle') || facWin.firstElementChild;
    if (facHandle) makeDraggable(facWin, facHandle, 'oiko_pos_facility_window');
  }
  const tutWin = document.getElementById('tutorial-guide-widget');
  if (tutWin) {
    const tutHandle = tutWin.querySelector('.drag-handle') || tutWin.firstElementChild;
    if (tutHandle) makeDraggable(tutWin, tutHandle, 'oiko_pos_tutorial_guide');
  }

  // 2. Mapeamento dos modais principais
  const defaultModalList = [
    { id: 'dre-modal', key: 'oiko_pos_dre' },
    { id: 'diary-modal', key: 'oiko_pos_diary' },
    { id: 'store-modal', key: 'oiko_pos_store' },
    { id: 'supplier-modal', key: 'oiko_pos_supplier' },
    { id: 'add-product-modal', key: 'oiko_pos_add_product' },
    { id: 'factory-modal', key: 'oiko_pos_factory' },
    { id: 'factory-recipe-modal', key: 'oiko_pos_factory_recipe' },
    { id: 'mine-modal', key: 'oiko_pos_mine' },
    { id: 'farm-modal', key: 'oiko_pos_farm' },
    { id: 'port-modal', key: 'oiko_pos_port' },
    { id: 'marketing-central-modal', key: 'oiko_pos_marketing' },
    { id: 'rd-center-modal', key: 'oiko_pos_rd_center' },
    { id: 'rd-new-project-modal', key: 'oiko_pos_rd_new_project' },
    { id: 'dev-dashboard-modal', key: 'oiko_pos_dev_dashboard' },
    { id: 'save-load-modal', key: 'oiko_pos_save_load' },
    { id: 'settings-modal', key: 'oiko_pos_settings' },
    { id: 'warehouse-add-product-modal', key: 'oiko_pos_warehouse_add' }
  ];

  const list = customModalList || defaultModalList;
  list.forEach(({ id, key }) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    const win = modal.querySelector('div.bg-slate-900') || modal.querySelector('div.oiko-terminal-card') || modal.firstElementChild;
    if (!win) return;
    const handle = win.querySelector('.drag-handle') || win.querySelector('div[class*="border-b"]') || win.firstElementChild;
    if (handle) {
      makeDraggable(win, handle, key);
    }
  });
}

export const WindowManager = {
  bringWindowToFront,
  makeDraggable,
  initAllDraggableWindows,
  getTopZIndex
};

// Exposição global para interoperabilidade
if (typeof window !== 'undefined') {
  window.WindowManager = WindowManager;
  window.bringWindowToFront = bringWindowToFront;
  window.makeDraggable = makeDraggable;
  window.initAllDraggableWindows = initAllDraggableWindows;
}

export default WindowManager;
