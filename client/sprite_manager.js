/**
 * sprite_manager.js â€” Gerenciador de Sprites & Assets IsomÃ©tricos do OIKONOMIA
 * Suporta a distribuiÃ§Ã£o oficial do OIKONOMIA-buildings:
 * - residencial/
 * - industrial/
 * - comercial/
 * - agricultura/
 * - portuario/
 * - utilidade_publica/
 * - decoracao/
 * - vias/
 * - minas/
 * - terrenos/
 */

class SpriteManager {
  static images = new Map();
  static loadedCount = 0;
  static totalCount = 0;
  static hasLoadedAll = false;
  static onProgress = null;

  static ASSET_CATALOG = {
    // 1. COMERCIAL / LOJAS & VAREJO
    'comercial/supermarket': 'assets/comercial/supermarket.png',
    'comercial/kombini': 'assets/comercial/kombini.png',
    'comercial/apparel': 'assets/comercial/apparel.png',
    'comercial/electronics': 'assets/comercial/electronics.png',
    'comercial/automotive': 'assets/comercial/automotive.png',
    'comercial/pharmacy': 'assets/comercial/pharmacy.png',
    'comercial/furniture': 'assets/comercial/furniture.png',
    'comercial/jewelry': 'assets/comercial/jewelry.png',
    'comercial/hardware': 'assets/comercial/hardware.png',
    'comercial/competitor': 'assets/comercial/competitor.png',

    // Legado comercial
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

    // 2. INDUSTRIAL / EMPRESAS & FÃBRICAS
    'industrial/steel_mill': 'assets/industrial/steel_mill.png',
    'industrial/refinery': 'assets/industrial/refinery.png',
    'industrial/electronics_factory': 'assets/industrial/electronics_factory.png',
    'industrial/auto_plant': 'assets/industrial/auto_plant.png',
    'industrial/textile_mill': 'assets/industrial/textile_mill.png',
    'industrial/food_processing': 'assets/industrial/food_processing.png',
    'industrial/factory_default': 'assets/industrial/factory_default.png',

    // Legado industrial
    'empresas/steel_mill': 'assets/empresas/steel_mill.png',
    'empresas/refinery': 'assets/empresas/refinery.png',
    'empresas/electronics_factory': 'assets/empresas/electronics_factory.png',
    'empresas/auto_plant': 'assets/empresas/auto_plant.png',
    'empresas/textile_mill': 'assets/empresas/textile_mill.png',
    'empresas/food_processing': 'assets/empresas/food_processing.png',
    'empresas/factory_default': 'assets/empresas/factory_default.png',

    // 3. RESIDENCIAL / CASAS & ESTRUTURAS URBANAS
    'residencial/house_suburban': 'assets/residencial/house_suburban.png',
    'residencial/apartment_building': 'assets/residencial/apartment_building.png',
    'residencial/mansion': 'assets/residencial/mansion.png',
    'residencial/commercial_tower': 'assets/residencial/commercial_tower.png',
    'residencial/commercial_tower_2': 'assets/residencial/commercial_tower_2.png',
    'residencial/office_building': 'assets/residencial/office_building.png',
    'residencial/commercial_midrise': 'assets/residencial/commercial_midrise.png',
    'residencial/residential_var1': 'assets/residencial/residential_var1.png',
    'residencial/residential_var2': 'assets/residencial/residential_var2.png',
    'residencial/residential_var3': 'assets/residencial/residential_var3.png',
    'residencial/residential_var4': 'assets/residencial/residential_var4.png',

    // Legado residencial
    'casas/house_suburban': 'assets/casas/house_suburban.png',
    'casas/apartment_building': 'assets/casas/apartment_building.png',
    'casas/mansion': 'assets/casas/mansion.png',
    'casas/commercial_tower': 'assets/casas/commercial_tower.png',
    'casas/office_building': 'assets/casas/office_building.png',
    'casas/commercial_midrise': 'assets/casas/commercial_midrise.png',
    'casas/residential_var1': 'assets/casas/residential_var1.png',
    'casas/residential_var2': 'assets/casas/residential_var2.png',
    'casas/residential_var3': 'assets/casas/residential_var3.png',
    'casas/residential_var4': 'assets/casas/residential_var4.png',

    // 4. VIAS / ESTRADAS & PONTES
    'vias/road_straight_x': 'assets/vias/road_straight_x.png',
    'vias/road_straight_y': 'assets/vias/road_straight_y.png',
    'vias/road_intersection': 'assets/vias/road_intersection.png',
    'vias/road_curve': 'assets/vias/road_curve.png',
    'vias/bridge': 'assets/vias/bridge.png',

    // Legado vias
    'estradas/road_straight_x': 'assets/estradas/road_straight_x.png',
    'estradas/road_straight_y': 'assets/estradas/road_straight_y.png',
    'estradas/road_intersection': 'assets/estradas/road_intersection.png',
    'estradas/road_curve': 'assets/estradas/road_curve.png',
    'estradas/bridge': 'assets/estradas/bridge.png',

    // 5. AGRICULTURA & AGROPECUÃRIA
    'agricultura/farm_wheat': 'assets/agricultura/farm_wheat.png',
    'agricultura/farm_corn': 'assets/agricultura/farm_corn.png',
    'agricultura/farm_cotton': 'assets/agricultura/farm_cotton.png',
    'agricultura/farm_plantation': 'assets/agricultura/farm_plantation.png',
    'agricultura/farm_cattle': 'assets/agricultura/farm_cattle.png',
    'agricultura/farm_dairy': 'assets/agricultura/farm_dairy.png',
    'agricultura/farm_default': 'assets/agricultura/farm_default.png',

    // Legado agro
    'agro/farm_wheat': 'assets/agro/farm_wheat.png',
    'agro/farm_corn': 'assets/agro/farm_corn.png',
    'agro/farm_cotton': 'assets/agro/farm_cotton.png',
    'agro/farm_plantation': 'assets/agro/farm_plantation.png',
    'agro/farm_cattle': 'assets/agro/farm_cattle.png',
    'agro/farm_dairy': 'assets/agro/farm_dairy.png',
    'agro/farm_default': 'assets/agro/farm_default.png',

    // 6. PORTUÃRIO & LOGÃSTICA
    'portuario/seaport': 'assets/portuario/seaport.png',
    'logistica_midia/seaport': 'assets/logistica_midia/seaport.png',

    // 7. UTILIDADE PÃšBLICA & MÃDIA
    'utilidade_publica/media_tv': 'assets/utilidade_publica/media_tv.png',
    'utilidade_publica/media_radio': 'assets/utilidade_publica/media_radio.png',
    'logistica_midia/media_tv': 'assets/logistica_midia/media_tv.png',
    'logistica_midia/media_radio': 'assets/logistica_midia/media_radio.png',

    // 8. MINAS & EXTRAÃ‡ÃƒO
    'minas/mine_iron': 'assets/minas/mine_iron.png',
    'minas/mine_oil': 'assets/minas/mine_oil.png',
    'minas/mine_bauxite': 'assets/minas/mine_bauxite.png',
    'minas/mine_gold': 'assets/minas/mine_gold.png',
    'minas/mine_timber': 'assets/minas/mine_timber.png',

    // 9. TERRENOS BASE & FLORESTAS
    'terrenos/grass': 'assets/terrenos/grass.png',
    'terrenos/forest': 'assets/terrenos/forest.png',
    'terrenos/fertile_soil': 'assets/terrenos/fertile_soil.png',
    'terrenos/sand': 'assets/terrenos/sand.png',
    'terrenos/water_shallow': 'assets/terrenos/water_shallow.png',
    'terrenos/water_deep': 'assets/terrenos/water_deep.png',
    'terrenos/hill': 'assets/terrenos/hill.png',
    'terrenos/mountain': 'assets/terrenos/mountain.png',
    'decoracao/forest': 'assets/decoracao/forest.png',
  };

  /**
   * Inicializa o prÃ©-carregamento de todas as imagens.
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
        // Tenta fallback sem poluir o console excessivamente
        this.loadedCount++;
      };
      img.src = src;
      this.images.set(key, img);
    });
  }

  /**
   * ObtÃ©m a imagem do cache se estiver pronta.
   */
  static get(key) {
    const img = this.images.get(key);
    if (img && img.complete && img.naturalWidth > 0) {
      return img;
    }
    return null;
  }

  /**
   * Renderiza um sprite isomÃ©trico 2.5D com ancoragem geomÃ©trica precisa na base do diamante.
   */
  static draw(ctx, spriteKey, sx, sy, w, h, fallbackFn = null) {
    const img = this.get(spriteKey);
    if (img) {
      const scale = w / 64;
      const destW = img.naturalWidth * scale;
      const destH = img.naturalHeight * scale;

      let destX = sx - destW / 2;
      let destY = (sy + h) - destH;

            // 1. VIAS, ESTRADAS, MONTANHAS & COLINAS: Imagens 64x64 cujo diamante base está em Y=16..48
      if (spriteKey.startsWith('vias/') || spriteKey.startsWith('estradas/') || spriteKey === 'terrenos/mountain' || spriteKey === 'terrenos/hill') {
        destX = sx - destW / 2;
        destY = sy - (16 * scale);
      }
      // 2. TERRENOS PLANOS 64x32 (Grama, Areia, Terra Fértil, Água)
      else if (spriteKey.startsWith('terrenos/') && spriteKey !== 'terrenos/forest') {
        destX = sx - destW / 2;
        destY = sy;
      }
      // 3. TODOS OS EDIFÍCIOS, LOJAS, FÁBRICAS, FLORESTAS E TORRES (Base 64px ancorada no diamante inferior)
      else {
        destX = sx - destW / 2;
        destY = (sy + h) - destH;
      }

      ctx.drawImage(img, destX, destY, destW, destH);
      return true;
    }

    if (typeof fallbackFn === 'function') {
      fallbackFn();
    }
    return false;
  }

  // ===========================================================================
  // MAPEADORES DE SPRITE POR ELEMENTO DE SIMULAÃ‡ÃƒO (Com suporte a ambas nomenclaturas)
  // ===========================================================================

  static getStoreSprite(storeTypeId) {
    if (storeTypeId) {
      if (this.get(`comercial/${storeTypeId}`)) return `comercial/${storeTypeId}`;
      if (this.get(`lojas/${storeTypeId}`)) return `lojas/${storeTypeId}`;
    }
    return this.get('comercial/supermarket') ? 'comercial/supermarket' : 'lojas/supermarket';
  }

  static getFactorySprite(activeRecipeId) {
    if (!activeRecipeId) return 'industrial/factory_default';
    if (activeRecipeId.includes('steel') || activeRecipeId.includes('metal')) return 'industrial/steel_mill';
    if (activeRecipeId.includes('plastic') || activeRecipeId.includes('chemical') || activeRecipeId.includes('fuel')) return 'industrial/refinery';
    if (activeRecipeId.includes('chip') || activeRecipeId.includes('phone') || activeRecipeId.includes('computer')) return 'industrial/electronics_factory';
    if (activeRecipeId.includes('car') || activeRecipeId.includes('auto') || activeRecipeId.includes('truck')) return 'industrial/auto_plant';
    if (activeRecipeId.includes('cloth') || activeRecipeId.includes('jean') || activeRecipeId.includes('apparel')) return 'industrial/textile_mill';
    if (activeRecipeId.includes('bread') || activeRecipeId.includes('food') || activeRecipeId.includes('flour') || activeRecipeId.includes('beer')) return 'industrial/food_processing';
    return 'industrial/factory_default';
  }

  static getFarmSprite(farmTypeId) {
    if (!farmTypeId) return 'agricultura/farm_default';
    if (farmTypeId.includes('wheat')) return 'agricultura/farm_wheat';
    if (farmTypeId.includes('corn')) return 'agricultura/farm_corn';
    if (farmTypeId.includes('cotton')) return 'agricultura/farm_cotton';
    if (farmTypeId.includes('coffee') || farmTypeId.includes('cocoa') || farmTypeId.includes('sugar') || farmTypeId.includes('grapes') || farmTypeId.includes('tobacco') || farmTypeId.includes('rubber')) return 'agricultura/farm_plantation';
    if (farmTypeId.includes('cattle') || farmTypeId.includes('pigs') || farmTypeId.includes('sheep') || farmTypeId.includes('poultry')) return 'agricultura/farm_cattle';
    if (farmTypeId.includes('dairy')) return 'agricultura/farm_dairy';
    if (farmTypeId.includes('timber')) return 'minas/mine_timber';
    return 'agricultura/farm_default';
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
    if (isWater) return 'vias/bridge';
    if (!grid) return 'vias/road_straight_x';

    const left = !!(grid[x - 1] && grid[x - 1][y] && grid[x - 1][y].isRoad);
    const right = !!(grid[x + 1] && grid[x + 1][y] && grid[x + 1][y].isRoad);
    const up = !!(grid[x] && grid[x][y - 1] && grid[x][y - 1].isRoad);
    const down = !!(grid[x] && grid[x][y + 1] && grid[x][y + 1].isRoad);

    const hasContinuousX = left && right;
    const hasContinuousY = up && down;

    // 1. Rodovia contÃ­nua ao longo do Eixo X (mantÃ©m faixa amarela contÃ­nua mesmo com pista paralela)
    if (hasContinuousX && !hasContinuousY) return 'vias/road_straight_x';

    // 2. Rodovia contÃ­nua ao longo do Eixo Y (mantÃ©m faixa amarela contÃ­nua mesmo com pista paralela)
    if (hasContinuousY && !hasContinuousX) return 'vias/road_straight_y';

    // 3. Segmentos lineares puros
    if ((left || right) && !(up || down)) return 'vias/road_straight_x';
    if ((up || down) && !(left || right)) return 'vias/road_straight_y';

    // 4. Cruzamentos completos de 4 direÃ§Ãµes
    if (hasContinuousX && hasContinuousY) return 'vias/road_intersection';

    // 5. Curvas em Ã¢ngulo
    if ((left || right) && (up || down)) return 'vias/road_curve';

    return (x + y) % 2 === 0 ? 'vias/road_straight_x' : 'vias/road_straight_y';
  }

  static getUrbanSprite(districtId, x, y) {
    const hash = Math.abs((x * 73856093 ^ y * 19349663) % 6);
    if (districtId === 'downtown') {
      if (hash === 0) return 'residencial/commercial_tower';
      if (hash === 1) return 'residencial/commercial_tower_2';
      if (hash === 2) return 'residencial/residential_var3';
      if (hash === 3) return 'residencial/commercial_midrise';
      if (hash === 4) return 'residencial/residential_var1';
      return 'residencial/office_building';
    }
    if (districtId === 'northside') {
      if (hash === 0) return 'residencial/mansion';
      if (hash === 1) return 'residencial/residential_var2';
      if (hash === 2) return 'residencial/apartment_building';
      if (hash === 3) return 'residencial/residential_var4';
      if (hash === 4) return 'residencial/commercial_midrise';
      return 'residencial/house_suburban';
    }
    if (districtId === 'west_suburbs') {
      if (hash === 0 || hash === 1 || hash === 2) return 'residencial/house_suburban';
      if (hash === 3) return 'residencial/residential_var4';
      return 'residencial/house_suburban';
    }
    return 'residencial/house_suburban';
  }

  static getTerrainSprite(tile) {
    if (tile.isWater) {
      return tile.gidWater === 1 ? 'terrenos/water_deep' : 'terrenos/water_shallow';
    }
    if (tile.gidTerrain === 8 || tile.hasTimberDeposit || tile.gidRes === 8) return 'terrenos/forest';
    if (tile.gidTerrain === 3) return 'terrenos/sand';
    if (tile.gidTerrain === 5) return 'terrenos/fertile_soil';
    if (tile.gidTerrain === 6) return 'terrenos/hill';
    if (tile.gidTerrain === 7) return 'terrenos/mountain';
    return 'terrenos/grass';
  }
}

// InicializaÃ§Ã£o automÃ¡tica ao carregar o script
if (typeof window !== 'undefined') {
  window.SpriteManager = SpriteManager;
  SpriteManager.init();
}



