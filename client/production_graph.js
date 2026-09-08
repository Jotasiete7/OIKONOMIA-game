/**
 * production_graph.js — Compilador e Grafo de Produção O(1)
 * OIKONOMIA v0.8.5
 * 
 * Pré-compila toda a topologia industrial e agrícola no boot do jogo,
 * transformando buscas recursivas e varreduras O(N) em tabelas hash O(1).
 * 
 * Beneficia:
 * - Árvore Tecnológica (249 nós carregados instantaneamente)
 * - Avaliações de gargalo e fornecedores do Conselheiro Executivo (COO)
 * - Simulador "E se?" e cálculo de tiers de pesquisa no P&D
 */

import { FACTORY_RECIPES, PRODUCT_CATALOG, NATURAL_MINES, FARM_TYPES } from './data_catalogs.js';

export class ProductionGraphEngine {
  constructor(recipes = FACTORY_RECIPES, products = PRODUCT_CATALOG) {
    this.recipes = recipes || [];
    this.products = products || {};
    this.isCompiled = false;

    // Tabelas de Acesso O(1)
    this.recipesByOutput = {};
    this.recipesByInput = {};
    this.recipesById = {};
    this.tierByProduct = {};
    this.downstreamProducts = {};
    this.upstreamIngredients = {};
    this.primaryMaterials = new Set();

    this.compile();
  }

  /**
   * Compila o grafo industrial completo a partir das receitas e catálogos.
   */
  compile() {
    this.recipesByOutput = {};
    this.recipesByInput = {};
    this.recipesById = {};
    this.tierByProduct = {};
    this.downstreamProducts = {};
    this.upstreamIngredients = {};
    this.primaryMaterials = new Set();

    // 1. Mapeamento de Matérias-Primas Primárias (Fazendas e Minas)
    if (FARM_TYPES) {
      for (const f of Object.values(FARM_TYPES)) {
        if (f.producedItem) this.primaryMaterials.add(f.producedItem);
      }
    }
    if (NATURAL_MINES) {
      for (const m of Object.values(NATURAL_MINES)) {
        if (m.resourceId) this.primaryMaterials.add(m.resourceId);
      }
    }

    // 2. Indexação Direta de Receitas
    for (const r of this.recipes) {
      if (!r) continue;
      const outId = r.outputProdId || r.output || r.id;
      if (!outId) continue;

      if (r.id) {
        this.recipesById[r.id] = r;
      }
      this.recipesByOutput[outId] = r;
      if (r.id && r.id !== outId) {
        this.recipesByOutput[r.id] = r;
      }

      if (r.inputs && typeof r.inputs === 'object') {
        for (const inputId of Object.keys(r.inputs)) {
          if (!this.recipesByInput[inputId]) {
            this.recipesByInput[inputId] = [];
          }
          this.recipesByInput[inputId].push(r);

          // Rastreamento downstream direto
          if (!this.downstreamProducts[inputId]) {
            this.downstreamProducts[inputId] = [];
          }
          if (!this.downstreamProducts[inputId].includes(outId)) {
            this.downstreamProducts[inputId].push(outId);
          }
        }
      }
    }

    // 3. Pré-cálculo dos Tiers de Profundidade Industrial (0 a 5)
    for (const prodId of Object.keys(this.products)) {
      this.tierByProduct[prodId] = this._calculateTierRecursive(prodId, new Set());
    }

    // 4. Pré-cálculo da Árvore Completa Upstream (todos os insumos ancestrais)
    for (const prodId of Object.keys(this.products)) {
      this.upstreamIngredients[prodId] = this._calculateUpstreamRecursive(prodId, new Set());
    }

    this.isCompiled = true;
  }

  _calculateTierRecursive(prodId, visited) {
    if (visited.has(prodId)) return 0; // Previne loops circulares
    visited.add(prodId);

    const recipe = this.getRecipeForProduct(prodId);
    if (!recipe || !recipe.inputs || Object.keys(recipe.inputs).length === 0) {
      return 0; // Matéria-prima primária (Tier 0)
    }

    let maxInputTier = 0;
    for (const inpId of Object.keys(recipe.inputs)) {
      const inputTier = this._calculateTierRecursive(inpId, new Set(visited));
      if (inputTier > maxInputTier) maxInputTier = inputTier;
    }

    return Math.min(5, maxInputTier + 1);
  }

  _calculateUpstreamRecursive(prodId, visited) {
    if (visited.has(prodId)) return [];
    visited.add(prodId);

    const recipe = this.getRecipeForProduct(prodId);
    if (!recipe || !recipe.inputs) return [];

    const upstream = new Set(Object.keys(recipe.inputs));
    for (const inpId of Object.keys(recipe.inputs)) {
      const ancestors = this._calculateUpstreamRecursive(inpId, new Set(visited));
      for (const anc of ancestors) upstream.add(anc);
    }

    return Array.from(upstream);
  }

  // --- MÉTODOS DE CONSULTA ULTRA-RÁPIDA O(1) ---

  /**
   * Retorna a receita de manufatura para o produto fornecido em O(1).
   */
  getRecipeForProduct(productId) {
    if (!productId) return null;
    return this.recipesByOutput[productId] || this.recipesById[productId] || null;
  }

  /**
   * Retorna a receita pelo ID em O(1).
   */
  getRecipeById(recipeId) {
    return this.recipesById[recipeId] || null;
  }

  /**
   * Retorna todas as receitas industriais que consomem o insumo fornecido em O(1).
   */
  getRecipesConsuming(ingredientId) {
    return this.recipesByInput[ingredientId] || [];
  }

  /**
   * Retorna os produtos que dependem diretamente deste insumo em O(1).
   */
  getDownstreamProducts(productId) {
    return this.downstreamProducts[productId] || [];
  }

  /**
   * Retorna o Tier Industrial (0 a 5) do produto em O(1).
   */
  getProductTier(productId) {
    return this.tierByProduct[productId] !== undefined ? this.tierByProduct[productId] : 0;
  }

  /**
   * Verifica se o produto é matéria-prima primária extraível diretamente.
   */
  isPrimaryMaterial(productId) {
    return this.primaryMaterials.has(productId) || !this.getRecipeForProduct(productId);
  }

  /**
   * Retorna todos os insumos ancestrais diretos e indiretos necessários para o produto.
   */
  getAllUpstreamIngredients(productId) {
    return this.upstreamIngredients[productId] || [];
  }
}

// Instância Singleton do Grafo
export const ProductionGraph = new ProductionGraphEngine();

// Exposição global para compatibilidade com index.html e outros subsistemas
if (typeof window !== 'undefined') {
  window.ProductionGraph = ProductionGraph;
}

export default ProductionGraph;
