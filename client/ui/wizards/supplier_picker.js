/**
 * OIKONOMIA - Supplier Picker & Seaport Controller
 * client/ui/wizards/supplier_picker.js
 *
 * Gerencia os modais de seleção de fornecedores para:
 * - Gôndolas de Varejo (troca de fornecedor de produtos)
 * - Linhas Industriais (fornecimento de insumos fabris)
 * - Fazendas e Granjas (suplementação pecuária / ração de milho e trigo)
 * - Terminais Portuários (inspeção de cargas e frete marítimo internacional)
 */

import { PRODUCT_CATALOG, SEAPORTS } from '../../data_catalogs.js';
import { SEAPORTS_128 } from '../../engine/world_grid.js';
import CoreMath from '../../core_math.js';
import { LOGO_ICONS, generateCompanyLogo } from '../../logo_generator.js';

export const SupplierPicker = {
  supplierTargetShelf: null,
  factorySupplierTarget: null,
  farmFeedTargetTile: null,

  get worldGrid() {
    return (typeof window !== 'undefined' && window.worldGrid) ? window.worldGrid : [];
  },

  getCompanyLogoSvg(logo, size = 22) {
    if (typeof window !== 'undefined' && typeof window.getCompanyLogoSvg === 'function') {
      return window.getCompanyLogoSvg(logo, size);
    }
    return '';
  },

  getSupplierOffers(prodId, tile) {
    return this.getSupplierOffersForProduct(prodId, tile);
  },

  getSupplierOffersForProduct(prodId, storeTile) {
    const offers = [];
    const playerProfile = (typeof window !== 'undefined' && window.playerProfile) ? window.playerProfile : null;
    const pName = playerProfile?.companyName || 'OikoCorp Holding';
    const pSeed = playerProfile?.logoRegenSeed || 0;
    const playerLogo = (typeof generateCompanyLogo === 'function')
      ? generateCompanyLogo(pName, pSeed, false)
      : ((typeof window !== 'undefined' && typeof window.generateCompanyLogo === 'function') ? window.generateCompanyLogo(pName, pSeed, false) : null);
    const logoIcons = (typeof LOGO_ICONS !== 'undefined' && LOGO_ICONS) || (typeof window !== 'undefined' ? window.LOGO_ICONS : null);
    const portLogo = { shape: 'hexagon', color: '#38bdf8', iconDef: (logoIcons ? logoIcons.anchor : null) };

    const math = (typeof CoreMath !== 'undefined' && CoreMath) || (typeof window !== 'undefined' ? window.CoreMath : null);
    const getDist = (p1, p2) => math ? math.calculateManhattanDistance(p1, p2) : (Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y));
    const getFreight = (dist, rate, min) => math ? math.calculateUnitFreight(dist, rate, min) : Math.max(min, dist * rate);
    const getLanded = (price, freight) => math ? math.calculateLandedCost(price, freight) : Number((price + freight).toFixed(2));

    // 1. Portos Marítimos
    const seaportList = (typeof SEAPORTS_128 !== 'undefined' && SEAPORTS_128 && SEAPORTS_128.length > 0)
      ? SEAPORTS_128
      : ((typeof SEAPORTS !== 'undefined' && SEAPORTS) ? SEAPORTS : ((typeof window !== 'undefined' && window.SEAPORTS) ? window.SEAPORTS : []));

    for (const port of seaportList) {
      if (port.supplies && port.supplies[prodId]) {
        const sup = port.supplies[prodId];
        const dist = getDist(port.tile, storeTile);
        const freight = getFreight(dist, port.freightRatePerTile || 0.010, 0.02);
        const landed = getLanded(sup.wholesalePrice, freight);
        offers.push({
          type: 'port',
          supplierId: port.id,
          supplierName: `⚓ ${port.name}`,
          facilityName: port.name,
          ownerName: 'Autoridade Portuária & Alfândega',
          ownerLogo: portLogo,
          ownerTag: '🚢 Importação Marítima',
          activitySummary: 'Terminal alfandegado de suprimentos globais a granel',
          stockLabel: `Cota: ${sup.quota || 500} un/dia`,
          wholesalePrice: sup.wholesalePrice,
          quality: sup.quality || 50,
          quota: sup.quota || 500,
          origin: sup.origin || 'Importação Internacional',
          distance: dist,
          freight,
          landedCost: landed
        });
      }
    }

    const prodCatalog = (typeof PRODUCT_CATALOG !== 'undefined' && PRODUCT_CATALOG) || (typeof window !== 'undefined' ? window.PRODUCT_CATALOG : {});

    // Se nenhum porto tiver o produto explicitamente mapeado, gera oferta de importação marítima
    if (offers.filter(o => o.type === 'port').length === 0 && seaportList.length > 0) {
      const prod = prodCatalog[prodId] || { name: prodId, baseCost: 1.0, standardPrice: 2.0 };
      const primaryPort = seaportList[0];
      const dist = getDist(primaryPort.tile, storeTile);
      const wholesalePrice = prod.baseCost ? Number((prod.baseCost * 1.25).toFixed(2)) : 1.00;
      const freight = getFreight(dist, primaryPort.freightRatePerTile || 0.010, 0.02);
      const landed = getLanded(wholesalePrice, freight);
      offers.push({
        type: 'port',
        supplierId: primaryPort.id,
        supplierName: `⚓ ${primaryPort.name}`,
        facilityName: primaryPort.name,
        ownerName: 'Autoridade Portuária & Alfândega',
        ownerLogo: portLogo,
        ownerTag: '🚢 Importação Marítima',
        activitySummary: 'Terminal alfandegado de suprimentos globais a granel',
        stockLabel: 'Cota: 500 un/dia',
        wholesalePrice,
        quality: 50,
        quota: 500,
        origin: 'Importação Internacional',
        distance: dist,
        freight,
        landedCost: landed
      });
    }

    // 2. Fábricas, Fazendas, Minas e Armazéns Próprios (via activeFacilitySet)
    const activeSet = (typeof window !== 'undefined' && window.activeFacilitySet)
      ? window.activeFacilitySet
      : (window.WorldGridEngine ? window.WorldGridEngine.activeFacilitySet : new Map());

    for (const tile of activeSet.values()) {
      if (tile.factory && tile.factory.lines) {
        for (const [recipeId, line] of Object.entries(tile.factory.lines)) {
          if (line.outputProductId === prodId) {
            const dist = getDist(tile, storeTile);
            const freight = getFreight(dist, 0.010, 0.01);
            const landed = getLanded(line.unitCost, freight);
            offers.push({
              type: 'internal_factory',
              supplierId: `factory_${tile.x}_${tile.y}_${recipeId}`,
              supplierName: `🏭 ${tile.factory.name} (${line.recipeName})`,
              facilityName: `${tile.factory.name} — ${line.recipeName}`,
              ownerName: pName,
              ownerLogo: playerLogo,
              ownerTag: '🏛️ Produção Própria',
              activitySummary: `Linha de manufatura e refino industrial no lote (${tile.x}, ${tile.y})`,
              stockLabel: `Armazém: ${line.finishedStock || 0} / ${line.maxStock || 500} un (${line.dailyCapacity || 100} un/dia)`,
              wholesalePrice: line.unitCost,
              quality: line.outputQuality,
              quota: line.dailyCapacity,
              origin: `Fabricação Própria (${tile.x}, ${tile.y})`,
              distance: dist,
              freight,
              landedCost: landed
            });
          }
        }
      }
      if (tile.farm) {
        const isDirectCrop = (tile.farm.cropId === prodId);
        const isPoultryEggs = ((tile.farm.cropId === 'poultry' || tile.farm.farmTypeId === 'farm_poultry') && prodId === 'eggs');

        if (isDirectCrop || isPoultryEggs) {
          const dist = getDist(tile, storeTile);
          const freight = getFreight(dist, 0.008, 0.01);
          const farmCost = typeof tile.farm.unitCost === 'number' ? tile.farm.unitCost : (tile.farm.dailyOperatingCost || 0.45);
          const landed = getLanded(farmCost, freight);
          const effYield = tile.farm.effectiveYield || tile.farm.dailyYield || 500;
          const effQuality = tile.farm.effectiveQuality || tile.farm.quality || 60;
          const isEggs = isPoultryEggs;

          offers.push({
            type: 'internal_farm',
            supplierId: isEggs ? `farm_${tile.x}_${tile.y}_eggs` : `farm_${tile.x}_${tile.y}`,
            supplierName: isEggs ? `🌾 ${tile.farm.name} (Ovos Frescos)` : `🌾 ${tile.farm.name}`,
            facilityName: isEggs ? `${tile.farm.name} — Postura de Ovos` : tile.farm.name,
            ownerName: pName,
            ownerLogo: playerLogo,
            ownerTag: '🏛️ Produção Própria',
            activitySummary: isEggs
              ? `Postura e coleta diária de ovos frescos de granja no lote (${tile.x}, ${tile.y})`
              : `Cultivo rural direto de ${tile.farm.cropName || 'grãos'} no lote (${tile.x}, ${tile.y})`,
            stockLabel: `Silo: ${tile.farm.stock || 0} / ${tile.farm.maxCapacity || 5000} un (${effYield} un/dia)`,
            wholesalePrice: farmCost,
            quality: effQuality,
            quota: effYield,
            origin: `Produção Agrícola (${tile.x}, ${tile.y})`,
            distance: dist,
            freight,
            landedCost: landed
          });
        }
      }
      if (tile.mine && tile.mine.resourceId === prodId) {
        const dist = getDist(tile, storeTile);
        const freight = getFreight(dist, 0.012, 0.01);
        const landed = getLanded(tile.mine.unitCost, freight);
        offers.push({
          type: 'internal_mine',
          supplierId: `mine_${tile.x}_${tile.y}`,
          supplierName: `⛏️ ${tile.mine.name}`,
          facilityName: tile.mine.name,
          ownerName: pName,
          ownerLogo: playerLogo,
          ownerTag: '🏛️ Produção Própria',
          activitySummary: `Extração e refino primário de ${tile.mine.resourceName || 'minério'} no lote (${tile.x}, ${tile.y})`,
          stockLabel: `Pátio: ${tile.mine.stock || 0} / ${tile.mine.maxCapacity || 500} un (${tile.mine.dailyYield || 60} un/dia)`,
          wholesalePrice: tile.mine.unitCost,
          quality: tile.mine.quality,
          quota: tile.mine.dailyYield,
          origin: `Extração Mineral (${tile.x}, ${tile.y})`,
          distance: dist,
          freight,
          landedCost: landed
        });
      }
      if (tile.warehouse && tile.warehouse.inventory && tile.warehouse.inventory[prodId]) {
        const inv = tile.warehouse.inventory[prodId];
        if (inv.stock > 0 || inv.safetyStock > 0 || inv.targetStock > 0 || (inv.maxCapacity && inv.maxCapacity > 0)) {
          const dist = getDist(tile, storeTile);
          const freight = getFreight(dist, 0.008, 0.01);
          const unitPrice = typeof inv.avgUnitCost === 'number' && inv.avgUnitCost > 0 ? inv.avgUnitCost : (prodCatalog[prodId]?.baseCost || 1.0);
          const landed = getLanded(unitPrice, freight);
          const pNameStr = prodCatalog[prodId]?.name || prodId;
          offers.push({
            type: 'internal_warehouse',
            supplierId: `warehouse_${tile.x}_${tile.y}`,
            supplierName: `🏢 ${tile.warehouse.name}`,
            facilityName: `${tile.warehouse.name} — Hub Logístico`,
            ownerName: pName,
            ownerLogo: playerLogo,
            ownerTag: '📦 Armazém Central',
            activitySummary: `Estoque consolidado e buffer estratégico de ${pNameStr} no lote (${tile.x}, ${tile.y})`,
            stockLabel: `Armazém: ${inv.stock.toLocaleString()} un (Custo Médio: $${unitPrice.toFixed(2)})`,
            wholesalePrice: unitPrice,
            quality: inv.quality || 60,
            quota: inv.stock || inv.maxCapacity || 5000,
            origin: `Armazém Central (${tile.x}, ${tile.y})`,
            distance: dist,
            freight,
            landedCost: landed
          });
        }
      }
    }

    return offers.sort((a, b) => {
      const aInternal = a.type?.startsWith('internal_') ? 1 : 0;
      const bInternal = b.type?.startsWith('internal_') ? 1 : 0;
      if (aInternal !== bInternal) return bInternal - aInternal;
      return a.landedCost - b.landedCost;
    });
  },

  addLog(msg, cls) {
    if (typeof window !== 'undefined' && typeof window.addLog === 'function') {
      window.addLog(msg, cls);
    }
  },

  updateUI() {
    if (typeof window !== 'undefined' && typeof window.updateUI === 'function') {
      window.updateUI();
    }
  },

  renderFacility(tile) {
    if (typeof window !== 'undefined') {
      if (window.FacilityPanel && typeof window.FacilityPanel.renderFacilityPanel === 'function') {
        window.FacilityPanel.renderFacilityPanel(tile);
      } else if (typeof window.renderFacilityPanel === 'function') {
        window.renderFacilityPanel(tile);
      }
    }
  },

  renderSupplierOptionCard(offer, isCurrent, isFactory) {
    const isInternal = offer.type && offer.type.startsWith('internal_');
    const logoSvg = this.getCompanyLogoSvg(offer.ownerLogo, 22);

    return `
      <div class="bg-slate-950 p-3.5 rounded-2xl border ${isCurrent ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/30' : (isInternal ? 'border-emerald-600/70 bg-emerald-950/15 hover:border-emerald-500' : 'border-slate-800 hover:border-slate-700')} space-y-2 text-xs font-mono transition">
        ${isInternal ? `
          <div class="flex items-center gap-1.5 mb-1 bg-gradient-to-r from-emerald-900/60 to-teal-900/30 px-2 py-0.5 rounded-lg border border-emerald-500/50 w-fit">
            <span class="text-white font-black text-[9px] uppercase tracking-wider">🏛️ CONGLOMERADO: ${(offer.ownerName || 'SUA HOLDING').toUpperCase()}</span>
            <span class="text-emerald-300 font-bold text-[8px] px-1 py-0.2 rounded bg-emerald-950 border border-emerald-700">${offer.ownerTag || 'UNIDADE PRÓPRIA'}</span>
          </div>
        ` : ''}
        <!-- Header: Logo + Empresa + Tag de Origem + QR -->
        <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="shrink-0 flex items-center justify-center">${logoSvg}</div>
            <div class="truncate">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-bold text-xs ${isInternal ? 'text-emerald-300' : 'text-sky-300'} truncate">${offer.ownerName || 'Fornecedor'}</span>
                <span class="text-[9px] px-1.5 py-0.2 rounded border ${isInternal ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60' : 'bg-sky-950/80 text-sky-300 border-sky-700/60'} font-bold shrink-0">${offer.ownerTag || (isInternal ? '🏛️ Produção Própria' : '🚢 Importação')}</span>
              </div>
              <div class="text-[11px] text-slate-200 font-bold truncate mt-0.5">${offer.facilityName || offer.supplierName}</div>
            </div>
          </div>
          <div class="shrink-0 text-right">
            <span class="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-bold">★ QR ${offer.quality}</span>
          </div>
        </div>

        <!-- Resumo de Atividade Produtiva & Disponibilidade -->
        <div class="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60 text-[10px] text-slate-300 space-y-1">
          <div class="flex items-center gap-1.5 text-slate-300 truncate">
            <span>📦</span> <span class="italic text-[10px] truncate">${offer.activitySummary || 'Fornecimento contínuo de insumos'}</span>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/40">
            <span>Disponibilidade: <strong class="text-slate-200">${offer.stockLabel || `${offer.quota || 500} un/dia`}</strong></span>
            <span>Distância: <strong class="text-slate-200">${offer.distance} ${offer.distance === 1 ? 'tile' : 'tiles'}</strong></span>
          </div>
        </div>

        <!-- Rodapé: Detalhamento de Custos & Botão de Ação -->
        <div class="flex items-center justify-between gap-3 pt-0.5">
          <div>
            <div class="text-[10px] text-slate-400">
              ${isInternal
                ? `<span class="text-emerald-400 font-bold">Transferência Interna (Frete: $${offer.freight.toFixed(2)}/un)</span>`
                : `Base $${offer.wholesalePrice.toFixed(2)} + Frete $${offer.freight.toFixed(2)}`}
            </div>
            <div class="text-xs text-slate-200">Custo de Entrega: <strong class="text-emerald-400 font-black text-sm">$${offer.landedCost.toFixed(2)}</strong><span class="text-[10px] text-slate-400">/un</span></div>
          </div>
          <div>
            ${isCurrent ? `
              <span class="text-[10px] text-emerald-400 bg-emerald-950/90 px-3 py-1.5 rounded-xl border border-emerald-700/80 font-bold flex items-center gap-1">✓ Conectado</span>
            ` : `
              <button onclick="${isFactory ? `applyFactoryInputSupplierChange('${offer.supplierId}')` : `applySupplierChange('${offer.supplierId}')`}" class="bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono cursor-pointer transition shadow hover:shadow-teal-900/50">Conectar</button>
            `}
          </div>
        </div>
      </div>
    `;
  },

  openSupplierModal(x, y, prodId) {
    const tile = this.worldGrid[x]?.[y];
    if (!tile?.store?.shelves[prodId]) return;
    this.supplierTargetShelf = { tile, prodId };

    const prod = (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG[prodId] : null) || (window.PRODUCT_CATALOG ? window.PRODUCT_CATALOG[prodId] : { name: prodId });
    const offers = this.getSupplierOffers(prodId, tile);

    const titleEl = document.getElementById('supplier-modal-title');
    if (titleEl) titleEl.textContent = `🔗 Fornecedores de ${prod?.name || prodId}`;
    const subEl = document.getElementById('supplier-modal-subtitle');
    if (subEl) subEl.textContent = `Loja: ${tile.store.name} (${tile.x}, ${tile.y})`;

    const list = document.getElementById('supplier-options-list');
    if (list) {
      list.innerHTML = offers.map(offer => {
        const isCurrent = tile.store.shelves[prodId].supplierId === offer.supplierId;
        return this.renderSupplierOptionCard(offer, isCurrent, false);
      }).join('');
    }

    const modal = document.getElementById('supplier-modal');
    if (modal) modal.classList.remove('hidden');
  },

  applySupplierChange(supplierId) {
    if (!this.supplierTargetShelf) return;
    const { tile, prodId } = this.supplierTargetShelf;
    const offers = this.getSupplierOffers(prodId, tile);
    const chosen = offers.find(o => o.supplierId === supplierId);

    if (chosen && tile.store?.shelves[prodId]) {
      const shelf = tile.store.shelves[prodId];
      shelf.supplierId = chosen.supplierId;
      shelf.supplierName = chosen.supplierName;
      shelf.wholesalePrice = chosen.wholesalePrice;
      shelf.unitFreight = chosen.freight;
      shelf.landedCost = chosen.landedCost;
      shelf.quality = chosen.quality;

      this.addLog(`🔗 Fornecedor alterado para ${chosen.supplierName} (Custo: $${chosen.landedCost.toFixed(2)}).`, 'text-cyan-400');
      this.closeSupplierModal();
      this.renderFacility(tile);
    }
  },

  closeSupplierModal() {
    const modal = document.getElementById('supplier-modal');
    if (modal) modal.classList.add('hidden');
    this.supplierTargetShelf = null;
    this.factorySupplierTarget = null;
    this.farmFeedTargetTile = null;
  },

  openFactoryInputSupplierModal(x, y, lineKey, inputId) {
    const tile = this.worldGrid[x]?.[y];
    if (!tile?.factory?.lines[lineKey]) return;
    this.factorySupplierTarget = { tile, lineKey, inputId };

    const prod = (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG[inputId] : null) || (window.PRODUCT_CATALOG ? window.PRODUCT_CATALOG[inputId] : { name: inputId });
    const offers = this.getSupplierOffers(inputId, tile);

    const titleEl = document.getElementById('supplier-modal-title');
    if (titleEl) titleEl.textContent = `🔗 Fornecedores de Insumo: ${prod?.name || inputId}`;
    const subEl = document.getElementById('supplier-modal-subtitle');
    if (subEl) subEl.textContent = `Fábrica: ${tile.factory.name} · Linha: ${tile.factory.lines[lineKey].recipeName}`;

    const currentSupplierId = tile.factory.lines[lineKey].inputsConfig?.[inputId]?.supplierId;

    const list = document.getElementById('supplier-options-list');
    if (list) {
      list.innerHTML = offers.map(offer => {
        const isCurrent = currentSupplierId === offer.supplierId;
        return this.renderSupplierOptionCard(offer, isCurrent, true);
      }).join('');
    }

    const modal = document.getElementById('supplier-modal');
    if (modal) modal.classList.remove('hidden');
  },

  applyFactoryInputSupplierChange(supplierId) {
    if (!this.factorySupplierTarget) return;
    const { tile, lineKey, inputId } = this.factorySupplierTarget;
    const line = tile.factory?.lines[lineKey];
    if (!line) return;

    const offers = this.getSupplierOffers(inputId, tile);
    const chosen = offers.find(o => o.supplierId === supplierId);
    if (chosen) {
      line.inputsConfig = line.inputsConfig || {};
      line.inputsConfig[inputId] = {
        inputId,
        supplierId: chosen.supplierId,
        supplierName: chosen.supplierName,
        wholesalePrice: chosen.wholesalePrice,
        freight: chosen.freight,
        landedCost: chosen.landedCost,
        quality: chosen.quality
      };

      if (typeof window !== 'undefined' && typeof window.recalculateFactoryLineEconomics === 'function') {
        window.recalculateFactoryLineEconomics(line, tile);
      }

      this.addLog(`🔗 Linha "${line.recipeName}" agora é abastecida por ${chosen.supplierName}!`, 'text-cyan-400 font-bold');
      this.closeSupplierModal();
      this.renderFacility(tile);
      this.updateUI();
    }
  },

  openFarmFeedSupplierModal(x, y) {
    const tile = this.worldGrid[x]?.[y];
    if (!tile?.farm) return;
    this.farmFeedTargetTile = tile;

    const cornOffers = this.getSupplierOffers('corn', tile).map(o => ({ ...o, grainProdId: 'corn', grainName: '🌽 Milho Agrícola' }));
    const wheatOffers = this.getSupplierOffers('wheat', tile).map(o => ({ ...o, grainProdId: 'wheat', grainName: '🌾 Trigo & Cereais' }));
    const allFeedOffers = [...cornOffers, ...wheatOffers].sort((a, b) => a.landedCost - b.landedCost);

    const titleEl = document.getElementById('supplier-modal-title');
    if (titleEl) titleEl.textContent = `🌽 Selecionar Ração & Suplementação Pecuária`;
    const subEl = document.getElementById('supplier-modal-subtitle');
    if (subEl) subEl.textContent = `Fazenda: ${tile.farm.name} (${tile.district?.name || ''})`;

    const currentSupId = tile.farm.feedConfig?.active ? tile.farm.feedConfig.supplierId : null;
    const currentGrainId = tile.farm.feedConfig?.active ? tile.farm.feedConfig.grainProdId : null;

    const list = document.getElementById('supplier-options-list');
    const naturalPastureHtml = `
      <div class="bg-slate-950 p-3.5 rounded-2xl border ${!currentSupId ? 'border-emerald-500 bg-emerald-950/20 shadow-lg' : 'border-slate-800 hover:border-slate-700'} space-y-2 text-xs font-mono transition">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">🌿</span>
            <div>
              <div class="font-bold text-slate-200">Pasto Natural (Sem Ração)</div>
              <div class="text-[10px] text-slate-400">Alimentação livre no pasto · Custo de insumo zero ($0.00/dia)</div>
            </div>
          </div>
          <div>
            ${!currentSupId ? `
              <span class="text-[10px] text-emerald-400 bg-emerald-950/90 px-3 py-1.5 rounded-xl border border-emerald-700/80 font-bold">✓ Ativo</span>
            ` : `
              <button onclick="disconnectFarmFeed(${tile.x}, ${tile.y})" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold font-mono cursor-pointer border border-slate-700">Usar Pasto</button>
            `}
          </div>
        </div>
        <div class="text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
          Produção no ritmo padrão da fazenda (100% de rendimento) e Qualidade base (QR ${tile.farm.quality || 60}).
        </div>
      </div>
    `;

    const feedCardsHtml = allFeedOffers.map(offer => {
      const isCurrent = (currentSupId === offer.supplierId && currentGrainId === offer.grainProdId);
      const isInternal = offer.type && offer.type.startsWith('internal_');
      const logoSvg = this.getCompanyLogoSvg(offer.ownerLogo, 22);

      let availText = offer.stockLabel || `${offer.quota || 500} un/dia`;
      if (isInternal && offer.supplierId?.startsWith('farm_')) {
        const parts = offer.supplierId.split('_');
        const supTile = this.worldGrid[parts[1]] ? this.worldGrid[parts[1]][parts[2]] : null;
        if (supTile?.farm) {
          const sStock = supTile.farm.stock || 0;
          const req = Math.ceil((tile.farm.dailyYield || 200) * 0.20);
          const aDays = req > 0 ? Math.floor(sStock / req) : 0;
          availText = `<strong class="${sStock < req ? 'text-rose-400 font-bold' : (aDays <= 5 ? 'text-amber-300' : 'text-emerald-400')}">${sStock.toLocaleString()} un</strong> (~${aDays} dias de autonomia)`;
        }
      }

      return `
        <div class="bg-slate-950 p-3.5 rounded-2xl border ${isCurrent ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/30' : (isInternal ? 'border-amber-700/60 bg-amber-950/20 hover:border-amber-500' : 'border-slate-800 hover:border-slate-700')} space-y-2 text-xs font-mono transition">
          <div class="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="shrink-0 flex items-center justify-center">${logoSvg}</div>
              <div class="truncate">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-bold text-xs ${isInternal ? 'text-amber-300' : 'text-sky-300'} truncate">${offer.ownerName}</span>
                  <span class="text-[9px] px-1.5 py-0.2 rounded border ${isInternal ? 'bg-amber-950/80 text-amber-300 border-amber-700/60' : 'bg-sky-950/80 text-sky-300 border-sky-700/60'} font-bold shrink-0">${offer.grainName}</span>
                </div>
                <div class="text-[11px] text-slate-200 font-bold truncate mt-0.5">${offer.facilityName}</div>
              </div>
            </div>
            <div class="shrink-0 text-right">
              <span class="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800 font-bold">⚡ +50% Yield · +15 QR</span>
            </div>
          </div>

          <div class="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60 text-[10px] text-slate-300 space-y-1">
            <div class="text-slate-300 italic truncate">📦 Suplementação nutritiva contínua para as criações</div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/40">
              <span>Disponibilidade: ${availText}</span>
              <span>Distância: <strong class="text-slate-200">${offer.distance} ${offer.distance === 1 ? 'tile' : 'tiles'}</strong></span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3 pt-0.5">
            <div>
              <div class="text-[10px] text-slate-400">Base $${offer.wholesalePrice.toFixed(2)} + Frete $${offer.freight.toFixed(2)}</div>
              <div class="text-xs text-slate-200">Custo da Ração: <strong class="text-emerald-400 font-black text-sm">$${offer.landedCost.toFixed(2)}</strong><span class="text-[10px] text-slate-400">/un</span></div>
            </div>
            <div>
              ${isCurrent ? `
                <span class="text-[10px] text-emerald-400 bg-emerald-950/90 px-3 py-1.5 rounded-xl border border-emerald-700/80 font-bold flex items-center gap-1">✓ Ração Ativa</span>
              ` : `
                <button onclick="applyFarmFeedSupplierChange('${offer.supplierId}', '${offer.grainProdId}')" class="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono cursor-pointer transition shadow hover:shadow-amber-900/50">Alimentar Rebanho</button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (list) list.innerHTML = naturalPastureHtml + feedCardsHtml;
    const modal = document.getElementById('supplier-modal');
    if (modal) modal.classList.remove('hidden');
  },

  applyFarmFeedSupplierChange(supplierId, grainProdId) {
    if (!this.farmFeedTargetTile?.farm) return;
    const tile = this.farmFeedTargetTile;
    const offers = this.getSupplierOffers(grainProdId, tile);
    const chosen = offers.find(o => o.supplierId === supplierId);
    if (!chosen) return;

    tile.farm.feedConfig = {
      active: true,
      supplierId: chosen.supplierId,
      supplierName: chosen.supplierName,
      grainProdId,
      landedCost: chosen.landedCost,
      wholesalePrice: chosen.wholesalePrice,
      freight: chosen.freight,
      quality: chosen.quality
    };

    this.addLog(`🌽 ${tile.farm.name} agora é suplementada com ${grainProdId === 'corn' ? 'Milho' : 'Trigo'} de ${chosen.supplierName} (+50% produção, +15 QR)!`, 'text-amber-400 font-bold');
    this.closeSupplierModal();
    this.renderFacility(tile);
    this.updateUI();
  },

  disconnectFarmFeed(x, y) {
    const tile = this.worldGrid[x]?.[y];
    if (tile?.farm) {
      tile.farm.feedConfig = { active: false };
      this.addLog(`🌿 ${tile.farm.name} retornou ao pasto natural básico.`, 'text-slate-400');
      this.closeSupplierModal();
      this.renderFacility(tile);
      this.updateUI();
    }
  },

  openPortModal(port) {
    if (!port) return;
    const titleEl = document.getElementById('port-modal-title');
    if (titleEl) titleEl.textContent = `⚓ ${port.name}`;
    const subEl = document.getElementById('port-modal-subtitle');
    if (subEl) subEl.textContent = `Local: Cais Costeiro (${port.tile.x}, ${port.tile.y}) · Frete Base: $${(port.freightRatePerTile || 0.010).toFixed(3)}/km`;

    const list = document.getElementById('port-cargo-list');
    if (list) {
      const entries = Object.entries(port.supplies || {});
      if (entries.length === 0) {
        list.innerHTML = `<div class="text-center py-6 text-slate-500 font-mono text-xs">Nenhuma carga internacional atracada neste cais.</div>`;
      } else {
        list.innerHTML = entries.map(([prodId, sup]) => {
          const prod = (typeof PRODUCT_CATALOG !== 'undefined' ? PRODUCT_CATALOG[prodId] : null) || (window.PRODUCT_CATALOG ? window.PRODUCT_CATALOG[prodId] : { name: prodId, category: 'Geral' });
          return `
            <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <div>
                <span class="font-bold text-slate-200">${prod.name}</span>
                <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded ml-1.5">${prod.category}</span>
                <div class="text-[9px] text-cyan-400 mt-0.5">QR: ${sup.quality} · Cota: ${sup.quota} un/dia · ${sup.origin}</div>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-emerald-400">$${sup.wholesalePrice.toFixed(2)}/un</span>
                <div class="text-[9px] text-slate-500">Atacado</div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
    const modal = document.getElementById('port-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closePortModal() {
    const modal = document.getElementById('port-modal');
    if (modal) modal.classList.add('hidden');
  }
};

if (typeof window !== 'undefined') {
  window.SupplierPicker = SupplierPicker;
  window.getSupplierOffersForProduct = (prodId, storeTile) => SupplierPicker.getSupplierOffersForProduct(prodId, storeTile);
  window.renderSupplierOptionCard = (...args) => SupplierPicker.renderSupplierOptionCard(...args);
  window.openSupplierModal = (...args) => SupplierPicker.openSupplierModal(...args);
  window.applySupplierChange = (...args) => SupplierPicker.applySupplierChange(...args);
  window.closeSupplierModal = () => SupplierPicker.closeSupplierModal();
  window.openFactoryInputSupplierModal = (...args) => SupplierPicker.openFactoryInputSupplierModal(...args);
  window.applyFactoryInputSupplierChange = (...args) => SupplierPicker.applyFactoryInputSupplierChange(...args);
  window.openFarmFeedSupplierModal = (...args) => SupplierPicker.openFarmFeedSupplierModal(...args);
  window.applyFarmFeedSupplierChange = (...args) => SupplierPicker.applyFarmFeedSupplierChange(...args);
  window.disconnectFarmFeed = (...args) => SupplierPicker.disconnectFarmFeed(...args);
  window.openPortModal = (...args) => SupplierPicker.openPortModal(...args);
  window.closePortModal = () => SupplierPicker.closePortModal();
}

export default SupplierPicker;
