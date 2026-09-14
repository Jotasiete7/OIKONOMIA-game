/**
 * audio_popover.js — Popover de Controles de Áudio Discreto
 * OIKONOMIA v0.9 (Fase HUD Redesign)
 *
 * Substitui o widget de rádio sempre visível por um ícone discreto
 * com popover de controles acessível por 1 clique.
 */

let _isOpen = false;

function _getPopover() {
  return document.getElementById('audio-popover');
}

function _getIcon() {
  return document.getElementById('audio-icon-display');
}

function open() {
  const pop = _getPopover();
  if (!pop) return;
  pop.classList.remove('hidden');
  _isOpen = true;
}

function close() {
  const pop = _getPopover();
  if (!pop) return;
  pop.classList.add('hidden');
  _isOpen = false;
}

function toggle() {
  if (_isOpen) {
    close();
  } else {
    open();
  }
}

function updateMuteIcon(isMuted) {
  const icon = _getIcon();
  if (!icon) return;
  icon.textContent = isMuted ? '🔇' : '🔊';
}

export function initAudioPopover() {
  if (typeof document === 'undefined') return;

  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!_isOpen) return;
    const wrapper = document.getElementById('audio-icon-wrapper');
    if (wrapper && wrapper.contains(e.target)) return;
    close();
  });

  // Fechar no ESC (o modal_manager vai chamar isso)
  window.closeAudioPopover = close;
}

export const AudioPopover = {
  open,
  close,
  toggle,
  updateMuteIcon,
  initAudioPopover
};

if (typeof window !== 'undefined') {
  window.AudioPopover = AudioPopover;
}

export default AudioPopover;
