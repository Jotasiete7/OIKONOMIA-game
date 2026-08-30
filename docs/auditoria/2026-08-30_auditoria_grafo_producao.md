# Relatório de Auditoria do Grafo de Produção & Janelas do Jogo — OIKONOMIA

**Data da Auditoria:** 30 de Agosto de 2026  
**Ambiente:** Engine OIKONOMIA v0.8.1 (Build 20260828.03)  
**Metodologia:** Auditoria Automatizada via script Node (`tools/audit_production_graph.js`) + Auditoria Estática e Funcional de Interfaces (`client/index.html`).

---

## SUMÁRIO EXECUTIVO

| Métrica do Sistema | Quantidade Catalogada | Status de Integridade |
|---|---|---|
| **Produtos no Catálogo Global** | 98 produtos | 92 válidos / 6 com inconsistência de ID |
| **Receitas Fabris de Manufatura** | 76 receitas | 71 100% integradas / 5 afetadas por ID |
| **Minas Naturais Extrativas** | 7 minas | 100% integradas e extraíveis |
| **Fazendas & Pecuárias** | 14 fazendas | 100% integradas e cultiváveis |
| **Tipos de Lojas & Varejo** | 9 formatos comerciais | 100% mapeados com whitelists |
| **Ciclos / Dependências Circulares** | 0 ciclos | ✅ Grafo Direcionado Acíclico (DAG) Válido |
| **Janelas & Modais Auditados** | 14 interfaces | 100% operacionais com handlers conectados |

---

## PARTE A — Auditoria Automatizada do Grafo de Produção

A auditoria automática foi executada pelo script `tools/audit_production_graph.js` avaliando as 7 regras estruturais mandatórias:

### Tabela de Problemas e Inconsistências Encontradas

| # | Item / ID Afetado | Severidade | Regra Violada | Detalhamento Técnico |
|---|---|---|---|---|
| 1 | `rec_wool_cloth` (Tecelagem de Lã Nobre) | **ALTA** | Regra 1: Output inexistente no catálogo | A receita `rec_wool_cloth` define `outputProdId: "wool_cloth"`, mas no `PRODUCT_CATALOG` o insumo foi registrado como `wool_yarn`. |
| 2 | `rec_suit` (Alfaiataria Executiva) | **CRÍTICA** | Regra 1: Insumo inexistente no catálogo | A receita consome `wool_cloth: 1.5`, que não existe no catálogo porque o produto foi cadastrado como `wool_yarn`. |
| 3 | `rec_sweater` (Tear de Malhas & Lã) | **CRÍTICA** | Regra 1: Insumo inexistente no catálogo | A receita consome `wool_cloth: 1.0`, travando a checagem de desbloqueio e cálculo de insumos. |
| 4 | `rec_dress` (Alta Costura & Vestidos) | **CRÍTICA** | Regra 1: Insumo inexistente no catálogo | A receita consome `wool_cloth: 0.5`, travando a checagem de desbloqueio e cálculo de insumos. |
| 5 | `rec_sofa` (Estofados: Sofás Confort) | **CRÍTICA** | Regra 1: Insumo inexistente no catálogo | A receita consome `wool_cloth: 1.0`, travando a checagem de desbloqueio e cálculo de insumos. |
| 6 | `wool_yarn` (Fio de Lã Natural) | **MÉDIA** | Regra 4: Insumo Intermediário Beco Sem Saída | Produto existe no catálogo, mas como as 4 receitas consumidoras buscam `wool_cloth`, o `wool_yarn` fica sem demanda industrial ativa. |

### Análise das 7 Regras Auditadas:

1. **Receita referenciando produto inexistente**:  
   - Encontrado 1 caso raiz (`wool_cloth` vs `wool_yarn`), que impacta 4 receitas downstream (`rec_suit`, `rec_sweater`, `rec_dress`, `rec_sofa`). Todas as outras 72 receitas referenciam produtos 100% existentes.
2. **Produto órfão (impossível de obter)**:  
   - **0 produtos órfãos**. Todos os 98 produtos possuem fonte clara: ou são extraídos em Minas/Fazendas (Tier 0), ou produzidos em Fábricas (Tiers 1 a 5), ou importados via Portos Marítimos.
3. **Matéria-prima sem local de extração**:  
   - **0 falhas**. Todos os 7 minérios possuem minas dedicadas (`iron_ore`, `bauxite`, `crude_oil`, `silica`, `timber`, `gold_ore`, `chemical_minerals`) e todas as 14 safras/rebanhos possuem fazendas dedicadas (`wheat`, `corn`, `cotton`, `sugar_cane`, `cocoa`, `coffee_beans`, `grapes`, `tobacco`, `rubber`, `cattle`, `raw_milk`, `poultry`, `pigs`, `wool`).
4. **Produto sem saída (beco sem saída)**:  
   - Apenas `wool_yarn` está sem saída ativa devido à discrepância com `wool_cloth`. Todos os outros bens ou são insumos de receitas subsequentes ou são bens finais aceitos nas gôndolas de varejo.
5. **Dependência circular no grafo**:  
   - **0 ciclos detectados**. O grafo é estritamente acíclico (DAG), permitindo cálculo determinístico de Tier (0 a 5), Árvore Genealógica e bônus de convergência.
6. **Receitas ou produtos com campos incompletos**:  
   - **0 campos nulos/NaN**. Todos os 98 produtos possuem `id`, `name`, `category`, `standardPrice`, `baseCost`, `necessityIndex`, `qualityWeight` e `brandWeight`. Todas as 76 receitas possuem `unitCost`, `quality`, `dailyCap`, `inputs` e `outputName`.
7. **Produto sem categoria de loja correspondente**:  
   - **0 falhas**. Todos os produtos comerciais finais pertencem a categorias presentes nas whitelists (`Alimentos`, `Bebidas`, `Vestuário`, `Eletrônicos`, `Automotivo`, `Farmácia`, `Higiene`, `Cosméticos`, `Móveis`, `Joias`, `Construção`).

---

## PARTE B — Auditoria das Janelas e Menus do Jogo

Auditamos todas as 14 janelas, modais e painéis contextuais do ecossistema:

| Janela / Menu | Abre corretamente? | Dropdowns / Seletores Populados? | Botões com Ação Real? | Observações & Diagnóstico |
|---|---|---|---|---|
| **Painel da Fábrica** (`renderFactoryPanel`) | ✅ Sim | ✅ Sim | ✅ Sim (`✕ Remover`, `[Trocar]`, `Ativar Linha`, `Vender`, `Demolir`) | Exibe insumos, custo unitário, qualidade QR, Tech Level e estoque fabril. Botão de trocar fornecedor por insumo 100% responsivo. |
| **Modal de Receitas da Fábrica** (`factory-recipe-modal`) | ✅ Sim | ✅ Sim (Categorias e Busca) | ✅ Sim (`[➕ Ativar Linha]`, `[🧬 Desbloquear]`) | Possui busca em tempo real e abas de categoria. Desbloqueio in-place funciona com 1 clique sem fechar a fábrica. |
| **Modal de Fornecedores de Insumos** (`supplier-modal`) | ✅ Sim | ✅ Sim (Lista ofertas de Portos e Fazendas/Moinhos) | ✅ Sim (`[Conectar / Contratar]`) | Calcula distância Manhattan, frete dinâmico, custo landed e qualidade QR. Portos e fazendas próprias aparecem lado a lado. |
| **Painel da Loja de Varejo** (`renderStorePanel`) | ✅ Sim | ✅ Sim | ✅ Sim (`Preço`, `Restock`, `Fornecedor`, `➕ Adicionar`) | Exibe gôndolas, market share quadrático, elasticidade-preço, brand rating e estoque. |
| **Modal de Adicionar Produto na Loja** (`add-product-modal`) | ✅ Sim | ✅ Sim (Filtra por whitelist da loja) | ✅ Sim (`[Adicionar à Gôndola]`) | Whitelist impede colocar produtos incompatíveis (ex: carro em drogaria). Abas de categoria funcionam. |
| **Painel de Fazenda** (`renderFarmPanel`) | ✅ Sim | ✅ Sim | ✅ Sim (`Vender`, `Demolir`) | Mostra rendimento diário, custo operacional e estoque colhido no silo. |
| **Painel de Mina** (`renderMinePanel`) | ✅ Sim | ✅ Sim | ✅ Sim (`Vender`, `Demolir`) | Mostra rendimento mineral, qualidade nativa e capacidade máxima de armazenamento. |
| **Centro de P&D (Painel Geral)** (`rd-center-modal`) | ✅ Sim | ✅ Sim | ✅ Sim (`[➕ Nova Bancada]`, `[Ver Projetos]`, `[Árvore Tec]`) | Lista slots de bancada ativos, QR atual e alvo, e consumo orçamentário mensal. |
| **Wizard de Novo Projeto P&D** (`rd-new-project-modal`) | ✅ Sim | ✅ Sim (Categorias e todos os 98 produtos) | ✅ Sim (`[Iniciar Pesquisa]`) | Hero Card de Qualidade exibe QR inicial, alvo, delta dinâmico, custo mínimo da equipe e projeção de meses (ETA assintótico). |
| **Árvore Tecnológica** (`tech-tree-modal`) | ✅ Sim | ✅ Sim (Filtros por Tier 0-5 e busca) | ✅ Sim (`[🔬 Desbloquear]`) | Exibe badges de Tech Level 1 a 5 e árvore genealógica de insumos até a raiz (Tier 0). |
| **Central de Mídia & Marketing** (`media-modal`) | ✅ Sim | ✅ Sim (TV, Rádio, Outdoor, Internet, Jornal) | ✅ Sim (`[Contratar Campanha]`, `[Cancelar]`) | Permite marketing de produto específico ou institucional corporativo. |
| **Terminais Portuários** (`port-modal`) | ✅ Sim | ✅ Sim (Catálogo internacional de importação) | ✅ Sim | Exibe produtos oferecidos, cota diária e taxa de frete por tile. |
| **Painel Financeiro / DRE** (`financial-modal`) | ✅ Sim | ✅ Sim | ✅ Sim (`Fechar`) | Demonstra Receita Bruta, CPV, Aluguéis, P&D, Marketing, Salários e Lucro Líquido diário/mensal. |
| **Tutorial & Boas-Vindas** (`welcome-tutorial-modal`) | ✅ Sim | ✅ Sim | ✅ Sim (`[Guia do Magnata]`, `[Modo Livre]`) | Modal inicial oferece tutorial com bônus financeiro ou modo livre para veteranos. |

---

## PARTE C — Ferramentas Desenvolvidas & Wiki Gerada

1. **Script de Auditoria Automatizada**:
   * Arquivo: `tools/audit_production_graph.js`
   * Execução: `npm run audit-graph` ou `$env:ELECTRON_RUN_AS_NODE="1"; Start-Process Antigravity.exe -ArgumentList "tools/audit_production_graph.js"`
2. **Script de Geração da Wiki Viva**:
   * Arquivo: `tools/generate_production_wiki.js`
   * Execução: `npm run generate-wiki` ou `$env:ELECTRON_RUN_AS_NODE="1"; Start-Process Antigravity.exe -ArgumentList "tools/generate_production_wiki.js"`
3. **Wiki Interna do Grafo de Produção**:
   * Arquivo: `docs/wiki/producao.md`
   * Conteúdo: Documentação de todos os 98 produtos organizados por Tier (0 a 5), com ID, categoria, local de produção, insumos necessários, custo de P&D, lojas de venda e receitas consumidoras.

---

## RECOMENDAÇÕES PARA A PRÓXIMA SESSÃO (Correções Priorizadas)

* **Prioridade 1 (Correção do ID da Lã / Tecelagem)**:
  * Unificar `wool_yarn` para `wool_cloth` (ou atualizar as 4 receitas de vestuário e sofás para consumirem `wool_yarn`), eliminando as 5 violações de integridade do catálogo têxtil.
* **Prioridade 2 (Padronização de Nomenclaturas Secundárias)**:
  * Garantir que aliases de doces e cafés (`chocolate` / `chocolate_bar`, `coffee` / `coffee_ground`) tenham consistência 100% espelhada entre receitas e gôndolas de varejo.
