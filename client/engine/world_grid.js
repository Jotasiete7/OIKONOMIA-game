/**
 * world_grid.js — Motor Cartográfico, Procedural & Indexação Espacial (Sparse Index)
 * OIKONOMIA v0.8.5 (Fase 7.0 C — Desacoplamento da Grid Engine)
 * 
 * Responsável por:
 * - Matriz do mundo 128x128 tiles e topografia procedural
 * - Sparse Index (activeFacilitySet, _tileKey, _indexTile) para desempenho O(k)
 * - Matrizes geológicas dos 7 recursos naturais extrativos
 * - Portos marítimos especializados e logística de frete internacional
 * - Detecção espacial e proximidade às 4 cidades metropolitanas
 * - Metas de desbloqueio progressivo de cidades (Montargis e Várzea)
 */

import {
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_WIDTH,
  TILE_HEIGHT,
  CITY_PROFILES_DATA,
  TMX_LAYERS
} from '../map_data.js';

import {
  PORT_SUPPLIES_FOOD_CONSUMER,
  PORT_SUPPLIES_COMMODITIES,
  PORT_SUPPLIES_TECH_PARTS
} from '../data_catalogs.js';

import GameState from '../game_state.js';

// ===========================================================================
// CONSTANTES & CONFIGURAÇÕES DA GRADE
// ===========================================================================
export const GRID_SIZE = (typeof MAP_WIDTH !== 'undefined') ? MAP_WIDTH : 128;
export const TILE_W = 64;
export const TILE_H = 32;

// Matriz global de tiles 128x128
export const worldGrid = [];

// === SPARSE INDEX — Tiles com instalações ativas (O(k) em vez de O(n²)) ===
// Chave: "x,y" | Valor: referência ao tile
export const activeFacilitySet = new Map();

/**
 * Gera a chave string "x,y" para o Map indexador.
 * @param {number} x
 * @param {number} y
 * @returns {string}
 */
export function _tileKey(x, y) {
  return `${x},${y}`;
}

/**
 * Registra ou desindexa um tile do activeFacilitySet de acordo com a presença de instalações.
 * @param {object} tile
 */
export function _indexTile(tile) {
  if (!tile) return;
  if (tile.store || tile.mine || tile.farm || tile.factory || tile.rdCenter || tile.warehouse || tile.competitor) {
    activeFacilitySet.set(_tileKey(tile.x, tile.y), tile);
  } else {
    activeFacilitySet.delete(_tileKey(tile.x, tile.y));
  }
}

// ===========================================================================
// MATRIZES GEOLÓGICAS DE RECURSOS NATURAIS (7 Recursos Estratégicos)
// ===========================================================================
export const IRON_DEPOSITS_LIST = [
  { x: 45, y: 52 }, { x: 46, y: 52 }, // Nova Atenas (Sopé Sul das Montanhas - Acessível Dia 1)
  { x: 58, y: 55 }, { x: 59, y: 55 }, // Montanhas Centrais
  { x: 34, y: 83 }, { x: 34, y: 84 }  // Montargis Norte (fora de rodovia)
];

export const OIL_DEPOSITS_LIST = [
  { x: 96, y: 42 }, { x: 97, y: 42 }, // Porto Real (Bacia Costeira em Terra Firme)
  { x: 88, y: 52 }, { x: 89, y: 52 }, // Interior de Porto Real (Terra Firme)
  { x: 42, y: 65 }, { x: 43, y: 65 }  // Bacia Sul de Nova Atenas (Terra Firme)
];

export const SILICA_DEPOSITS_LIST = [
  { x: 50, y: 50 }, { x: 51, y: 50 }, // Nova Atenas (Sopé das Colinas Brancas)
  { x: 56, y: 64 }, { x: 57, y: 64 }, // Montargis (Formação Continental de Quartzo)
  { x: 65, y: 45 }, { x: 66, y: 45 }, // Corredor Central (Arenito Continental de Alta Pureza)
  { x: 64, y: 63 }, { x: 64, y: 64 }  // Várzea (Serra de Quartzo Puro)
];

export const BAUXITE_DEPOSITS_LIST = [
  { x: 48, y: 48 }, { x: 49, y: 48 }, // Nova Atenas Leste (Colinas de Bauxita)
  { x: 72, y: 60 }, { x: 73, y: 60 }, // Vale Central
  { x: 80, y: 78 }, { x: 81, y: 78 }  // Várzea Noroeste
];

export const GOLD_DEPOSITS_LIST = [
  { x: 55, y: 58 },                   // Montanhas Altas Centrais
  { x: 62, y: 62 }                    // Cume Rochoso de Várzea
];

export const CHEMICAL_DEPOSITS_LIST = [
  { x: 68, y: 42 }, { x: 69, y: 42 }, // Bacia Seca Nova Atenas - Porto
  { x: 82, y: 48 }, { x: 83, y: 48 }, // Planície Continental de Porto Real
  { x: 78, y: 86 }, { x: 79, y: 86 }  // Depressão Sul
];

export function isIronTile(x, y) { return IRON_DEPOSITS_LIST.some(d => d.x === x && d.y === y); }
export function isOilTile(x, y) { return OIL_DEPOSITS_LIST.some(d => d.x === x && d.y === y); }
export function isSilicaTile(x, y) { return SILICA_DEPOSITS_LIST.some(d => d.x === x && d.y === y); }
export function isBauxiteTile(x, y) { return BAUXITE_DEPOSITS_LIST.some(d => d.x === x && d.y === y); }
export function isGoldTile(x, y) { return GOLD_DEPOSITS_LIST.some(d => d.x === x && d.y === y); }
export function isChemicalTile(x, y) { return CHEMICAL_DEPOSITS_LIST.some(d => d.x === x && d.y === y); }

// ===========================================================================
// PORTOS MARÍTIMOS NO MAPA 128x128
// ===========================================================================
export const SEAPORTS_128 = [
  {
    id: 'port_atenas_bay',
    name: 'Porto Nova Atenas (Doca da Baía Central - Alimentos & Varejo)',
    tile: { x: 26, y: 38 },
    freightRatePerTile: 0.010,
    supplies: (typeof PORT_SUPPLIES_FOOD_CONSUMER !== 'undefined') ? PORT_SUPPLIES_FOOD_CONSUMER : {}
  },
  {
    id: 'port_atenas_south',
    name: 'Porto Nova Atenas (Cais Sul - Alimentos & Varejo)',
    tile: { x: 34, y: 46 },
    freightRatePerTile: 0.012,
    supplies: (typeof PORT_SUPPLIES_FOOD_CONSUMER !== 'undefined') ? PORT_SUPPLIES_FOOD_CONSUMER : {}
  },
  {
    id: 'port_real_main',
    name: 'Porto Real (Terminal Internacional de Commodities & Grãos)',
    tile: { x: 85, y: 34 },
    freightRatePerTile: 0.008,
    supplies: (typeof PORT_SUPPLIES_COMMODITIES !== 'undefined') ? PORT_SUPPLIES_COMMODITIES : {}
  },
  {
    id: 'port_real_south',
    name: 'Porto Real (Doca Sul de Tecnologia & Manufaturas)',
    tile: { x: 89, y: 44 },
    freightRatePerTile: 0.010,
    supplies: (typeof PORT_SUPPLIES_TECH_PARTS !== 'undefined') ? PORT_SUPPLIES_TECH_PARTS : {}
  }
];

// ===========================================================================
// TOPOLOGIA URBANA & IDENTIFICADOR DE CIDADE
// ===========================================================================
export function getCityForTile(x, y) {
  const defaultProfile = {
    id: 'nova_atenas',
    name: 'Nova Atenas',
    economy: { wealthIndex: 85, priceElasticity: -0.9, trafficBaseIndex: 40, landRentMultiplier: 1.0 },
    growth: { initialPopulation: 18000 }
  };

  const unlockedCities = (typeof window !== 'undefined' && window.unlockedCities)
    ? window.unlockedCities
    : (GameState.unlockedCities || { nova_atenas: true, porto_real: true, montargis: false, varzea: false });

  if (typeof CITY_PROFILES_DATA === 'undefined' || !CITY_PROFILES_DATA.cities) {
    return {
      cityId: 'nova_atenas',
      cityName: 'Nova Atenas',
      wealthIndex: 85,
      priceElasticity: -0.9,
      distToCenter: 0,
      get isLocked() { return !unlockedCities['nova_atenas']; },
      profile: defaultProfile
    };
  }

  const cities = CITY_PROFILES_DATA.cities;
  let closest = cities[0] || defaultProfile;
  let minD = 999999;
  for (const c of cities) {
    if (!c || !c.mapTileCenter) continue;
    const d = Math.sqrt(Math.pow(x - c.mapTileCenter.x, 2) + Math.pow(y - c.mapTileCenter.y, 2));
    if (d < minD) {
      minD = d;
      closest = c;
    }
  }

  return {
    cityId: closest.id,
    cityName: closest.name,
    wealthIndex: closest.economy?.wealthIndex || 85,
    priceElasticity: closest.economy?.priceElasticity || -0.9,
    distToCenter: minD,
    get isLocked() {
      return !unlockedCities[closest.id];
    },
    profile: closest
  };
}

/**
 * Valida os critérios de desbloqueio geográfico das cidades de Montargis e Várzea.
 */
export function checkCityUnlocks() {
  const currentCash = (typeof window !== 'undefined' && typeof window.cash === 'number')
    ? window.cash
    : (GameState.cash || 0);

  const unlockedCities = (typeof window !== 'undefined' && window.unlockedCities)
    ? window.unlockedCities
    : (GameState.unlockedCities || { nova_atenas: true, porto_real: true, montargis: false, varzea: false });

  let totalAssets = currentCash;
  let farmCount = 0;

  for (const t of activeFacilitySet.values()) {
    if (t.store) totalAssets += t.store.cost || 15000;
    if (t.mine) totalAssets += t.mine.cost || 40000;
    if (t.farm) {
      totalAssets += t.farm.cost || 20000;
      farmCount++;
    }
    if (t.factory) totalAssets += 48000;
    if (t.rdCenter) totalAssets += t.rdCenter.constructionCost || 80000;
  }

  const safeAddLog = (msg, color) => {
    if (typeof window !== 'undefined' && typeof window.addLog === 'function') {
      window.addLog(msg, color);
    }
  };

  if (!unlockedCities.montargis && totalAssets >= 500000) {
    unlockedCities.montargis = true;
    safeAddLog('🎉 CIDADE DESBLOQUEADA: Montargis atingiu o critério de $500k em patrimônio e agora está aberta para investimentos!', 'text-amber-400 font-bold');
  }

  if (!unlockedCities.varzea && farmCount >= 1) {
    unlockedCities.varzea = true;
    safeAddLog('🎉 CIDADE DESBLOQUEADA: Várzea conectada ao cinturão agrícola pela sua primeira Fazenda em operação!', 'text-emerald-400 font-bold');
  }

  // Atualiza botões e cadeados no HUD superior
  if (typeof document !== 'undefined') {
    const btnMont = document.getElementById('btn-jump-montargis');
    const lockMont = document.getElementById('lock-montargis');
    if (btnMont) {
      if (unlockedCities.montargis) {
        btnMont.classList.remove('text-slate-500');
      } else {
        btnMont.classList.add('text-slate-500');
      }
    }
    if (lockMont) lockMont.textContent = unlockedCities.montargis ? '🔓' : '🔒';

    const btnVarz = document.getElementById('btn-jump-varzea');
    const lockVarz = document.getElementById('lock-varzea');
    if (btnVarz) {
      if (unlockedCities.varzea) {
        btnVarz.classList.remove('text-slate-500');
      } else {
        btnVarz.classList.add('text-slate-500');
      }
    }
    if (lockVarz) lockVarz.textContent = unlockedCities.varzea ? '🔓' : '🔒';
  }
}

// ===========================================================================
// INICIALIZAÇÃO DA MATRIZ DO MUNDO 128x128
// ===========================================================================
export function initWorldGrid() {
  activeFacilitySet.clear();

  const layers = (typeof TMX_LAYERS !== 'undefined') ? TMX_LAYERS : {};

  for (let x = 0; x < GRID_SIZE; x++) {
    worldGrid[x] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      // Leitura dos blocos do Tiled (TMX)
      const gidWater   = (layers['01_Agua_Base'] && layers['01_Agua_Base'][y]) ? layers['01_Agua_Base'][y][x] : 0;
      const gidTerrain = (layers['02_Terreno_Relevo'] && layers['02_Terreno_Relevo'][y]) ? layers['02_Terreno_Relevo'][y][x] : 4;
      const gidRes     = (layers['03_Recursos_Naturais'] && layers['03_Recursos_Naturais'][y]) ? layers['03_Recursos_Naturais'][y][x] : 0;
      const gidRoad    = (layers['04_Infraestrutura_Vias'] && layers['04_Infraestrutura_Vias'][y]) ? layers['04_Infraestrutura_Vias'][y][x] : 0;
      const gidBuild   = (layers['05_Edificios_Zonamento'] && layers['05_Edificios_Zonamento'][y]) ? layers['05_Edificios_Zonamento'][y][x] : 0;

      const isWater = gidWater > 0;
      const isRoad = gidRoad > 0;
      const isPort = gidBuild === 13;
      const isCommercialCenter = gidBuild === 14;
      const isResidential = gidBuild === 15;
      const isFactoryTile = gidBuild === 16;
      const isFarmTile = gidBuild === 17 || gidTerrain === 5;

      const cityInfo = getCityForTile(x, y);

      // Classificação do Distrito
      let districtId = 'west_suburbs';
      let dType = 'Planície / Interior';
      let dName = 'Terreno Livre';
      let traffic = 12;
      let pop = 800;
      let rent = 8.00;

      if (isWater) {
        districtId = 'water';
        dType = 'Água / Oceano';
        dName = gidWater === 1 ? 'Oceano Profundo' : 'Águas Costeiras';
        traffic = 0; pop = 0; rent = 0;
      } else if (isPort) {
        districtId = 'harbor';
        dType = 'Porto / Logística';
        dName = `Porto Comercial (${cityInfo.cityName})`;
        traffic = 55; pop = 3000; rent = 24.00;
      } else if (isCommercialCenter) {
        districtId = 'downtown';
        dType = 'Centro Comercial Nobre';
        dName = `Centro de ${cityInfo.cityName}`;
        traffic = Math.floor(cityInfo.profile.economy.trafficBaseIndex * 1.15);
        pop = Math.floor(cityInfo.profile.growth.initialPopulation * 0.4);
        rent = Math.floor(35 * cityInfo.profile.economy.landRentMultiplier);
      } else if (isResidential) {
        districtId = 'northside';
        dType = 'Bairro Residencial';
        dName = `Distrito Residencial (${cityInfo.cityName})`;
        traffic = Math.floor(cityInfo.profile.economy.trafficBaseIndex * 0.7);
        pop = Math.floor(cityInfo.profile.growth.initialPopulation * 0.35);
        rent = Math.floor(18 * cityInfo.profile.economy.landRentMultiplier);
      } else if (isRoad) {
        districtId = 'road';
        dType = 'Rodovia Principal';
        dName = 'Eixo Rodoviário Logístico';
        traffic = 75; pop = 0; rent = 0;
      } else if (isIronTile(x, y)) {
        dType = 'Jazida Mineral de Ferro';
        dName = 'Jazida de Minério de Ferro';
        traffic = 5; pop = 200; rent = 5.00;
      } else if (isOilTile(x, y)) {
        dType = 'Bacia Petrolífera Continental';
        dName = 'Campo Petrolífero Terrestre';
        traffic = 6; pop = 150; rent = 6.50;
      } else if (isSilicaTile(x, y)) {
        dType = 'Jazida Continental de Sílica';
        dName = 'Jazida de Sílica & Quartzo Industrial';
        traffic = 6; pop = 250; rent = 5.50;
      } else if (isBauxiteTile(x, y)) {
        dType = 'Jazida Mineral de Bauxita';
        dName = 'Jazida de Bauxita (Alumínio)';
        traffic = 6; pop = 200; rent = 5.50;
      } else if (isGoldTile(x, y)) {
        dType = 'Veio Mineral de Ouro';
        dName = 'Veio de Minério de Ouro Nobre';
        traffic = 4; pop = 100; rent = 8.00;
      } else if (isChemicalTile(x, y)) {
        dType = 'Bacia de Minerais Químicos';
        dName = 'Depósito de Minerais Químicos';
        traffic = 6; pop = 200; rent = 5.50;
      } else if (gidTerrain === 8 || gidRes === 8) {
        dType = 'Floresta / Bosque';
        dName = 'Reserva Florestal (Madeira)';
        traffic = 6; pop = 300; rent = 5.50;
      } else if (gidTerrain === 7) {
        dType = 'Montanhas';
        dName = 'Cadeia de Montanhas (Mineração)';
        traffic = 5; pop = 200; rent = 5.00;
      } else if (gidTerrain === 6) {
        dType = 'Colinas';
        dName = 'Região de Colinas';
        traffic = 8; pop = 400; rent = 6.00;
      } else if (gidTerrain === 5) {
        dType = 'Terra Fértil';
        dName = 'Cinturão Agrícola Fértil';
        traffic = 15; pop = 1200; rent = 7.00;
      }

      const districtObj = {
        id: districtId,
        name: dName,
        type: dType,
        population: pop,
        trafficIndex: traffic,
        landRentDaily: rent
      };

      // Dados de Porto
      let portData = null;
      if (isPort) {
        portData = SEAPORTS_128.find(p => p.tile.x === x && p.tile.y === y);
        if (!portData) {
          const isNovaAtenas = cityInfo.cityId === 'nova_atenas' || x < 60;
          const supplies = isNovaAtenas
            ? ((typeof PORT_SUPPLIES_FOOD_CONSUMER !== 'undefined') ? PORT_SUPPLIES_FOOD_CONSUMER : {})
            : (y > 40
                ? ((typeof PORT_SUPPLIES_TECH_PARTS !== 'undefined') ? PORT_SUPPLIES_TECH_PARTS : {})
                : ((typeof PORT_SUPPLIES_COMMODITIES !== 'undefined') ? PORT_SUPPLIES_COMMODITIES : {}));
          const portName = isNovaAtenas 
            ? `Porto Marítimo de Nova Atenas (Alimentos & Varejo)` 
            : (y > 40 ? `Porto Real (Terminal de Tecnologia)` : `Porto Real (Terminal de Commodities)`);
          portData = {
            id: `port_${x}_${y}`,
            name: portName,
            tile: { x, y },
            freightRatePerTile: 0.010,
            supplies
          };
          SEAPORTS_128.push(portData);
        }
      }

      // Dados de Mídia
      let mediaData = null;
      if (x === 40 && y === 42) {
        mediaData = { id:'media_tv', name:'Rede Capital TV (Nova Atenas)', type:'Televisão', emoji:'📺', tile:{x:40,y:42}, district:'downtown', monthlyCost:2500.00, institutionalMonthlyCost:3500.00, brandBoostMonthly:15, brandCap:95, reachPct:100, reachDescription:'Toda a Região Metropolitana (100% da População)' };
      }
      if (x === 86 && y === 38) {
        mediaData = { id:'media_radio', name:'Rádio Porto Real FM 104.5', type:'Rádio', emoji:'📻', tile:{x:86,y:38}, district:'downtown', monthlyCost:850.00, institutionalMonthlyCost:1200.00, brandBoostMonthly:8, brandCap:75, reachPct:65, reachDescription:'Porto Real e Cais Costeiro' };
      }

      worldGrid[x][y] = {
        x, y,
        gidWater, gidTerrain, gidRes, gidRoad, gidBuild,
        districtId,
        district: districtObj,
        city: cityInfo,
        isWater,
        isRoad,
        isPort,
        portData,
        isMedia: !!mediaData,
        mediaData,
        hasIronDeposit: isIronTile(x, y),
        hasOilDeposit: isOilTile(x, y),
        hasTimberDeposit: gidRes === 8 || gidTerrain === 8,
        hasSilicaDeposit: isSilicaTile(x, y),
        hasBauxiteDeposit: isBauxiteTile(x, y),
        hasGoldDeposit: isGoldTile(x, y),
        hasChemicalDeposit: isChemicalTile(x, y),
        isFertile: gidTerrain === 5 || gidBuild === 17,
        buildingHeight: isWater || isRoad ? 0 : (portData ? 16 : (isCommercialCenter ? 22 : (isResidential ? 14 : 0))),
        store: null,
        mine: null,
        farm: null,
        factory: null,
        rdCenter: null,
        warehouse: null,
        competitor: (x === 87 && y === 39) ? {
          name: 'MegaMart Porto Real (IA)',
          shelves: {
            bread: { price: 3.40, quality: 45, brand: 25 },
            beer:  { price: 3.90, quality: 48, brand: 25 },
            cola:  { price: 2.10, quality: 45, brand: 25 },
            milk:  { price: 2.70, quality: 45, brand: 20 },
          },
          lastShare: 0.40,
        } : null
      };

      _indexTile(worldGrid[x][y]);
    }
  }
}

/**
 * Consulta um tile por coordenada, de forma segura.
 * @param {number} x
 * @param {number} y
 * @returns {object|null}
 */
export function getTile(x, y) {
  if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
    return (worldGrid[x] && worldGrid[x][y]) ? worldGrid[x][y] : null;
  }
  return null;
}

export const WorldGridEngine = {
  GRID_SIZE,
  TILE_W,
  TILE_H,
  worldGrid,
  activeFacilitySet,
  _tileKey,
  _indexTile,
  IRON_DEPOSITS_LIST,
  OIL_DEPOSITS_LIST,
  SILICA_DEPOSITS_LIST,
  BAUXITE_DEPOSITS_LIST,
  GOLD_DEPOSITS_LIST,
  CHEMICAL_DEPOSITS_LIST,
  isIronTile,
  isOilTile,
  isSilicaTile,
  isBauxiteTile,
  isGoldTile,
  isChemicalTile,
  SEAPORTS_128,
  getCityForTile,
  checkCityUnlocks,
  initWorldGrid,
  getTile
};

if (typeof window !== 'undefined') {
  window.GRID_SIZE = GRID_SIZE;
  window.TILE_W = TILE_W;
  window.TILE_H = TILE_H;
  window.worldGrid = worldGrid;
  window.activeFacilitySet = activeFacilitySet;
  window._tileKey = _tileKey;
  window._indexTile = _indexTile;
  window.getCityForTile = getCityForTile;
  window.checkCityUnlocks = checkCityUnlocks;
  window.initWorldGrid = initWorldGrid;
  window.WorldGridEngine = WorldGridEngine;
  window.SEAPORTS_128 = SEAPORTS_128;
}

export default WorldGridEngine;
