// client/main.js — Ponto de entrada Vite (Fase 1 de Transição)
// Os window.X são temporários e serão removidos conforme cada sistema migrar
// para import direto. Não remover até o index.html ser modularizado.
import CoreMath from './core_math.js';
import TickerSystem from './ticker_system.js';
import MacroCycleSystem from './macro_cycle_system.js';

window.CoreMath = CoreMath;
window.TickerSystem = TickerSystem;
window.MacroCycleSystem = MacroCycleSystem;
