// client/ui/templates/index.js — Orquestrador de Montagem de Modais & Overlays (Fase 7.0 K)

import operationsModalsHtml from './operations_modals.html?raw';
import financeModalsHtml from './finance_modals.html?raw';
import wizardsModalsHtml from './wizards_modals.html?raw';
import systemOverlaysHtml from './system_overlays.html?raw';

let _templatesMounted = false;

export function mountModalTemplates(targetId = 'oiko-modals-mount') {
  if (typeof document === 'undefined') return;
  if (_templatesMounted) return;

  const mountPoint = document.getElementById(targetId);
  if (!mountPoint) {
    console.warn(`[TemplateManager] Container #${targetId} não encontrado no DOM.`);
    return;
  }

  // Concatenação de todos os blocos de modais e injeção declarativa
  const allTemplates = [
    operationsModalsHtml,
    financeModalsHtml,
    wizardsModalsHtml,
    systemOverlaysHtml
  ].join('\n\n');

  mountPoint.innerHTML = allTemplates;
  _templatesMounted = true;
}

// Auto-montagem na inicialização do módulo se o DOM já estiver disponível
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountModalTemplates());
  } else {
    mountModalTemplates();
  }
}

export default {
  mountModalTemplates
};
