# 🎨 Guia & Manual do Artista e Desenvolvedor
### Projeto OIKONOMIA & Modding Capitalism Lab
**Versão:** 1.0 — Guia Técnico de Produção de Assets e Pipeline de Integração

---

## 📌 1. Visão Geral do Projeto

Este documento contém todas as diretrizes técnicas, resoluções, paletas de cores, dimensões e convenções de nomenclatura para a criação dos assets gráficos (sprites 2D, tilesets isométricos, ícones de UI/produtos e ilustrações) para o simulador econômico **OIKONOMIA** e mods do **Capitalism Lab**.

---

## 📐 2. Regras de Ouro da Perspectiva Isométrica (Padrão 2:1)

Tanto o motor do **OIKONOMIA** quanto o **Capitalism Lab** utilizam a clássica **projeção isométrica dimétrica 2:1** (ângulo clássico de *SimCity 3000*, *RollerCoaster Tycoon* e *Age of Empires*).

### Especificações do Grid:
* **Razão de Aspecto:** 2 de largura para 1 de altura (2:1).
* **Tile Base de Terreno (1x1):** `64 px` de largura por `32 px` de altura.
* **Resolução Alta (Opcional):** `128 px` de largura por `64 px` de altura.

```
                  (0, 0)
                   /\
                  /  \
       (-32, 16) /    \ (32, 16)
                 \    /
                  \  /
                   \/
                 (0, 32)
       [ Largura: 64px | Altura: 32px ]
```

### Iluminação Padronizada:
Para garantir coerência visual entre todos os artistas:
* **Fonte de Luz:** Vindo do **Canto Superior Esquerdo (Noroeste)**.
* **Face Superior (Telhado):** Tom mais claro e saturado (Luz Direta).
* **Face Esquerda (Fachada Noroeste):** Tom intermediário neutro.
* **Face Direita (Fachada Sudeste):** Tom escurecido / sombra projetada.

---

## 📦 3. Catálogo Completo de Assets e Especificações

### A. Tilesets de Terreno e Mapa
* **Formato:** PNG 32-bit (com canal Alpha transparente).
* **Dimensão do Tile Unitário:** `64x32 px`.
* **Dimensão da Spritesheet Padrão:** `512x128 px` (8 colunas por 4 linhas de tiles).
* **Lista de Tiles Necessários:**
  1. Água Profunda (Oceano)
  2. Água Rasa / Litoral
  3. Areia / Praia
  4. Grama Comum
  5. Terra Fértil / Agrícola
  6. Colinas / Elevações
  7. Montanhas Rochosas
  8. Asfalto / Rodovias Principais
  9. Estradas Secundárias de Terra

### B. Edifícios e Estruturas Urbanas
* **Formato:** PNG 32-bit com transparência total ao redor da estrutura.
* **Ponto de Origem (Anchor/Pivot):** Centro inferior do diamante base.
* **Dimensões por Categoria:**
  * **Comércio Pequeno / Conveniência (1x1):** Base `64x32 px`, Altura total da imagem: `64x64 px` até `64x96 px`.
  * **Fábricas / Supermercados (2x2):** Base `128x64 px`, Altura total da imagem: `128x128 px` até `128x160 px`.
  * **Sedes Corporativas (HQ) / Portos (3x3):** Base `192x96 px`, Altura total da imagem: `192x192 px` até `256x256 px`.

### C. Ícones de Produtos e Mercadorias
* **Formato:** PNG transparente (ou SVG vetorial).
* **Tamanhos Padrão:** `128x128 px` (alta qualidade) ou `64x64 px` (UI clássica).
* **Centralização:** Objeto com margem de segurança de ~8% de padding nas bordas.
* **Produtos Iniciais:**
  * 🍞 **Pão Artesanal** (`bread.png`)
  * 🍺 **Cerveja Especial** (`beer.png`)
  * 🥤 **Refrigerante Cola** (`cola.png`)
  * 🥛 **Leite Integral** (`milk.png`)
  * 🥚 **Ovos Frescos** (`eggs.png`)
  * 🍪 **Biscoito Recheado** (`cookies.png`)
  * 🍫 **Barra de Chocolate** (`chocolate_bar.png`)
  * 💊 **Remédio para Gripe** (`cold_pills.png`)
  * 🧴 **Xampu / Cosméticos** (`shampoo.png`)
  * 👖 **Calça Jeans / Vestuário** (`jeans.png`)
  * 📱 **Smartphone / Eletrônicos** (`mobile_phone.png`)
  * 🚗 **Automóvel Compacto** (`car.png`)

### D. Botões e Componentes de Interface (UI)
* **Padrão de 4 Estados:**
  * `btn_nome_n.png` ou `_u.png` = Normal / Up
  * `btn_nome_o.png` = Hover (Mouse sobreposto)
  * `btn_nome_d.png` = Down / Pressed (Clicado)
  * `btn_nome_disabled.png` = Desabilitado
* **Tamanhos Comuns:** `32x32 px`, `48x48 px` ou barras horizontais de `120x36 px`.

---

## 🎨 4. Paleta de Cores Oficial do OIKONOMIA

| Elemento | Código HEX | Amostra Visual | Uso |
| :--- | :--- | :--- | :--- |
| **Jogador / Sucesso** | `#10B981` / `#059669` | 🟢 Esmeralda | Lojas próprias, saldos positivos, gôndolas ativas |
| **Concorrentes (IA)** | `#F43F5E` / `#BE123C` | 🔴 Rosa/Rubi | Lojas rivais, prejuízos, avisos de perda de market share |
| **Logística / Infra** | `#FBBF24` / `#D97706` | 🟡 Dourado/Âmbar | Portos marítimos, fretes, silos de estocagem |
| **Cidades / Moradias** | `#818CF8` / `#4F46E5` | 🔵 Índigo/Azul | Zonas residenciais, densidade demográfica |
| **Fundo & Painéis** | `#020617` / `#0F172A` | ⚫ Slate Noturno | Fundo do canvas, bordas de janelas e DRE |

---

## 🛠️ 5. Ferramentas Recomendadas para o Artista

1. **Pixel Art & Spritesheets:**
   * [Aseprite](https://www.aseprite.org/) ou [LibreSprite (Open Source)](https://github.com/LibreSprite/LibreSprite)
2. **Editor de Mapas Isométricos:**
   * [Tiled Map Editor](https://www.mapeditor.org/) — [Repositório GitHub do Tiled](https://github.com/mapeditor/tiled)
3. **Design de UI e Vetores:**
   * [Figma](https://www.figma.com/) (UI/UX) / [Inkscape](https://inkscape.org/) (Vetores SVG)
4. **Pintura Digital e Edição de Texturas:**
   * [Photoshop](https://www.adobe.com/photoshop), [Krita (Open Source)](https://krita.org/) ou [GIMP](https://www.gimp.org/)
5. **Renderização 3D para Sprites 2D:**
   * [Blender](https://www.blender.org/) — Câmera configurada em modo *Orthographic* (Ângulos X: 60°, Y: 0°, Z: 45° ou 30°/60°).

---

## 🐙 6. Controle de Versão com GitHub (Como Colaborar)

Para que você e seu amigo possam trabalhar juntos e sincronizar códigos e artes pelo GitHub:

### Passo 1: Inicializar o Repositório Local
```bash
# No terminal dentro da pasta do projeto:
git init
git add .
git commit -m "feat: commit inicial com motor Oikonomia e assets"
```

### Passo 2: Criar Repositório no GitHub
1. Acesse: https://github.com/new
2. Crie um repositório chamado `oikonomia-simulator` (ou o nome que preferir).
3. Conecte o repositório local ao GitHub:
```bash
git remote add origin https://github.com/Jotasiete7/OIKONOMIA-game.git
git branch -M main
git push -u origin main
```

### Passo 3: Para o seu amigo baixar e atualizar:
```bash
# Para clonar o projeto:
git clone https://github.com/Jotasiete7/OIKONOMIA-game.git

# Para enviar novas artes:
git add .
git commit -m "art: adicionados novos sprites de padaria e loja"
git push origin main
```

> 💡 **Dica para Arquivos Grandes (Git LFS):** Se forem versionar arquivos `.psd`, `.blend` ou `.aseprite` muito pesados, utilize o [Git Large File Storage (Git LFS)](https://git-lfs.github.com/).

---

## 📂 7. Estrutura de Pastas Onde Salvar os Assets

```
📁 projeto/
│
├── 📁 oikonomia/
│   ├── 📁 data/
│   │   └── 📁 products/
│   │       ├── product-catalog.json      <-- Dados dos produtos
│   │       └── 📁 images/                <-- [Salvar Ícones PNG 128x128 aqui]
│   └── 📁 docs/                          <-- Manuais e especificações
│
├── 📁 sim-core/
│   ├── index.html                        <-- Renderizador web isométrico
│   └── engine.js                         <-- Motor matemático
│
├── 📁 Capitalism Lab/                    <-- Caso for criar Mods oficiais
│   ├── 📁 image/
│   │   ├── 📁 FirmImage/FIRM/            <-- [Salvar Prédios e Lojas aqui]
│   │   ├── 📁 Icon/                      <-- [Salvar Ícones de UI aqui]
│   │   └── 📁 NewsImage/                 <-- [Salvar Banners de Notícias aqui]
│   └── 📁 MOD/                           <-- Pacotes de Mods
│
├── 📄 tileset.png                        <-- Spritesheet do mapa (512x128)
└── 📄 oikonomia_map.tmx                  <-- Mapa do Tiled Editor
```

---
*Manual gerado para desenvolvimento e integração contínua.*

