/**
 * modal_manager.js — Gerenciador Central de Modais e Diálogos
 * OIKONOMIA v0.8.5 (Fase 6.1 — UI Shell)
 * 
 * Responsável por:
 * - Abertura, fechamento e toggle padronizados de modais
 * - Encerramento em massa de modais ativos (closeAllInGameModals)
 * - Pilha de prioridade e fechamento via tecla ESC (handleGlobalEscape)
 * - Compatibilidade direta com as funções legadas openXModal / closeXModal
 */

export const ALL_IN_GAME_MODALS = [
  'floating-facility-window',
  'store-modal',
  'mine-modal',
  'farm-modal',
  'factory-modal',
  'factory-recipe-modal',
  'port-modal',
  'supplier-modal',
  'add-product-modal',
  'warehouse-modal',
  'warehouse-add-product-modal',
  'bank-modal',
  'rd-center-modal',
  'rd-new-project-modal',
  'tech-tree-modal',
  'encyclopedia-modal',
  'dre-modal',
  'diary-modal',
  'executive-board-modal',
  'marketing-modal',
  'dev-dashboard-modal',
  'save-load-modal',
  'settings-modal',
  'new-game-modal',
  'bug-report-modal',
  'confirm-exit-modal',
  'confirm-facility-modal'
];

export function openModal(modalId) {
  const el = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!el) return false;
  el.classList.remove('hidden');

  // Traz a janela do modal para frente se for gerenciável pelo WindowManager
  const win = el.querySelector('div.bg-slate-900') || el.querySelector('div.oiko-terminal-card') || el.firstElementChild;
  if (win && typeof window !== 'undefined' && window.bringWindowToFront) {
    window.bringWindowToFront(win);
  }
  return true;
}

export function closeModal(modalId) {
  const el = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!el) return false;
  el.classList.add('hidden');
  return true;
}

export function toggleModal(modalId) {
  const el = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  if (!el) return false;
  if (el.classList.contains('hidden')) {
    return openModal(el);
  } else {
    return closeModal(el);
  }
}

export function isModalOpen(modalId) {
  const el = typeof modalId === 'string' ? document.getElementById(modalId) : modalId;
  return !!(el && !el.classList.contains('hidden'));
}

export function openDiaryModal() {
  return openModal('diary-modal');
}

export function closeDiaryModal() {
  return closeModal('diary-modal');
}

export function toggleDiaryModal() {
  return toggleModal('diary-modal');
}

export function closeAllInGameModals(exceptions = []) {
  const excSet = new Set(exceptions);
  for (const id of ALL_IN_GAME_MODALS) {
    if (excSet.has(id)) continue;
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }
}

export function handleGlobalEscape() {
  // Prioridade 0A: Modal de Reporte de Bugs (F8)
  const bugModal = document.getElementById('bug-report-modal');
  if (bugModal && !bugModal.classList.contains('hidden')) {
    if (typeof window !== 'undefined' && typeof window.closeBugReportModal === 'function') {
      window.closeBugReportModal();
    } else {
      bugModal.classList.add('hidden');
    }
    return;
  }

  // Prioridade 0B: Dev Dashboard (F3)
  const devModal = document.getElementById('dev-dashboard-modal');
  if (devModal && !devModal.classList.contains('hidden')) {
    if (typeof window !== 'undefined' && typeof window.closeDevDashboard === 'function') {
      window.closeDevDashboard();
    } else {
      devModal.classList.add('hidden');
    }
    return;
  }

  // Prioridade 0C: Modal de Confirmação de Venda / Demolição
  const facConfirm = document.getElementById('confirm-facility-modal');
  if (facConfirm && !facConfirm.classList.contains('hidden')) {
    if (typeof window !== 'undefined' && typeof window.closeFacilityConfirmModal === 'function') {
      window.closeFacilityConfirmModal();
    } else {
      facConfirm.classList.add('hidden');
    }
    return;
  }

  // Prioridade 1: Modal de Confirmação de Saída
  const confirmModal = document.getElementById('confirm-exit-modal');
  if (confirmModal && !confirmModal.classList.contains('hidden')) {
    if (typeof window !== 'undefined' && typeof window.closeConfirmExitModal === 'function') {
      window.closeConfirmExitModal();
    } else {
      confirmModal.classList.add('hidden');
    }
    return;
  }

  // Prioridade 2: Modal de Configurações
  const setModal = document.getElementById('settings-modal');
  if (setModal && !setModal.classList.contains('hidden')) {
    if (typeof window !== 'undefined' && typeof window.closeSettingsModal === 'function') {
      window.closeSettingsModal();
    } else {
      setModal.classList.add('hidden');
    }
    return;
  }

  // Prioridade 3: Modal de Saves
  const saveModal = document.getElementById('save-load-modal');
  if (saveModal && !saveModal.classList.contains('hidden')) {
    if (typeof window !== 'undefined' && typeof window.closeSaveLoadModal === 'function') {
      window.closeSaveLoadModal();
    } else {
      saveModal.classList.add('hidden');
    }
    return;
  }

  // Prioridade 4: Wizard de Nova Empresa
  const wizModal = document.getElementById('new-game-modal');
  if (wizModal && !wizModal.classList.contains('hidden')) {
    if (typeof window !== 'undefined' && typeof window.closeNewGameWizard === 'function') {
      window.closeNewGameWizard();
    } else {
      wizModal.classList.add('hidden');
    }
    return;
  }

  // Prioridade 5: Modais em jogo e janelas flutuantes
  let closedAny = false;
  for (const id of ALL_IN_GAME_MODALS) {
    if (id === 'save-load-modal' || id === 'settings-modal' || id === 'new-game-modal' || id === 'bug-report-modal') {
      continue;
    }
    const el = document.getElementById(id);
    if (el && !el.classList.contains('hidden')) {
      el.classList.add('hidden');
      closedAny = true;
    }
  }
  if (closedAny) return;

  // Prioridade 6: Menu de Pausa
  const screen = typeof window !== 'undefined' ? window.currentAppScreen : null;
  if (screen === 'PAUSED') {
    if (typeof window !== 'undefined' && typeof window.resumeGame === 'function') {
      window.resumeGame();
    }
  } else if (screen === 'PLAYING') {
    if (typeof window !== 'undefined' && typeof window.pauseGameAndShowMenu === 'function') {
      window.pauseGameAndShowMenu();
    }
  }
}

export const ModalManager = {
  ALL_IN_GAME_MODALS,
  openModal,
  closeModal,
  toggleModal,
  isModalOpen,
  openDiaryModal,
  closeDiaryModal,
  toggleDiaryModal,
  closeAllInGameModals,
  handleGlobalEscape
};

// Exposição global para retrocompatibilidade
if (typeof window !== 'undefined') {
  window.ModalManager = ModalManager;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.toggleModal = toggleModal;
  window.isModalOpen = isModalOpen;
  window.openDiaryModal = openDiaryModal;
  window.closeDiaryModal = closeDiaryModal;
  window.toggleDiaryModal = toggleDiaryModal;
  window.closeAllInGameModals = closeAllInGameModals;
  window.handleGlobalEscape = handleGlobalEscape;
}

export default ModalManager;
