/**
 * sprite_manager.js — Gerenciador de Sprites & Assets Isométricos do OIKONOMIA
 * Suporta carregamento assíncrono, cache, auto-detecção de vias/estruturas e fallback geométrico 3D.
 */

class SpriteManager {
  static images = new Map();
  static loadedCount = 0;
  static totalCount = 0;
  static hasLoadedAll = false;
  static onProgress = null;

  static ASSET_CATALOG = {
    // 1. LOJAS & VAREJO
    'lojas/supermarket': 'assets/lojas/supermarket.png',
    'lojas/kombini': 'assets/lojas/kombini.png',
    'lojas/apparel': 'assets/lojas/apparel.png',
    'lojas/electronics': 'assets/lojas/electronics.png',
    'lojas/automotive': 'assets/lojas/automotive.png',
    'lojas/pharmacy': 'assets/lojas/pharmacy.png',
    'lojas/furniture': 'assets/lojas/furniture.png',
    'lojas/jewelry': 'assets/lojas/jewelry.png',
    'lojas/hardware': 'assets/lojas/hardware.png',
    'lojas/competitor': 'assets/lojas/competitor.png',

    // 2. EMPRESAS & INDÚSTRIAS
    'empresas/steel_mill': 'assets/empresas/steel_mill.png',
    'empresas/refinery': 'assets/empresas/refinery.png',
    'empresas/electronics_factory': 'assets/empresas/electronics_factory.png',
    'empresas/auto_plant': 'assets/empresas/auto_plant.png',
    'empresas/textile_mill': 'assets/empresas/textile_mill.png',
    'empresas/food_processing': 'assets/empresas/food_processing.png',
    'empresas/factory_default': 'assets/empresas/factory_default.png',

    // 3. CASAS & ESTRUTURAS URBANAS
    'casas/house_suburban': 'assets/casas/house_suburban.png',
    'casas/apartment_building': 'assets/casas/apartment_building.png',
    'casas/mansion': 'assets/casas/mansion.png',
    'casas/commercial_tower': 'assets/casas/commercial_tower.png',
    'casas/office_building': 'assets/casas/office_building.png',

    // 4. ESTRADAS & VIAS
    'estradas/road_straight_x': 'assets/estradas/road_straight_x.png',
    'estradas/road_straight_y': 'assets/estradas/road_straight_y.png',
    'estradas/road_intersection': 'assets/estradas/road_intersection.png',
    'estradas/road_curve': 'assets/estradas/road_curve.png',
    'estradas/bridge': 'assets/estradas/bridge.png',

    // 5. AGROPECUÁRIA
    'agro/farm_wheat': 'assets/agro/farm_wheat.png',
    'agro/farm_corn': 'assets/agro/farm_corn.png',
    'agro/farm_cotton': 'assets/agro/farm_cotton.png',
    'agro/farm_plantation': 'assets/agro/farm_plantation.png',
    'agro/farm_cattle': 'assets/agro/farm_cattle.png',
    'agro/farm_dairy': 'assets/agro/farm_dairy.png',
    'agro/farm_default': 'assets/agro/farm_default.png',

    // 6. MINAS & EXTRAÇÃO
    'minas/mine_iron': 'assets/minas/mine_iron.png',
    'minas/mine_oil': 'assets/minas/mine_oil.png',
    'minas/mine_bauxite': 'assets/minas/mine_bauxite.png',
    'minas/mine_gold': 'assets/minas/mine_gold.png',
    'minas/mine_timber': 'assets/minas/mine_timber.png',

    // 7. LOGÍSTICA & MÍDIA
    'logistica_midia/seaport': 'assets/logistica_midia/seaport.png',
    'logistica_midia/media_tv': 'assets/logistica_midia/media_tv.png',
    'logistica_midia/media_radio': 'assets/logistica_midia/media_radio.png',

    // 8. TERRENOS BASE
    'terrenos/grass': 'assets/terrenos/grass.png',
    'terrenos/fertile_soil': 'assets/terrenos/fertile_soil.png',
    'terrenos/sand': 'assets/terrenos/sand.png',
    'terrenos/water_shallow': 'assets/terrenos/water_shallow.png',
    'terrenos/water_deep': 'assets/terrenos/water_deep.png',
    'terrenos/hill': 'assets/terrenos/hill.png',
    'terrenos/mountain': 'assets/terrenos/mountain.png',
  };

  /**
   * Inicializa o pré-carregamento de todas as imagens.
   */
  static init() {
    const keys = Object.keys(this.ASSET_CATALOG);
    this.totalCount = keys.length;
    this.loadedCount = 0;

    keys.forEach(key => {
      const src = this.ASSET_CATALOG[key];
      const img = new Image();
      img.onload = () => {
        this.loadedCount++;
        if (this.onProgress) {
          this.onProgress(this.loadedCount, this.totalCount);
        }
        if (this.loadedCount >= this.totalCount) {
          this.hasLoadedAll = true;
          if (typeof scheduleRender === 'function') scheduleRender();
        }
      };
      img.onerror = () => {
        console.warn(`[SpriteManager] Falha ao carregar sprite: ${src}`);
        this.loadedCount++;
      };
      img.src = src;
      this.images.set(key, img);
    });
  }

  /**
   * Obtém a imagem do cache se estiver pronta.
   */
  static get(key) {
    const img = this.images.get(key);
    if (img && img.complete && img.naturalWidth > 0) {
      return img;
    }
    return null;
  }

  /**
   * Renderiza um sprite isométrico 2.5D com ancoragem na base do diamante.
   * @param {CanvasRenderingContext2D} ctx Contexto 2D
   * @param {string} spriteKey Chave no catálogo
   * @param {number} sx Vértice superior do diamante (centro X)
   * @param {number} sy Vértice superior do diamante (topo Y)
   * @param {number} w Largura do diamante base (TILE_W * zoom)
   * @param {number} h Altura do diamante base (TILE_H * zoom)
   * @param {Function} fallbackFn Função fallback caso o sprite não esteja disponível
   */
  static draw(ctx, spriteKey, sx, sy, w, h, fallbackFn = null) {
    const img = this.get(spriteKey);
    if (img) {
      // Escala proporcional ao tile base (64px de largura nominal)
      const scale = w / 64;
      const destW = img.naturalWidth * scale;
      const destH = img.naturalHeight * scale;
      const destX = sx - destW / 2;
      const destY = (sy + h) - destH; // Alinha o fundo da imagem ao fundo do losango base

      ctx.drawImage(img, destX, destY, destW, destH);
      return true;
    }

    if (typeof fallbackFn === 'function') {
      fallbackFn();
    }
    return false;
  }

  // ===========================================================================
  // MAPEADORES DE SPRITE POR ELEMENTO DE SIMULAÇÃO
  // ===========================================================================

  static getStoreSprite(storeTypeId) {
    if (storeTypeId && this.ASSET_CATALOG[`lojas/${storeTypeId}`]) {
      return `lojas/${storeTypeId}`;
    }
    return 'lojas/supermarket';
  }

  static getFactorySprite(activeRecipeId) {
    if (!activeRecipeId) return 'empresas/factory_default';
    if (activeRecipeId.includes('steel') || activeRecipeId.includes('metal')) return 'empresas/steel_mill';
    if (activeRecipeId.includes('plastic') || activeRecipeId.includes('chemical') || activeRecipeId.includes('fuel')) return 'empresas/refinery';
    if (activeRecipeId.includes('chip') || activeRecipeId.includes('phone') || activeRecipeId.includes('computer')) return 'empresas/electronics_factory';
    if (activeRecipeId.includes('car') || activeRecipeId.includes('auto') || activeRecipeId.includes('truck')) return 'empresas/auto_plant';
    if (activeRecipeId.includes('cloth') || activeRecipeId.includes('jean') || activeRecipeId.includes('apparel')) return 'empresas/textile_mill';
    if (activeRecipeId.includes('bread') || activeRecipeId.includes('food') || activeRecipeId.includes('flour') || activeRecipeId.includes('beer')) return 'empresas/food_processing';
    return 'empresas/factory_default';
  }

  static getFarmSprite(farmTypeId) {
    if (!farmTypeId) return 'agro/farm_default';
    if (farmTypeId.includes('wheat')) return 'agro/farm_wheat';
    if (farmTypeId.includes('corn')) return 'agro/farm_corn';
    if (farmTypeId.includes('cotton')) return 'agro/farm_cotton';
    if (farmTypeId.includes('coffee') || farmTypeId.includes('cocoa') || farmTypeId.includes('sugar') || farmTypeId.includes('grapes') || farmTypeId.includes('tobacco') || farmTypeId.includes('rubber')) return 'agro/farm_plantation';
    if (farmTypeId.includes('cattle') || farmTypeId.includes('pigs') || farmTypeId.includes('sheep') || farmTypeId.includes('poultry')) return 'agro/farm_cattle';
    if (farmTypeId.includes('dairy')) return 'agro/farm_dairy';
    return 'agro/farm_default';
  }

  static getMineSprite(mineTypeId) {
    if (!mineTypeId) return 'minas/mine_iron';
    if (mineTypeId.includes('iron')) return 'minas/mine_iron';
    if (mineTypeId.includes('oil')) return 'minas/mine_oil';
    if (mineTypeId.includes('bauxite') || mineTypeId.includes('silica') || mineTypeId.includes('chemicals')) return 'minas/mine_bauxite';
    if (mineTypeId.includes('gold')) return 'minas/mine_gold';
    if (mineTypeId.includes('timber')) return 'minas/mine_timber';
    return 'minas/mine_iron';
  }

  static getRoadSprite(x, y, grid, isWater) {
    if (isWater) return 'estradas/bridge';
    if (!grid) return 'estradas/road_intersection';

    const left = grid[x - 1] && grid[x - 1][y] && grid[x - 1][y].isRoad;
    const right = grid[x + 1] && grid[x + 1][y] && grid[x + 1][y].isRoad;
    const up = grid[x] && grid[x][y - 1] && grid[x][y - 1].isRoad;
    const down = grid[x] && grid[x][y + 1] && grid[x][y + 1].isRoad;

    const connections = (left ? 1 : 0) + (right ? 1 : 0) + (up ? 1 : 0) + (down ? 1 : 0);

    if (connections >= 3) return 'estradas/road_intersection';
    if ((left || right) && !(up || down)) return 'estradas/road_straight_x';
    if ((up || down) && !(left || right)) return 'estradas/road_straight_y';
    if ((left || right) && (up || down)) return 'estradas/road_curve';

    // Padrão contínuo baseado em paridade
    return (x + y) % 2 === 0 ? 'estradas/road_straight_x' : 'estradas/road_straight_y';
  }

  static getUrbanSprite(districtId, x, y) {
    if (districtId === 'downtown') {
      return (x + y) % 2 === 0 ? 'casas/commercial_tower' : 'casas/office_building';
    }
    if (districtId === 'northside') {
      return (x + y) % 2 === 0 ? 'casas/apartment_building' : 'casas/mansion';
    }
    if (districtId === 'west_suburbs') {
      return 'casas/house_suburban';
    }
    return 'casas/house_suburban';
  }

  static getTerrainSprite(tile) {
    if (tile.isWater) {
      return tile.gidWater === 1 ? 'terrenos/water_deep' : 'terrenos/water_shallow';
    }
    if (tile.gidTerrain === 3) return 'terrenos/sand';
    if (tile.gidTerrain === 5) return 'terrenos/fertile_soil';
    if (tile.gidTerrain === 6) return 'terrenos/hill';
    if (tile.gidTerrain === 7) return 'terrenos/mountain';
    return 'terrenos/grass';
  }
}

// Inicialização automática ao carregar o script
if (typeof window !== 'undefined') {
  window.SpriteManager = SpriteManager;
  SpriteManager.init();
}
