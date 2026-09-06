const fs = require('fs');
const path = require('path');

const guildaLatestPath = path.resolve(__dirname, '..', 'saves', 'Save_A_Guilda_1_slot_1788660755873.oiko');
const guildaAno5Path = path.resolve(__dirname, '..', 'saves', 'Save_A_GUILDA_slot_1788627049916.oiko');
const guilda1Path = path.resolve(__dirname, '..', 'saves', 'Save_A_Guilda_1_slot_1788624655408.oiko');

const guildaLatest = JSON.parse(fs.readFileSync(guildaLatestPath, 'utf8'));
const guildaAno5 = JSON.parse(fs.readFileSync(guildaAno5Path, 'utf8'));
const guilda1 = JSON.parse(fs.readFileSync(guilda1Path, 'utf8'));

const outCode = `/**
 * recovered_saves_seed.js — Módulo de Recuperação e Semente de Saves
 * Garante a restauração automática de 'A Guilda 1' e 'A GUILDA' em qualquer porta ou navegador.
 */

export const RECOVERED_SAVES = [
  {
    slotId: 'slot_1788660755873',
    data: ${JSON.stringify(guildaLatest)}
  },
  {
    slotId: 'slot_1788627049916',
    data: ${JSON.stringify(guildaAno5)}
  },
  {
    slotId: 'slot_1788624655408',
    data: ${JSON.stringify(guilda1)}
  }
];

export function seedRecoveredSavesIfMissing() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    let seeded = false;
    for (const item of RECOVERED_SAVES) {
      const key = 'oiko_save_' + item.slotId;
      const existingStr = localStorage.getItem(key);
      if (!existingStr) {
        localStorage.setItem(key, JSON.stringify(item.data));
        seeded = true;
      } else if (item.slotId === 'slot_1788660755873') {
        // Auto-cura: se o save no localStorage estiver sem o armazém (bug antigo), atualiza com o restaurado
        try {
          const parsed = JSON.parse(existingStr);
          const hasWarehouse = parsed.builtTiles && parsed.builtTiles.some(t => t.warehouse);
          if (!hasWarehouse && item.data.builtTiles && item.data.builtTiles.some(t => t.warehouse)) {
            localStorage.setItem(key, JSON.stringify(item.data));
            seeded = true;
            console.log('[Seed] Auto-cura executada: Armazém restaurado no slot ' + item.slotId);
          }
        } catch (e) {
          localStorage.setItem(key, JSON.stringify(item.data));
          seeded = true;
        }
      }
    }
    return seeded;
  } catch (e) {
    console.warn('[Seed] Erro ao semear saves recuperados:', e);
    return false;
  }
}
`;

fs.writeFileSync(path.resolve(__dirname, '..', 'client', 'recovered_saves_seed.js'), outCode, 'utf8');
console.log('Successfully created client/recovered_saves_seed.js with 3 saves!');

