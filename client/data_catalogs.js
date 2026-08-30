// data_catalogs.js - Master Catalogs (Products, Mines, Farms, Stores, Recipes, Media, Ports)
    const CITY_DISTRICTS = {
      water:       { id: 'water',       name: 'Baía de Arquipélago de Neo Capital',           type: 'Oceano',              population: 0,     trafficIndex: 0,  landRentDaily: 0     },
      harbor:      { id: 'harbor',      name: 'Zona Portuária & Trânsito',      type: 'Logística / Hub',     population: 8000,  trafficIndex: 42, landRentDaily: 20    },
      downtown:    { id: 'downtown',    name: 'Downtown Central',              type: 'Comercial Nobre',     population: 18000, trafficIndex: 92, landRentDaily: 65    },
      uptown:      { id: 'uptown',      name: 'Uptown Universitário',          type: 'Jovens & Serviços',   population: 5000,  trafficIndex: 72, landRentDaily: 45    },
      northside:   { id: 'northside',   name: 'Distrito Residencial Norte',    type: 'Residencial Médio',   population: 14000, trafficIndex: 55, landRentDaily: 30    },
      west_suburbs:{ id: 'west_suburbs',name: 'Subúrbio Oeste',                type: 'Residencial Família', population: 6000,  trafficIndex: 35, landRentDaily: 15    },
      industrial:  { id: 'industrial',  name: 'Distrito Industrial Sul',       type: 'Fábricas & Armazéns', population: 4000,  trafficIndex: 14, landRentDaily: 8     },
      road:        { id: 'road',        name: 'Avenida Principal',             type: 'Malha Viária',        population: 0,     trafficIndex: 80, landRentDaily: 0     },
    };

    const STORE_TYPES = [
      { id:"kombini", name:"Kombini de Bairro", emoji:"🛒", category:"all", cost:8000, maxShelves:4, rentMultiplier:1.0, desc:"Varejo de conveniência ultrarrápido com poucas gôndolas e baixo risco." },
      { id:"supermarket", name:"Supermercado & Alimentos", emoji:"🏬", category:"Alimentos", cost:45000, maxShelves:10, rentMultiplier:1.8, desc:"Grande porte para vendas em massa de alimentos, carnes, bebidas e laticínios (10 gôndolas)." },
      { id:"apparel", name:"Boutique de Vestuário & Moda", emoji:"👗", category:"Vestuário", cost:35000, maxShelves:6, rentMultiplier:1.5, desc:"Loja sofisticada para jeans, ternos, calçados e vestidos de luxo (6 gôndolas)." },
      { id:"electronics", name:"MegaStore de Eletrônicos", emoji:"💻", category:"Eletrônicos", cost:60000, maxShelves:6, rentMultiplier:2.0, desc:"Varejo especializado em smartphones, notebooks, TVs 4K e eletrodomésticos (6 gôndolas)." },
      { id:"automotive", name:"Concessionária de Automóveis", emoji:"🚗", category:"Automotivo", cost:85000, maxShelves:4, rentMultiplier:2.2, desc:"Showroom automotivo para venda de carros, SUVs, motos e caminhões (4 vagas de showroom)." },
      { id:"pharmacy", name:"Drogaria & Cosméticos", emoji:"💊", category:"Farmácia", cost:28000, maxShelves:6, rentMultiplier:1.3, desc:"Farmácia para remédios, analgésicos, xampus e perfumes (6 gôndolas)." },
      { id:"furniture", name:"Loja de Móveis & Decoração", emoji:"🛋️", category:"Móveis", cost:40000, maxShelves:5, rentMultiplier:1.6, desc:"Ambiente amplo para camas king size, sofás, mesas e armários (5 seções)." },
      { id:"jewelry", name:"Joalheria de Alta Nobreza", emoji:"💍", category:"Joias", cost:75000, maxShelves:3, rentMultiplier:2.4, desc:"Boutique de altíssimo padrão para anéis de ouro, relógios e colares nobres (3 vitrines)." },
      { id:"hardware", name:"Home Center & Ferramentas", emoji:"🔨", category:"Construção", cost:38000, maxShelves:5, rentMultiplier:1.4, desc:"Loja de materiais de reforma, tintas acrílicas e ferramentas industriais (5 gôndolas)." }
    ];

    const STORE_CATEGORY_WHITELIST = {
      kombini: ['Alimentos', 'Bebidas', 'Conveniência', 'Higiene'],
      supermarket: ['Alimentos', 'Bebidas', 'Higiene'],
      apparel: ['Vestuário'],
      electronics: ['Eletrônicos'],
      automotive: ['Automotivo'],
      pharmacy: ['Farmácia', 'Higiene', 'Cosméticos'],
      furniture: ['Móveis'],
      jewelry: ['Joias'],
      hardware: ['Construção']
    };

    const NATURAL_MINES = [
      { id:"mine_iron", name:"Mina de Minério de Ferro", emoji:"⛏️", resourceId:"iron_ore", resourceName:"Minério de Ferro", cost:40000, unitCost:15.00, quality:60, dailyYield:600, desc:"Extração de ferro essencial para siderurgia e ligas de aço." },
      { id:"mine_bauxite", name:"Mina de Bauxita", emoji:"🪨", resourceId:"bauxite", resourceName:"Bauxita (Alumínio)", cost:42000, unitCost:18.00, quality:60, dailyYield:500, desc:"Minério de bauxita refinado em alumínio estrutural leve." },
      { id:"mine_oil", name:"Campo Petrolífero / Poço", emoji:"🛢️", resourceId:"crude_oil", resourceName:"Petróleo Bruto", cost:65000, unitCost:22.00, quality:65, dailyYield:700, desc:"Extração de óleo bruto para petroquímica e produção de plástico." },
      { id:"mine_silica", name:"Jazida de Sílica & Areia", emoji:"🏖️", resourceId:"silica", resourceName:"Areia de Sílica", cost:30000, unitCost:8.00, quality:55, dailyYield:800, desc:"Sílica de alta pureza para vidros planos e semicondutores de chips." },
      { id:"mine_timber", name:"Reserva Florestal / Silvicultura", emoji:"🪵", resourceId:"timber", resourceName:"Madeira / Toras", cost:28000, unitCost:12.00, quality:60, dailyYield:650, desc:"Manejo florestal de madeira para móveis, construção e papel." },
      { id:"mine_gold", name:"Mina de Ouro Nobre", emoji:"🥇", resourceId:"gold_ore", resourceName:"Minério de Ouro", cost:90000, unitCost:120.00, quality:75, dailyYield:150, desc:"Metal precioso para alta joalheria e componentes eletrônicos." },
      { id:"mine_chemicals", name:"Depósito de Minerais Químicos", emoji:"🧪", resourceId:"chemical_minerals", resourceName:"Minerais Químicos", cost:38000, unitCost:14.00, quality:60, dailyYield:550, desc:"Sais e compostos inorgânicos para remédios, tintas e reagentes." }
    ];

    const FARM_TYPES = [
      { id:"farm_wheat", name:"Fazenda de Trigo & Cereais", emoji:"🌾", cropId:"wheat", cropName:"Trigo & Cereais", cost:22000, unitCost:0.45, quality:60, dailyYield:500, desc:"Cultivo de trigo essencial para farinha, pães e cervejas." },
      { id:"farm_corn", name:"Fazenda de Milho", emoji:"🌽", cropId:"corn", cropName:"Milho Agrícola", cost:20000, unitCost:0.40, quality:55, dailyYield:550, desc:"Milho para cereais, óleos vegetais e rações pecuárias." },
      { id:"farm_cotton", name:"Plantação de Algodão", emoji:"☁️", cropId:"cotton", cropName:"Algodão Cru", cost:24000, unitCost:1.20, quality:60, dailyYield:400, desc:"Fibras naturais de algodão para a indústria têxtil e vestuário." },
      { id:"farm_sugar", name:"Plantação de Cana de Açúcar", emoji:"🎋", cropId:"sugar_cane", cropName:"Cana de Açúcar", cost:20000, unitCost:0.30, quality:55, dailyYield:600, desc:"Cana para refino de açúcar e xaropes para bebidas e doces." },
      { id:"farm_cocoa", name:"Fazenda de Cacau", emoji:"🍫", cropId:"cocoa", cropName:"Cacau Nobre", cost:26000, unitCost:0.80, quality:60, dailyYield:350, desc:"Amêndoas de cacau para chocolates finos e confeitarias." },
      { id:"farm_coffee", name:"Plantação de Café", emoji:"☕", cropId:"coffee_beans", cropName:"Café em Grão", cost:25000, unitCost:0.90, quality:65, dailyYield:380, desc:"Grãos arábica selecionados para torrefação de cafés especiais." },
      { id:"farm_grapes", name:"Vinhedo / Parreiral", emoji:"🍇", cropId:"grapes", cropName:"Uvas Viníferas", cost:28000, unitCost:0.75, quality:70, dailyYield:420, desc:"Cultivo de uvas para produção de vinhos finos e sucos integrais." },
      { id:"farm_tobacco", name:"Plantação de Tabaco", emoji:"🍂", cropId:"tobacco", cropName:"Folhas de Tabaco", cost:24000, unitCost:1.10, quality:60, dailyYield:320, desc:"Cultivo de tabaco curado para cigarros e charutos." },
      { id:"farm_rubber", name:"Seringal / Borracha", emoji:"🌳", cropId:"rubber", cropName:"Látex / Borracha", cost:25000, unitCost:1.30, quality:60, dailyYield:350, desc:"Látex natural para pneus de automóveis e calçados esportivos." },
      { id:"farm_cattle", name:"Pecuária Bovina", emoji:"🐄", cropId:"cattle", cropName:"Gado Bovino", cost:35000, unitCost:1.80, quality:65, dailyYield:300, desc:"Criação de gado para corte bovino e couro industrial." },
      { id:"farm_dairy", name:"Pecuária Leiteira", emoji:"🥛", cropId:"raw_milk", cropName:"Leite Cru", cost:24000, unitCost:0.35, quality:65, dailyYield:450, desc:"Gado holandês para abastecimento de usinas de laticínios." },
      { id:"farm_poultry", name:"Granja Avícola", emoji:"🐔", cropId:"poultry", cropName:"Aves & Ovos", cost:22000, unitCost:0.60, quality:60, dailyYield:500, desc:"Criação de aves para corte de frango e ovos frescos de granja." },
      { id:"farm_pigs", name:"Suinocultura", emoji:"🐷", cropId:"pigs", cropName:"Suínos", cost:25000, unitCost:1.40, quality:60, dailyYield:400, desc:"Criação de porcos para abastecimento de carnes suínas e frios." },
      { id:"farm_sheep", name:"Ovinocultura", emoji:"🐑", cropId:"wool", cropName:"Lã de Ovelha", cost:26000, unitCost:1.50, quality:65, dailyYield:380, desc:"Tosquia de ovelhas para produção de tecidos de lã e suéteres nobres." }
    ];

    let PRODUCT_CATALOG = {
  "bread": {
    "id": "bread",
    "name": "Pão Artesanal",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 3.5,
    "baseCost": 0.75,
    "necessityIndex": 85,
    "qualityWeight": 45,
    "brandWeight": 15,
    "perCapitaDailyDemand": 0.025
  },
  "milk": {
    "id": "milk",
    "name": "Leite Integral",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 2.8,
    "baseCost": 0.6,
    "necessityIndex": 85,
    "qualityWeight": 50,
    "brandWeight": 10,
    "perCapitaDailyDemand": 0.022
  },
  "eggs": {
    "id": "eggs",
    "name": "Ovos Frescos",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 3.2,
    "baseCost": 0.7,
    "necessityIndex": 88,
    "qualityWeight": 45,
    "brandWeight": 10,
    "perCapitaDailyDemand": 0.02
  },
  "frozen_beef": {
    "id": "frozen_beef",
    "name": "Carne Bovina Congelada",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 14,
    "baseCost": 3.5,
    "necessityIndex": 75,
    "qualityWeight": 55,
    "brandWeight": 15,
    "perCapitaDailyDemand": 0.008
  },
  "poultry_meat": {
    "id": "poultry_meat",
    "name": "Carne de Frango",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 8.5,
    "baseCost": 2,
    "necessityIndex": 80,
    "qualityWeight": 50,
    "brandWeight": 15,
    "perCapitaDailyDemand": 0.012
  },
  "pork_meat": {
    "id": "pork_meat",
    "name": "Carne Suína",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 10.5,
    "baseCost": 2.6,
    "necessityIndex": 75,
    "qualityWeight": 50,
    "brandWeight": 15,
    "perCapitaDailyDemand": 0.009
  },
  "cookies": {
    "id": "cookies",
    "name": "Biscoito Recheado",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 4.8,
    "baseCost": 1.2,
    "necessityIndex": 25,
    "qualityWeight": 40,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.012
  },
  "chocolate_bar": {
    "id": "chocolate_bar",
    "name": "Barra de Chocolate",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 3,
    "baseCost": 0.85,
    "necessityIndex": 30,
    "qualityWeight": 40,
    "brandWeight": 40,
    "perCapitaDailyDemand": 0.014
  },
  "ground_coffee": {
    "id": "ground_coffee",
    "name": "Café Torrado e Moído",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 6.5,
    "baseCost": 1.6,
    "necessityIndex": 65,
    "qualityWeight": 50,
    "brandWeight": 25,
    "perCapitaDailyDemand": 0.01
  },
  "beer": {
    "id": "beer",
    "name": "Cerveja Especial",
    "category": "Bebidas",
    "storeType": "supermarket",
    "standardPrice": 4,
    "baseCost": 0.95,
    "necessityIndex": 30,
    "qualityWeight": 35,
    "brandWeight": 45,
    "perCapitaDailyDemand": 0.015
  },
  "wine": {
    "id": "wine",
    "name": "Vinho Fino",
    "category": "Bebidas",
    "storeType": "supermarket",
    "standardPrice": 18,
    "baseCost": 4.5,
    "necessityIndex": 25,
    "qualityWeight": 55,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.004
  },
  "cola": {
    "id": "cola",
    "name": "Refrigerante Cola",
    "category": "Bebidas",
    "storeType": "supermarket",
    "standardPrice": 2.2,
    "baseCost": 0.65,
    "necessityIndex": 50,
    "qualityWeight": 30,
    "brandWeight": 45,
    "perCapitaDailyDemand": 0.02
  },
  "mineral_water": {
    "id": "mineral_water",
    "name": "Água Mineral",
    "category": "Bebidas",
    "storeType": "supermarket",
    "standardPrice": 1.5,
    "baseCost": 0.35,
    "necessityIndex": 80,
    "qualityWeight": 30,
    "brandWeight": 30,
    "perCapitaDailyDemand": 0.022
  },
  "fruit_juice": {
    "id": "fruit_juice",
    "name": "Suco Natural",
    "category": "Bebidas",
    "storeType": "supermarket",
    "standardPrice": 3.8,
    "baseCost": 1.1,
    "necessityIndex": 60,
    "qualityWeight": 45,
    "brandWeight": 30,
    "perCapitaDailyDemand": 0.012
  },
  "cigarettes": {
    "id": "cigarettes",
    "name": "Cigarros",
    "category": "Conveniência",
    "storeType": "supermarket",
    "standardPrice": 7.5,
    "baseCost": 1.8,
    "necessityIndex": 40,
    "qualityWeight": 30,
    "brandWeight": 50,
    "perCapitaDailyDemand": 0.008
  },
  "corn_flakes": {
    "id": "corn_flakes",
    "name": "Cereais Matinais",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 4.2,
    "baseCost": 1.1,
    "necessityIndex": 55,
    "qualityWeight": 40,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.009
  },
  "canned_soup": {
    "id": "canned_soup",
    "name": "Sopa Enlatada",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 3.6,
    "baseCost": 0.95,
    "necessityIndex": 65,
    "qualityWeight": 40,
    "brandWeight": 25,
    "perCapitaDailyDemand": 0.008
  },
  "cooking_oil": {
    "id": "cooking_oil",
    "name": "Óleo Vegetal",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 3.9,
    "baseCost": 1.05,
    "necessityIndex": 80,
    "qualityWeight": 40,
    "brandWeight": 20,
    "perCapitaDailyDemand": 0.01
  },
  "yogurt": {
    "id": "yogurt",
    "name": "Iogurte",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 2.5,
    "baseCost": 0.65,
    "necessityIndex": 70,
    "qualityWeight": 45,
    "brandWeight": 25,
    "perCapitaDailyDemand": 0.012
  },
  "cheese": {
    "id": "cheese",
    "name": "Queijo Curado",
    "category": "Alimentos",
    "storeType": "supermarket",
    "standardPrice": 6.8,
    "baseCost": 1.8,
    "necessityIndex": 65,
    "qualityWeight": 55,
    "brandWeight": 20,
    "perCapitaDailyDemand": 0.007
  },
  "jeans": {
    "id": "jeans",
    "name": "Calça Jeans",
    "category": "Vestuário",
    "storeType": "apparel",
    "standardPrice": 45,
    "baseCost": 9,
    "necessityIndex": 50,
    "qualityWeight": 40,
    "brandWeight": 40,
    "perCapitaDailyDemand": 0.0015
  },
  "t_shirt": {
    "id": "t_shirt",
    "name": "Camiseta Básica",
    "category": "Vestuário",
    "storeType": "apparel",
    "standardPrice": 22,
    "baseCost": 4.8,
    "necessityIndex": 60,
    "qualityWeight": 35,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.0025
  },
  "business_suit": {
    "id": "business_suit",
    "name": "Terno Executivo",
    "category": "Vestuário",
    "storeType": "apparel",
    "standardPrice": 220,
    "baseCost": 45,
    "necessityIndex": 30,
    "qualityWeight": 50,
    "brandWeight": 40,
    "perCapitaDailyDemand": 0.0004
  },
  "wool_sweater": {
    "id": "wool_sweater",
    "name": "Suéter de Lã",
    "category": "Vestuário",
    "storeType": "apparel",
    "standardPrice": 65,
    "baseCost": 14,
    "necessityIndex": 45,
    "qualityWeight": 45,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.001
  },
  "leather_jacket": {
    "id": "leather_jacket",
    "name": "Jaqueta de Couro",
    "category": "Vestuário",
    "storeType": "apparel",
    "standardPrice": 180,
    "baseCost": 38,
    "necessityIndex": 25,
    "qualityWeight": 45,
    "brandWeight": 45,
    "perCapitaDailyDemand": 0.0005
  },
  "leather_shoes": {
    "id": "leather_shoes",
    "name": "Sapatos de Couro",
    "category": "Vestuário",
    "storeType": "apparel",
    "standardPrice": 85,
    "baseCost": 19,
    "necessityIndex": 55,
    "qualityWeight": 45,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.0011
  },
  "athletic_shoes": {
    "id": "athletic_shoes",
    "name": "Tênis Esportivo",
    "category": "Vestuário",
    "storeType": "apparel",
    "standardPrice": 75,
    "baseCost": 16,
    "necessityIndex": 55,
    "qualityWeight": 40,
    "brandWeight": 45,
    "perCapitaDailyDemand": 0.0014
  },
  "leather_bag": {
    "id": "leather_bag",
    "name": "Bolsa Feminina",
    "category": "Vestuário",
    "storeType": "apparel",
    "standardPrice": 120,
    "baseCost": 26,
    "necessityIndex": 25,
    "qualityWeight": 45,
    "brandWeight": 45,
    "perCapitaDailyDemand": 0.0006
  },
  "gala_dress": {
    "id": "gala_dress",
    "name": "Vestido de Gala",
    "category": "Vestuário",
    "storeType": "apparel",
    "standardPrice": 95,
    "baseCost": 21,
    "necessityIndex": 25,
    "qualityWeight": 45,
    "brandWeight": 45,
    "perCapitaDailyDemand": 0.0007
  },
  "underwear": {
    "id": "underwear",
    "name": "Roupas Íntimas",
    "category": "Vestuário",
    "storeType": "apparel",
    "standardPrice": 15,
    "baseCost": 3.2,
    "necessityIndex": 80,
    "qualityWeight": 40,
    "brandWeight": 30,
    "perCapitaDailyDemand": 0.003
  },
  "mobile_phone": {
    "id": "mobile_phone",
    "name": "Smartphone",
    "category": "Eletrônicos",
    "storeType": "electronics",
    "standardPrice": 450,
    "baseCost": 95,
    "necessityIndex": 60,
    "qualityWeight": 50,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.0008
  },
  "laptop_pc": {
    "id": "laptop_pc",
    "name": "Notebook / Laptop",
    "category": "Eletrônicos",
    "storeType": "electronics",
    "standardPrice": 850,
    "baseCost": 180,
    "necessityIndex": 55,
    "qualityWeight": 55,
    "brandWeight": 30,
    "perCapitaDailyDemand": 0.0004
  },
  "desktop_pc": {
    "id": "desktop_pc",
    "name": "Computador Desktop",
    "category": "Eletrônicos",
    "storeType": "electronics",
    "standardPrice": 700,
    "baseCost": 150,
    "necessityIndex": 50,
    "qualityWeight": 55,
    "brandWeight": 25,
    "perCapitaDailyDemand": 0.0003
  },
  "television": {
    "id": "television",
    "name": "Smart TV 4K",
    "category": "Eletrônicos",
    "storeType": "electronics",
    "standardPrice": 600,
    "baseCost": 130,
    "necessityIndex": 45,
    "qualityWeight": 50,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.0004
  },
  "digital_camera": {
    "id": "digital_camera",
    "name": "Câmera Digital",
    "category": "Eletrônicos",
    "storeType": "electronics",
    "standardPrice": 350,
    "baseCost": 78,
    "necessityIndex": 30,
    "qualityWeight": 55,
    "brandWeight": 30,
    "perCapitaDailyDemand": 0.0003
  },
  "game_console": {
    "id": "game_console",
    "name": "Console de Videogame",
    "category": "Eletrônicos",
    "storeType": "electronics",
    "standardPrice": 400,
    "baseCost": 90,
    "necessityIndex": 30,
    "qualityWeight": 45,
    "brandWeight": 45,
    "perCapitaDailyDemand": 0.0005
  },
  "microwave": {
    "id": "microwave",
    "name": "Forno Micro-ondas",
    "category": "Eletrônicos",
    "storeType": "electronics",
    "standardPrice": 160,
    "baseCost": 38,
    "necessityIndex": 65,
    "qualityWeight": 45,
    "brandWeight": 25,
    "perCapitaDailyDemand": 0.0006
  },
  "refrigerator": {
    "id": "refrigerator",
    "name": "Geladeira Duplex",
    "category": "Eletrônicos",
    "storeType": "electronics",
    "standardPrice": 750,
    "baseCost": 165,
    "necessityIndex": 75,
    "qualityWeight": 50,
    "brandWeight": 25,
    "perCapitaDailyDemand": 0.0003
  },
  "air_conditioner": {
    "id": "air_conditioner",
    "name": "Ar Condicionado",
    "category": "Eletrônicos",
    "storeType": "electronics",
    "standardPrice": 550,
    "baseCost": 125,
    "necessityIndex": 50,
    "qualityWeight": 50,
    "brandWeight": 25,
    "perCapitaDailyDemand": 0.0004
  },
  "washing_machine": {
    "id": "washing_machine",
    "name": "Lavadora de Roupas",
    "category": "Eletrônicos",
    "storeType": "electronics",
    "standardPrice": 620,
    "baseCost": 140,
    "necessityIndex": 70,
    "qualityWeight": 50,
    "brandWeight": 25,
    "perCapitaDailyDemand": 0.0003
  },
  "compact_car": {
    "id": "compact_car",
    "name": "Carro Compacto",
    "category": "Automotivo",
    "storeType": "automotive",
    "standardPrice": 14000,
    "baseCost": 3200,
    "necessityIndex": 50,
    "qualityWeight": 45,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.00008
  },
  "sedan_car": {
    "id": "sedan_car",
    "name": "Carro Sedan",
    "category": "Automotivo",
    "storeType": "automotive",
    "standardPrice": 22000,
    "baseCost": 5100,
    "necessityIndex": 40,
    "qualityWeight": 50,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.00005
  },
  "suv_car": {
    "id": "suv_car",
    "name": "Veículo SUV",
    "category": "Automotivo",
    "storeType": "automotive",
    "standardPrice": 32000,
    "baseCost": 7400,
    "necessityIndex": 35,
    "qualityWeight": 50,
    "brandWeight": 40,
    "perCapitaDailyDemand": 0.00004
  },
  "motorcycle": {
    "id": "motorcycle",
    "name": "Motocicleta",
    "category": "Automotivo",
    "storeType": "automotive",
    "standardPrice": 6500,
    "baseCost": 1450,
    "necessityIndex": 55,
    "qualityWeight": 40,
    "brandWeight": 40,
    "perCapitaDailyDemand": 0.0001
  },
  "heavy_truck": {
    "id": "heavy_truck",
    "name": "Caminhão Pesado",
    "category": "Automotivo",
    "storeType": "automotive",
    "standardPrice": 65000,
    "baseCost": 15500,
    "necessityIndex": 60,
    "qualityWeight": 60,
    "brandWeight": 20,
    "perCapitaDailyDemand": 0.00002
  },
  "cold_pills": {
    "id": "cold_pills",
    "name": "Remédio para Gripe",
    "category": "Farmácia",
    "storeType": "pharmacy",
    "standardPrice": 9.5,
    "baseCost": 1.8,
    "necessityIndex": 80,
    "qualityWeight": 60,
    "brandWeight": 25,
    "perCapitaDailyDemand": 0.005
  },
  "pain_reliever": {
    "id": "pain_reliever",
    "name": "Analgésico",
    "category": "Farmácia",
    "storeType": "pharmacy",
    "standardPrice": 8,
    "baseCost": 1.5,
    "necessityIndex": 85,
    "qualityWeight": 60,
    "brandWeight": 20,
    "perCapitaDailyDemand": 0.006
  },
  "cough_syrup": {
    "id": "cough_syrup",
    "name": "Xarope para Tosse",
    "category": "Farmácia",
    "storeType": "pharmacy",
    "standardPrice": 11,
    "baseCost": 2.2,
    "necessityIndex": 80,
    "qualityWeight": 60,
    "brandWeight": 20,
    "perCapitaDailyDemand": 0.0035
  },
  "shampoo": {
    "id": "shampoo",
    "name": "Xampu",
    "category": "Higiene",
    "storeType": "pharmacy",
    "standardPrice": 6,
    "baseCost": 1.2,
    "necessityIndex": 70,
    "qualityWeight": 40,
    "brandWeight": 40,
    "perCapitaDailyDemand": 0.006
  },
  "soap": {
    "id": "soap",
    "name": "Sabonete Corporal",
    "category": "Higiene",
    "storeType": "pharmacy",
    "standardPrice": 3.5,
    "baseCost": 0.7,
    "necessityIndex": 85,
    "qualityWeight": 40,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.01
  },
  "toothpaste": {
    "id": "toothpaste",
    "name": "Pasta de Dente",
    "category": "Higiene",
    "storeType": "pharmacy",
    "standardPrice": 4.2,
    "baseCost": 0.85,
    "necessityIndex": 88,
    "qualityWeight": 40,
    "brandWeight": 35,
    "perCapitaDailyDemand": 0.008
  },
  "luxury_perfume": {
    "id": "luxury_perfume",
    "name": "Perfume de Luxo",
    "category": "Cosméticos",
    "storeType": "pharmacy",
    "standardPrice": 75,
    "baseCost": 14,
    "necessityIndex": 20,
    "qualityWeight": 45,
    "brandWeight": 45,
    "perCapitaDailyDemand": 0.001
  },
  "sunscreen": {
    "id": "sunscreen",
    "name": "Protetor Solar",
    "category": "Cosméticos",
    "storeType": "pharmacy",
    "standardPrice": 16,
    "baseCost": 3.1,
    "necessityIndex": 60,
    "qualityWeight": 50,
    "brandWeight": 30,
    "perCapitaDailyDemand": 0.0025
  },
  "king_bed": {
    "id": "king_bed",
    "name": "Cama King Size",
    "category": "Móveis",
    "storeType": "furniture",
    "standardPrice": 450,
    "baseCost": 95,
    "necessityIndex": 60,
    "qualityWeight": 50,
    "brandWeight": 25,
    "perCapitaDailyDemand": 0.0003
  },
  "sofa": {
    "id": "sofa",
    "name": "Sofá Conforto",
    "category": "Móveis",
    "storeType": "furniture",
    "standardPrice": 550,
    "baseCost": 120,
    "necessityIndex": 45,
    "qualityWeight": 50,
    "brandWeight": 30,
    "perCapitaDailyDemand": 0.0003
  },
  "dining_table": {
    "id": "dining_table",
    "name": "Mesa de Jantar",
    "category": "Móveis",
    "storeType": "furniture",
    "standardPrice": 320,
    "baseCost": 68,
    "necessityIndex": 55,
    "qualityWeight": 50,
    "brandWeight": 20,
    "perCapitaDailyDemand": 0.0004
  },
  "wardrobe": {
    "id": "wardrobe",
    "name": "Guarda-Roupa",
    "category": "Móveis",
    "storeType": "furniture",
    "standardPrice": 480,
    "baseCost": 105,
    "necessityIndex": 60,
    "qualityWeight": 50,
    "brandWeight": 20,
    "perCapitaDailyDemand": 0.0003
  },
  "office_chair": {
    "id": "office_chair",
    "name": "Cadeira Executiva",
    "category": "Móveis",
    "storeType": "furniture",
    "standardPrice": 150,
    "baseCost": 32,
    "necessityIndex": 65,
    "qualityWeight": 50,
    "brandWeight": 25,
    "perCapitaDailyDemand": 0.0006
  },
  "gold_watch": {
    "id": "gold_watch",
    "name": "Relógio de Ouro",
    "category": "Joias",
    "storeType": "jewelry",
    "standardPrice": 1200,
    "baseCost": 260,
    "necessityIndex": 15,
    "qualityWeight": 45,
    "brandWeight": 50,
    "perCapitaDailyDemand": 0.00015
  },
  "gold_ring": {
    "id": "gold_ring",
    "name": "Anel de Ouro 18k",
    "category": "Joias",
    "storeType": "jewelry",
    "standardPrice": 650,
    "baseCost": 140,
    "necessityIndex": 15,
    "qualityWeight": 45,
    "brandWeight": 50,
    "perCapitaDailyDemand": 0.00025
  },
  "gold_necklace": {
    "id": "gold_necklace",
    "name": "Colar de Ouro",
    "category": "Joias",
    "storeType": "jewelry",
    "standardPrice": 1100,
    "baseCost": 250,
    "necessityIndex": 15,
    "qualityWeight": 45,
    "brandWeight": 50,
    "perCapitaDailyDemand": 0.00018
  },
  "acrylic_paint": {
    "id": "acrylic_paint",
    "name": "Lata de Tinta Acrílica",
    "category": "Construção",
    "storeType": "hardware",
    "standardPrice": 35,
    "baseCost": 7.5,
    "necessityIndex": 50,
    "qualityWeight": 45,
    "brandWeight": 30,
    "perCapitaDailyDemand": 0.0012
  },
  "tool_set": {
    "id": "tool_set",
    "name": "Jogo de Ferramentas",
    "category": "Construção",
    "storeType": "hardware",
    "standardPrice": 65,
    "baseCost": 13.5,
    "necessityIndex": 60,
    "qualityWeight": 55,
    "brandWeight": 20,
    "perCapitaDailyDemand": 0.0008
  }
};
    let FACTORY_RECIPES = [
  {
    "id": "rec_steel",
    "name": "Siderurgia: Aço Laminado",
    "outputProdId": "steel",
    "outputName": "Aço Laminado",
    "isIntermediate": true,
    "unitCost": 28,
    "quality": 65,
    "dailyCap": 400,
    "inputs": {
      "iron_ore": 1
    },
    "desc": "Transforma minério de ferro em placas de aço estrutural."
  },
  {
    "id": "rec_aluminum",
    "name": "Refino de Alumínio",
    "outputProdId": "aluminum",
    "outputName": "Alumínio Processado",
    "isIntermediate": true,
    "unitCost": 32,
    "quality": 65,
    "dailyCap": 350,
    "inputs": {
      "bauxite": 1
    },
    "desc": "Processa bauxita em ligas de alumínio ultraleves."
  },
  {
    "id": "rec_plastic",
    "name": "Petroquímica: Plásticos",
    "outputProdId": "plastic",
    "outputName": "Plástico Industrial",
    "isIntermediate": true,
    "unitCost": 16,
    "quality": 60,
    "dailyCap": 600,
    "inputs": {
      "crude_oil": 0.5
    },
    "desc": "Polímeros derivados de petróleo para embalagens e gabinetes."
  },
  {
    "id": "rec_glass",
    "name": "Vidraria Industrial",
    "outputProdId": "glass",
    "outputName": "Vidro Plano",
    "isIntermediate": true,
    "unitCost": 14,
    "quality": 60,
    "dailyCap": 500,
    "inputs": {
      "silica": 1
    },
    "desc": "Fundição de sílica para garrafas, janelas e telas digitais."
  },
  {
    "id": "rec_cloth",
    "name": "Fiação & Tecelagem de Algodão",
    "outputProdId": "cotton_cloth",
    "outputName": "Tecido de Algodão",
    "isIntermediate": true,
    "unitCost": 3.5,
    "quality": 65,
    "dailyCap": 500,
    "inputs": {
      "cotton": 1
    },
    "desc": "Tecelagem de fios de algodão para confecção têxtil."
  },
  {
    "id": "rec_wool_cloth",
    "name": "Tecelagem de Lã Nobre",
    "outputProdId": "wool_cloth",
    "outputName": "Tecido de Lã",
    "isIntermediate": true,
    "unitCost": 4.2,
    "quality": 68,
    "dailyCap": 400,
    "inputs": {
      "wool": 1
    },
    "desc": "Fios de lã natural para alfaiataria de luxo e suéteres."
  },
  {
    "id": "rec_leather",
    "name": "Curtume: Couro Bovino",
    "outputProdId": "leather",
    "outputName": "Couro Curtido",
    "isIntermediate": true,
    "unitCost": 8.5,
    "quality": 65,
    "dailyCap": 350,
    "inputs": {
      "cattle": 1
    },
    "desc": "Tratamento de couro bovino para calçados, bolsas e jaquetas."
  },
  {
    "id": "rec_paper",
    "name": "Celulose & Papel",
    "outputProdId": "paper",
    "outputName": "Papel & Embalagens",
    "isIntermediate": true,
    "unitCost": 8,
    "quality": 60,
    "dailyCap": 600,
    "inputs": {
      "timber": 0.5
    },
    "desc": "Processamento de celulose para caixas, manuais e cigarros."
  },
  {
    "id": "rec_lumber",
    "name": "Serraria: Chapas de Madeira",
    "outputProdId": "lumber",
    "outputName": "Chapas de Madeira",
    "isIntermediate": true,
    "unitCost": 18,
    "quality": 65,
    "dailyCap": 450,
    "inputs": {
      "timber": 1
    },
    "desc": "Corte de toras em pranchas estruturais para marcenaria."
  },
  {
    "id": "rec_chips",
    "name": "Semicondutores & Microchips",
    "outputProdId": "chips",
    "outputName": "Chips & Circuitos",
    "isIntermediate": true,
    "unitCost": 45,
    "quality": 72,
    "dailyCap": 300,
    "inputs": {
      "silica": 1,
      "chemical_minerals": 1
    },
    "desc": "Wafers de silício fotogravados para a indústria eletrônica."
  },
  {
    "id": "rec_engine",
    "name": "Usinagem de Motores",
    "outputProdId": "engine",
    "outputName": "Motor a Combustão",
    "isIntermediate": true,
    "unitCost": 180,
    "quality": 70,
    "dailyCap": 150,
    "inputs": {
      "steel": 1,
      "aluminum": 1
    },
    "desc": "Blocos de motor de alta precisão para a indústria automotiva."
  },
  {
    "id": "rec_tires",
    "name": "Vulcanização de Pneus",
    "outputProdId": "tires",
    "outputName": "Pneus Automotivos",
    "isIntermediate": true,
    "unitCost": 22,
    "quality": 65,
    "dailyCap": 400,
    "inputs": {
      "rubber": 1,
      "chemical_minerals": 0.5
    },
    "desc": "Pneus de borracha vulcanizada com cinta de aço."
  },
  {
    "id": "rec_flour",
    "name": "Moinho de Farinha",
    "outputProdId": "flour",
    "outputName": "Farinha Refinada",
    "isIntermediate": true,
    "unitCost": 0.65,
    "quality": 62,
    "dailyCap": 700,
    "inputs": {
      "wheat": 1
    },
    "desc": "Moagem de trigo para suprir padarias e confeitarias."
  },
  {
    "id": "rec_sugar",
    "name": "Refinaria de Açúcar",
    "outputProdId": "refined_sugar",
    "outputName": "Açúcar Refinado",
    "isIntermediate": true,
    "unitCost": 0.5,
    "quality": 58,
    "dailyCap": 800,
    "inputs": {
      "sugar_cane": 1
    },
    "desc": "Cristalização e refino de caldo de cana para bebidas e doces."
  },
  {
    "id": "rec_bread",
    "name": "Panificação Artesanal",
    "outputProdId": "bread",
    "outputName": "Pão Artesanal",
    "unitCost": 0.75,
    "quality": 65,
    "dailyCap": 500,
    "inputs": { "flour": 1 },
    "desc": "Farinha refinada transformada em pães crocantes."
  },
  {
    "id": "rec_milk",
    "name": "Usina de Laticínios",
    "outputProdId": "milk",
    "outputName": "Leite Integral",
    "unitCost": 0.6,
    "quality": 68,
    "dailyCap": 450,
    "inputs": { "raw_milk": 1 },
    "desc": "Pasteurização de leite cru e embalagem cartonada."
  },
  {
    "id": "rec_frozen_beef",
    "name": "Frigorífico Bovino",
    "outputProdId": "frozen_beef",
    "outputName": "Carne Bovina Congelada",
    "unitCost": 3.5,
    "quality": 70,
    "dailyCap": 300,
    "inputs": { "cattle": 1 },
    "desc": "Cortes nobres bovinos resfriados e embalados a vácuo."
  },
  {
    "id": "rec_poultry",
    "name": "Abatedouro Avícola",
    "outputProdId": "poultry_meat",
    "outputName": "Carne de Frango",
    "unitCost": 2,
    "quality": 65,
    "dailyCap": 450,
    "inputs": { "poultry": 1 },
    "desc": "Processamento de cortes de frango resfriados."
  },
  {
    "id": "rec_pork",
    "name": "Frigorífico Suíno",
    "outputProdId": "pork_meat",
    "outputName": "Carne Suína",
    "unitCost": 2.6,
    "quality": 65,
    "dailyCap": 380,
    "inputs": { "pigs": 1 },
    "desc": "Cortes suínos selecionados para varejo."
  },
  {
    "id": "rec_cookies",
    "name": "Confeitaria & Biscoitos",
    "outputProdId": "cookies",
    "outputName": "Biscoito Recheado",
    "unitCost": 1.2,
    "quality": 65,
    "dailyCap": 400,
    "inputs": { "flour": 1, "refined_sugar": 0.5 },
    "desc": "Biscoitos crocantes com recheio de chocolate e baunilha."
  },
  {
    "id": "rec_chocolate",
    "name": "Fábrica de Chocolates",
    "outputProdId": "chocolate_bar",
    "outputName": "Barra de Chocolate",
    "unitCost": 0.85,
    "quality": 70,
    "dailyCap": 450,
    "inputs": { "cocoa": 1, "refined_sugar": 0.5, "raw_milk": 0.5 },
    "desc": "Cacau nobre com leite e açúcar cristalizado."
  },
  {
    "id": "rec_coffee",
    "name": "Torrefação de Café",
    "outputProdId": "ground_coffee",
    "outputName": "Café Torrado e Moído",
    "unitCost": 1.6,
    "quality": 72,
    "dailyCap": 350,
    "inputs": { "coffee_beans": 1 },
    "desc": "Moagem e embalagem a vácuo de grãos selecionados."
  },
  {
    "id": "rec_beer",
    "name": "Cervejaria Puro Malte",
    "outputProdId": "beer",
    "outputName": "Cerveja Especial",
    "unitCost": 0.95,
    "quality": 75,
    "dailyCap": 400,
    "inputs": { "wheat": 1, "glass": 0.5 },
    "desc": "Fermentação artesanal com lúpulo e malte de trigo."
  },
  {
    "id": "rec_wine",
    "name": "Vinícola Tradicional",
    "outputProdId": "wine",
    "outputName": "Vinho Fino",
    "unitCost": 4.5,
    "quality": 78,
    "dailyCap": 250,
    "inputs": { "grapes": 1, "glass": 0.5 },
    "desc": "Envelhecimento em barris de carvalho e engarrafamento."
  },
  {
    "id": "rec_cola",
    "name": "Engarrafadora de Refrigerante",
    "outputProdId": "cola",
    "outputName": "Refrigerante Cola",
    "unitCost": 0.65,
    "quality": 60,
    "dailyCap": 700,
    "inputs": { "refined_sugar": 0.5, "aluminum": 0.5 },
    "desc": "Xarope gaseificado em latas de alumínio reciclável."
  },
  {
    "id": "rec_water",
    "name": "Fonte & Envase de Água",
    "outputProdId": "mineral_water",
    "outputName": "Água Mineral",
    "unitCost": 0.35,
    "quality": 65,
    "dailyCap": 800,
    "inputs": { "plastic": 0.5 },
    "desc": "Água mineral de nascente purificada em garrafas pet."
  },
  {
    "id": "rec_juice",
    "name": "Fábrica de Sucos Naturais",
    "outputProdId": "fruit_juice",
    "outputName": "Suco Natural",
    "unitCost": 1.1,
    "quality": 70,
    "dailyCap": 400,
    "inputs": { "refined_sugar": 0.5, "paper": 0.5 },
    "desc": "Polpa de fruta pasteurizada sem conservantes artificiais."
  },
  {
    "id": "rec_cigarettes",
    "name": "Manufatura de Fumo",
    "outputProdId": "cigarettes",
    "outputName": "Cigarros",
    "unitCost": 1.8,
    "quality": 60,
    "dailyCap": 500,
    "inputs": { "tobacco": 1, "paper": 0.5 },
    "desc": "Tabaco curado embalado com filtro em maços selados."
  },
  {
    "id": "rec_corn_flakes",
    "name": "Cereais & Alimentos Matinais",
    "outputProdId": "corn_flakes",
    "outputName": "Cereais Matinais",
    "unitCost": 1.1,
    "quality": 65,
    "dailyCap": 420,
    "inputs": { "corn": 1, "refined_sugar": 0.2 },
    "desc": "Flocos de milho tostados enriquecidos com vitaminas."
  },
  {
    "id": "rec_canned_soup",
    "name": "Conservas & Sopas Enlatadas",
    "outputProdId": "canned_soup",
    "outputName": "Sopa Enlatada",
    "unitCost": 0.95,
    "quality": 62,
    "dailyCap": 450,
    "inputs": { "poultry": 0.5, "aluminum": 0.5 },
    "desc": "Alimentos em conserva herméticos de longa durabilidade."
  },
  {
    "id": "rec_cooking_oil",
    "name": "Refinaria de Óleo Vegetal",
    "outputProdId": "cooking_oil",
    "outputName": "Óleo Vegetal",
    "unitCost": 1.05,
    "quality": 60,
    "dailyCap": 480,
    "inputs": { "corn": 1, "plastic": 0.5 },
    "desc": "Prensagem e refino de milho em óleo culinário límpido."
  },
  {
    "id": "rec_yogurt",
    "name": "Iogurteria & Fermentados",
    "outputProdId": "yogurt",
    "outputName": "Iogurte",
    "unitCost": 0.65,
    "quality": 68,
    "dailyCap": 500,
    "inputs": { "raw_milk": 1, "plastic": 0.5 },
    "desc": "Leite fermentado com probióticos naturais e frutas."
  },
  {
    "id": "rec_cheese",
    "name": "Queijaria & Maturação",
    "outputProdId": "cheese",
    "outputName": "Queijo Curado",
    "unitCost": 1.8,
    "quality": 75,
    "dailyCap": 320,
    "inputs": { "raw_milk": 1.5 },
    "desc": "Massa coalhada prensada e maturada por 90 dias."
  },
  {
    "id": "rec_jeans",
    "name": "Confecção: Calça Jeans",
    "outputProdId": "jeans",
    "outputName": "Calça Jeans",
    "unitCost": 9,
    "quality": 68,
    "dailyCap": 350,
    "inputs": { "cotton_cloth": 1 },
    "desc": "Tecido de algodão denim com costuras duplas reforçadas."
  },
  {
    "id": "rec_tshirt",
    "name": "Confecção: Camisetas",
    "outputProdId": "t_shirt",
    "outputName": "Camiseta Básica",
    "unitCost": 4.8,
    "quality": 65,
    "dailyCap": 500,
    "inputs": { "cotton_cloth": 0.5 },
    "desc": "Algodão macio penteado com corte moderno unissex."
  },
  {
    "id": "rec_suit",
    "name": "Alfaiataria Executiva",
    "outputProdId": "business_suit",
    "outputName": "Terno Executivo",
    "unitCost": 45,
    "quality": 80,
    "dailyCap": 150,
    "inputs": { "wool_cloth": 1.5 },
    "desc": "Ternos de lã pura estruturados com forro acetinado."
  },
  {
    "id": "rec_sweater",
    "name": "Tear de Malhas & Lã",
    "outputProdId": "wool_sweater",
    "outputName": "Suéter de Lã",
    "unitCost": 14,
    "quality": 72,
    "dailyCap": 280,
    "inputs": { "wool_cloth": 1 },
    "desc": "Malharia de lã pesada com acabamento térmico confortável."
  },
  {
    "id": "rec_leather_jacket",
    "name": "Confecção de Couro",
    "outputProdId": "leather_jacket",
    "outputName": "Jaqueta de Couro",
    "unitCost": 38,
    "quality": 82,
    "dailyCap": 180,
    "inputs": { "leather": 1.5 },
    "desc": "Jaqueta de couro legítimo bovino com zíperes metálicos."
  },
  {
    "id": "rec_leather_shoes",
    "name": "Sapataria Clássica",
    "outputProdId": "leather_shoes",
    "outputName": "Sapatos de Couro",
    "unitCost": 19,
    "quality": 75,
    "dailyCap": 260,
    "inputs": { "leather": 1, "rubber": 0.5 },
    "desc": "Calçados sociais de couro com sola de borracha vulcanizada."
  },
  {
    "id": "rec_athletic_shoes",
    "name": "Fábrica de Calçados Esportivos",
    "outputProdId": "athletic_shoes",
    "outputName": "Tênis Esportivo",
    "unitCost": 16,
    "quality": 72,
    "dailyCap": 320,
    "inputs": { "cotton_cloth": 0.5, "rubber": 1, "plastic": 0.5 },
    "desc": "Amortecimento ergonômico com cabedal respirável em tecido."
  },
  {
    "id": "rec_leather_bag",
    "name": "Marcenaria & Bolsas de Couro",
    "outputProdId": "leather_bag",
    "outputName": "Bolsa Feminina",
    "unitCost": 26,
    "quality": 78,
    "dailyCap": 200,
    "inputs": { "leather": 1 },
    "desc": "Bolsas estruturadas de couro legítimo com ferragens nobres."
  },
  {
    "id": "rec_dress",
    "name": "Alta Costura & Vestidos",
    "outputProdId": "gala_dress",
    "outputName": "Vestido de Gala",
    "unitCost": 21,
    "quality": 75,
    "dailyCap": 220,
    "inputs": { "cotton_cloth": 1, "wool_cloth": 0.5 },
    "desc": "Tecidos acetinados para eventos sociais e alta moda."
  },
  {
    "id": "rec_underwear",
    "name": "Malharia Íntima",
    "outputProdId": "underwear",
    "outputName": "Roupas Íntimas",
    "unitCost": 3.2,
    "quality": 65,
    "dailyCap": 600,
    "inputs": { "cotton_cloth": 0.5 },
    "desc": "Moda íntima em algodão elástico antialérgico."
  },
  {
    "id": "rec_phone",
    "name": "Montagem de Smartphones",
    "outputProdId": "mobile_phone",
    "outputName": "Smartphone",
    "unitCost": 95,
    "quality": 75,
    "dailyCap": 200,
    "inputs": { "chips": 1, "glass": 0.5, "plastic": 0.5 },
    "desc": "Placas de silício com tela de vidro temperado e câmera 4K."
  },
  {
    "id": "rec_laptop",
    "name": "Montadora de Notebooks",
    "outputProdId": "laptop_pc",
    "outputName": "Notebook / Laptop",
    "unitCost": 180,
    "quality": 78,
    "dailyCap": 140,
    "inputs": { "chips": 2, "aluminum": 1, "glass": 0.5 },
    "desc": "Chassi de alumínio anodizado e processadores de alta performance."
  },
  {
    "id": "rec_desktop",
    "name": "Montagem de Computadores",
    "outputProdId": "desktop_pc",
    "outputName": "Computador Desktop",
    "unitCost": 150,
    "quality": 75,
    "dailyCap": 160,
    "inputs": { "chips": 2, "steel": 1, "plastic": 1 },
    "desc": "Gabinetes de aço ventilados para trabalho e games pesados."
  },
  {
    "id": "rec_tv",
    "name": "Fábrica de Painéis & Smart TVs",
    "outputProdId": "television",
    "outputName": "Smart TV 4K",
    "unitCost": 130,
    "quality": 76,
    "dailyCap": 180,
    "inputs": { "chips": 1, "glass": 1, "plastic": 1 },
    "desc": "Telas de vidro plano com tecnologia OLED e som surround."
  },
  {
    "id": "rec_camera",
    "name": "Óptica & Câmeras Digitais",
    "outputProdId": "digital_camera",
    "outputName": "Câmera Digital",
    "unitCost": 78,
    "quality": 78,
    "dailyCap": 160,
    "inputs": { "chips": 1, "glass": 0.5, "aluminum": 0.5 },
    "desc": "Sensores de alta definição acoplados a lentes de precisão."
  },
  {
    "id": "rec_console",
    "name": "Fábrica de Videogames",
    "outputProdId": "game_console",
    "outputName": "Console de Videogame",
    "unitCost": 90,
    "quality": 74,
    "dailyCap": 190,
    "inputs": { "chips": 2, "plastic": 1 },
    "desc": "Chips gráficos dedicados para jogos de última geração."
  },
  {
    "id": "rec_microwave",
    "name": "Linha Branca: Micro-ondas",
    "outputProdId": "microwave",
    "outputName": "Forno Micro-ondas",
    "unitCost": 38,
    "quality": 68,
    "dailyCap": 250,
    "inputs": { "steel": 1, "chips": 0.5 },
    "desc": "Estrutura em aço inox e circuito de aquecimento rápido."
  },
  {
    "id": "rec_refrigerator",
    "name": "Linha Branca: Geladeiras",
    "outputProdId": "refrigerator",
    "outputName": "Geladeira Duplex",
    "unitCost": 165,
    "quality": 75,
    "dailyCap": 130,
    "inputs": { "steel": 2, "chips": 0.5, "plastic": 1 },
    "desc": "Compressor silencioso de baixo consumo e gabinete de aço."
  },
  {
    "id": "rec_ac",
    "name": "Climatizadores & Ar-Condicionado",
    "outputProdId": "air_conditioner",
    "outputName": "Ar Condicionado",
    "unitCost": 125,
    "quality": 72,
    "dailyCap": 160,
    "inputs": { "aluminum": 1.5, "chips": 0.5 },
    "desc": "Condensadores de alumínio eficientes para climatização."
  },
  {
    "id": "rec_washing",
    "name": "Linha Branca: Lavadoras",
    "outputProdId": "washing_machine",
    "outputName": "Lavadora de Roupas",
    "unitCost": 140,
    "quality": 74,
    "dailyCap": 140,
    "inputs": { "steel": 2, "chips": 0.5, "plastic": 0.5 },
    "desc": "Tambores de aço inox com motorização de acionamento direto."
  },
  {
    "id": "rec_compact_car",
    "name": "Montadora: Carro Compacto",
    "outputProdId": "compact_car",
    "outputName": "Carro Compacto",
    "unitCost": 3200,
    "quality": 70,
    "dailyCap": 40,
    "inputs": { "engine": 1, "steel": 2, "tires": 1, "glass": 1 },
    "desc": "Carroceria de aço com motor econômico e pneus duráveis."
  },
  {
    "id": "rec_sedan_car",
    "name": "Montadora: Carro Sedan",
    "outputProdId": "sedan_car",
    "outputName": "Carro Sedan",
    "unitCost": 5100,
    "quality": 76,
    "dailyCap": 30,
    "inputs": { "engine": 1, "steel": 2.5, "tires": 1, "leather": 1 },
    "desc": "Sedan luxuoso com acabamento em couro e suspensão macia."
  },
  {
    "id": "rec_suv_car",
    "name": "Montadora: Veículo SUV",
    "outputProdId": "suv_car",
    "outputName": "Veículo SUV",
    "unitCost": 7400,
    "quality": 78,
    "dailyCap": 25,
    "inputs": { "engine": 1.5, "steel": 3, "tires": 1.5, "glass": 1 },
    "desc": "Tração 4x4 com amplo espaço interno e blindagem leve."
  },
  {
    "id": "rec_motorcycle",
    "name": "Fábrica de Motocicletas",
    "outputProdId": "motorcycle",
    "outputName": "Motocicleta",
    "unitCost": 1450,
    "quality": 70,
    "dailyCap": 60,
    "inputs": { "engine": 0.5, "steel": 1, "tires": 0.5 },
    "desc": "Quadro tubular leve e motor ágil para tráfego urbano."
  },
  {
    "id": "rec_heavy_truck",
    "name": "Fábrica de Caminhões Pesados",
    "outputProdId": "heavy_truck",
    "outputName": "Caminhão Pesado",
    "unitCost": 15500,
    "quality": 82,
    "dailyCap": 15,
    "inputs": { "engine": 2, "steel": 5, "tires": 2 },
    "desc": "Cavalo mecânico de grande torque para logística pesada."
  },
  {
    "id": "rec_cold_pills",
    "name": "Laboratório: Antigripais",
    "outputProdId": "cold_pills",
    "outputName": "Remédio para Gripe",
    "unitCost": 1.8,
    "quality": 80,
    "dailyCap": 500,
    "inputs": { "chemical_minerals": 1 },
    "desc": "Comprimidos revestidos para alívio rápido de sintomas."
  },
  {
    "id": "rec_pain_reliever",
    "name": "Laboratório: Analgésicos",
    "outputProdId": "pain_reliever",
    "outputName": "Analgésico",
    "unitCost": 1.5,
    "quality": 80,
    "dailyCap": 550,
    "inputs": { "chemical_minerals": 1 },
    "desc": "Analgésico e antitérmico de alta pureza química."
  },
  {
    "id": "rec_cough_syrup",
    "name": "Laboratório: Xaropes",
    "outputProdId": "cough_syrup",
    "outputName": "Xarope para Tosse",
    "unitCost": 2.2,
    "quality": 78,
    "dailyCap": 400,
    "inputs": { "chemical_minerals": 0.5, "refined_sugar": 0.5, "glass": 0.5 },
    "desc": "Frascos de vidro com xarope expectorante aromatizado."
  },
  {
    "id": "rec_shampoo",
    "name": "Cosméticos: Xampus",
    "outputProdId": "shampoo",
    "outputName": "Xampu",
    "unitCost": 1.2,
    "quality": 70,
    "dailyCap": 500,
    "inputs": { "chemical_minerals": 0.5, "plastic": 0.5 },
    "desc": "Fórmula com extratos botânicos e agentes condicionantes."
  },
  {
    "id": "rec_soap",
    "name": "Sabonetes & Higiene",
    "outputProdId": "soap",
    "outputName": "Sabonete Corporal",
    "unitCost": 0.7,
    "quality": 68,
    "dailyCap": 600,
    "inputs": { "chemical_minerals": 0.5 },
    "desc": "Barras de sabonete cremosas com óleos hidratantes."
  },
  {
    "id": "rec_toothpaste",
    "name": "Higiene Bucal: Creme Dental",
    "outputProdId": "toothpaste",
    "outputName": "Pasta de Dente",
    "unitCost": 0.85,
    "quality": 72,
    "dailyCap": 550,
    "inputs": { "chemical_minerals": 0.5, "plastic": 0.5 },
    "desc": "Gel dental com flúor e ação branqueadora prolongada."
  },
  {
    "id": "rec_perfume",
    "name": "Perfumaria Fina",
    "outputProdId": "luxury_perfume",
    "outputName": "Perfume de Luxo",
    "unitCost": 14,
    "quality": 85,
    "dailyCap": 180,
    "inputs": { "chemical_minerals": 1, "glass": 0.5 },
    "desc": "Frascos de cristal com essências nobres concentradas."
  },
  {
    "id": "rec_sunscreen",
    "name": "Dermocosméticos: Protetor Solar",
    "outputProdId": "sunscreen",
    "outputName": "Protetor Solar",
    "unitCost": 3.1,
    "quality": 76,
    "dailyCap": 320,
    "inputs": { "chemical_minerals": 1, "plastic": 0.5 },
    "desc": "Loção de amplo espectro UVA/UVB resistente à água."
  },
  {
    "id": "rec_bed",
    "name": "Marcenaria: Camas King Size",
    "outputProdId": "king_bed",
    "outputName": "Cama King Size",
    "unitCost": 95,
    "quality": 75,
    "dailyCap": 120,
    "inputs": { "lumber": 2, "cotton_cloth": 1 },
    "desc": "Estrutura em madeira nobre com estofamento ortopédico."
  },
  {
    "id": "rec_sofa",
    "name": "Estofados: Sofás Confort",
    "outputProdId": "sofa",
    "outputName": "Sofá Conforto",
    "unitCost": 120,
    "quality": 76,
    "dailyCap": 110,
    "inputs": { "lumber": 1.5, "leather": 1, "wool_cloth": 1 },
    "desc": "Molas ensacadas revestidas em couro ou tecido aveludado."
  },
  {
    "id": "rec_dining_table",
    "name": "Marcenaria: Mesas de Jantar",
    "outputProdId": "dining_table",
    "outputName": "Mesa de Jantar",
    "unitCost": 68,
    "quality": 72,
    "dailyCap": 140,
    "inputs": { "lumber": 2, "glass": 1 },
    "desc": "Tampo de vidro temperado e base em madeira maciça."
  },
  {
    "id": "rec_wardrobe",
    "name": "Marcenaria: Guarda-Roupas",
    "outputProdId": "wardrobe",
    "outputName": "Guarda-Roupa",
    "unitCost": 105,
    "quality": 74,
    "dailyCap": 100,
    "inputs": { "lumber": 2.5, "glass": 0.5 },
    "desc": "Portas de correr com espelhos e divisórias internas amplas."
  },
  {
    "id": "rec_office_chair",
    "name": "Mobiliário Corporativo: Cadeiras",
    "outputProdId": "office_chair",
    "outputName": "Cadeira Executiva",
    "unitCost": 32,
    "quality": 72,
    "dailyCap": 220,
    "inputs": { "lumber": 1, "steel": 0.5, "leather": 0.5 },
    "desc": "Ajuste pneumático de altura e suporte lombar ergonômico."
  },
  {
    "id": "rec_gold_watch",
    "name": "Alta Relojoaria: Ouro",
    "outputProdId": "gold_watch",
    "outputName": "Relógio de Ouro",
    "unitCost": 260,
    "quality": 88,
    "dailyCap": 60,
    "inputs": { "gold_ore": 1, "glass": 0.5 },
    "desc": "Mecanismo automático suíço em caixa de ouro maciço 18k."
  },
  {
    "id": "rec_gold_ring",
    "name": "Ourivesaria: Anéis 18k",
    "outputProdId": "gold_ring",
    "outputName": "Anel de Ouro 18k",
    "unitCost": 140,
    "quality": 85,
    "dailyCap": 100,
    "inputs": { "gold_ore": 0.5 },
    "desc": "Anéis de ouro polido com acabamento lapidado exclusivo."
  },
  {
    "id": "rec_gold_necklace",
    "name": "Ourivesaria: Colares",
    "outputProdId": "gold_necklace",
    "outputName": "Colar de Ouro",
    "unitCost": 250,
    "quality": 86,
    "dailyCap": 75,
    "inputs": { "gold_ore": 1 },
    "desc": "Corrente de elos finos em ouro puro com fecho de segurança."
  },
  {
    "id": "rec_paint",
    "name": "Fábrica de Tintas & Vernizes",
    "outputProdId": "acrylic_paint",
    "outputName": "Lata de Tinta Acrílica",
    "unitCost": 7.5,
    "quality": 68,
    "dailyCap": 380,
    "inputs": { "chemical_minerals": 1, "plastic": 0.5 },
    "desc": "Tinta acrílica lavável de alta cobertura para alvenaria."
  },
  {
    "id": "rec_tools",
    "name": "Metalúrgica de Ferramentas",
    "outputProdId": "tool_set",
    "outputName": "Jogo de Ferramentas",
    "unitCost": 13.5,
    "quality": 74,
    "dailyCap": 260,
    "inputs": { "steel": 1.5, "plastic": 0.5 },
    "desc": "Chaves e alicates de aço cromo-vanádio forjado."
  }
];

    const MEDIA_OUTLETS = [
      { id:'media_tv', name:'Rede Capital TV', type:'Televisão', emoji:'📺', tile:{x:14,y:8}, district:'uptown', monthlyCost:2500.00, institutionalMonthlyCost:3500.00, brandBoostMonthly:15, brandCap:95, reachPct:100, reachDescription:'Toda a Região Metropolitana (100% da População)' },
      { id:'media_radio', name:'Rádio Central FM 104.5', type:'Rádio', emoji:'📻', tile:{x:17,y:13}, district:'downtown', monthlyCost:850.00, institutionalMonthlyCost:1200.00, brandBoostMonthly:8, brandCap:75, reachPct:65, reachDescription:'Downtown, Cais e Polos Comerciais Centrais' },
      { id:'media_news', name:'Jornal da Metrópole', type:'Jornal', emoji:'📰', tile:{x:23,y:14}, district:'northside', monthlyCost:350.00, institutionalMonthlyCost:450.00, brandBoostMonthly:4, brandCap:60, reachPct:45, reachDescription:'Distrito Residencial Norte e Subúrbios' }
    ];

    const PORT_SUPPLIES_FOOD_CONSUMER = {
      'bread': { wholesalePrice: 1.75, quality: 52, quota: 400, origin: 'Importação Panificação' },
      'milk': { wholesalePrice: 1.40, quality: 52, quota: 400, origin: 'Importação Laticínios' },
      'eggs': { wholesalePrice: 1.20, quality: 50, quota: 450, origin: 'Importação Granja' },
      'cola': { wholesalePrice: 1.50, quality: 50, quota: 450, origin: 'Importação Bebidas' },
      'mineral_water': { wholesalePrice: 0.80, quality: 55, quota: 500, origin: 'Importação Bebidas' },
      'canned_soup': { wholesalePrice: 2.10, quality: 52, quota: 350, origin: 'Importação Conservas' },
      'soap': { wholesalePrice: 1.40, quality: 50, quota: 400, origin: 'Importação Higiene' },
      'shampoo': { wholesalePrice: 2.40, quality: 52, quota: 300, origin: 'Importação Higiene' },
      'cold_pills': { wholesalePrice: 3.50, quality: 52, quota: 300, origin: 'Importação Farmácia' },
      'tshirt': { wholesalePrice: 14.00, quality: 50, quota: 250, origin: 'Importação Vestuário' },
      'jeans': { wholesalePrice: 24.00, quality: 50, quota: 200, origin: 'Importação Vestuário' },
      'sneakers': { wholesalePrice: 35.00, quality: 52, quota: 180, origin: 'Importação Calçados' },
      'beef': { wholesalePrice: 5.50, quality: 52, quota: 300, origin: 'Importação Carnes' },
      'poultry_meat': { wholesalePrice: 3.20, quality: 50, quota: 350, origin: 'Importação Carnes' },
      'pork_meat': { wholesalePrice: 4.20, quality: 50, quota: 300, origin: 'Importação Carnes' },
      'chocolate': { wholesalePrice: 2.50, quality: 52, quota: 300, origin: 'Importação Doces' },
      'coffee': { wholesalePrice: 3.00, quality: 55, quota: 300, origin: 'Importação Cafeteria' }
    };

    const PORT_SUPPLIES_COMMODITIES = {
      'wheat': { wholesalePrice: 1.10, quality: 50, quota: 500, origin: 'Importação Grãos' },
      'corn': { wholesalePrice: 1.00, quality: 50, quota: 500, origin: 'Importação Grãos' },
      'sugar_cane': { wholesalePrice: 0.80, quality: 50, quota: 600, origin: 'Importação Açúcar' },
      'coffee_beans': { wholesalePrice: 2.20, quality: 55, quota: 350, origin: 'Importação Café' },
      'iron_ore': { wholesalePrice: 24.00, quality: 52, quota: 400, origin: 'Importação Minérios' },
      'bauxite': { wholesalePrice: 28.00, quality: 52, quota: 350, origin: 'Importação Minérios' },
      'silica': { wholesalePrice: 14.00, quality: 50, quota: 450, origin: 'Importação Minérios' },
      'timber': { wholesalePrice: 18.00, quality: 50, quota: 400, origin: 'Importação Madeira' },
      'crude_oil': { wholesalePrice: 38.00, quality: 55, quota: 450, origin: 'Importação Petróleo' },
      'chemical_minerals': { wholesalePrice: 22.00, quality: 52, quota: 400, origin: 'Importação Químicos' },
      'rubber': { wholesalePrice: 20.00, quality: 50, quota: 350, origin: 'Importação Borracha' },
      'cotton': { wholesalePrice: 2.40, quality: 50, quota: 400, origin: 'Importação Têxtil' }
    };

    const PORT_SUPPLIES_TECH_PARTS = {
      'chips': { wholesalePrice: 85.00, quality: 56, quota: 200, origin: 'Importação Semicondutores' },
      'plastic': { wholesalePrice: 7.50, quality: 52, quota: 400, origin: 'Importação Insumos' },
      'glass': { wholesalePrice: 6.80, quality: 52, quota: 400, origin: 'Importação Insumos' },
      'steel': { wholesalePrice: 32.00, quality: 54, quota: 300, origin: 'Importação Siderurgia' },
      'aluminum': { wholesalePrice: 36.00, quality: 54, quota: 300, origin: 'Importação Metalurgia' },
      'tires': { wholesalePrice: 38.00, quality: 52, quota: 250, origin: 'Importação Autopeças' },
      'tool_set': { wholesalePrice: 28.00, quality: 54, quota: 220, origin: 'Importação Ferramentas' },
      'mobile_phone': { wholesalePrice: 220.00, quality: 55, quota: 150, origin: 'Importação Eletrônicos' },
      'acrylic_paint': { wholesalePrice: 16.00, quality: 52, quota: 250, origin: 'Importação Tintas' }
    };

    const SEAPORTS = [
      {
        id: 'port_alpha',
        name: 'Porto Alfa (Terminal de Alimentos & Consumo)',
        tile: { x: 6, y: 6 },
        freightRatePerTile: 0.012,
        supplies: PORT_SUPPLIES_FOOD_CONSUMER
      },
      {
        id: 'port_beta',
        name: 'Porto Beta (Terminal de Commodities & Indústria)',
        tile: { x: 7, y: 5 },
        freightRatePerTile: 0.018,
        supplies: PORT_SUPPLIES_COMMODITIES
      }
    ];

    // ===========================================================================
    // CATÁLOGO DE CATEGORIAS DE P&D (Pesquisa & Desenvolvimento)
    // Custo base mensal mínimo por categoria, fiel à curva de custos do Capitalism II.
    // ===========================================================================
    const RD_CATEGORIES = {
      "Alimentos":   { baseCost: 2000,  icon: "🌾", label: "Alimentos & Bebidas" },
      "Bebidas":     { baseCost: 2500,  icon: "🍺", label: "Bebidas & Laticínios" },
      "Vestuário":   { baseCost: 3500,  icon: "👗", label: "Moda & Têxtil" },
      "Farmácia":    { baseCost: 4000,  icon: "💊", label: "Farmácia & Saúde" },
      "Higiene":     { baseCost: 3000,  icon: "🧴", label: "Higiene & Cuidados" },
      "Cosméticos":  { baseCost: 3500,  icon: "💄", label: "Cosméticos & Perfumaria" },
      "Eletrônicos": { baseCost: 12000, icon: "💻", label: "Eletrônicos & Tecnologia" },
      "Automotivo":  { baseCost: 20000, icon: "🚗", label: "Automotivo & Motores" },
      "Móveis":      { baseCost: 5000,  icon: "🛋️", label: "Móveis & Decoração" },
      "Joias":       { baseCost: 8000,  icon: "💍", label: "Joias & Luxo" },
      "Construção":  { baseCost: 6000,  icon: "🔨", label: "Construção & Ferramentas" },
    };

    // Auto-popula rdBaseCost em cada produto do catálogo a partir da categoria
    (function populateRDBaseCosts() {
      for (const prod of Object.values(PRODUCT_CATALOG)) {
        if (!prod.rdBaseCost) {
          const cat = RD_CATEGORIES[prod.category];
          prod.rdBaseCost = cat ? cat.baseCost : 3000;
        }
      }
    })();

    // Grafo de Receitas Indexado por ID de Saída para busca O(1)
    const RECIPE_GRAPH = {};
    for (const rec of FACTORY_RECIPES) {
      if (rec.outputProdId) {
        RECIPE_GRAPH[rec.outputProdId] = rec;
      }
      RECIPE_GRAPH[rec.id] = rec;
    }

    // Exportação universal (Node.js & Navegador)
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = {
        CITY_DISTRICTS,
        STORE_TYPES,
        STORE_CATEGORY_WHITELIST,
        NATURAL_MINES,
        FARM_TYPES,
        PRODUCT_CATALOG,
        FACTORY_RECIPES,
        RECIPE_GRAPH,
        MEDIA_OUTLETS,
        SEAPORTS,
        PORT_SUPPLIES_FOOD_CONSUMER,
        PORT_SUPPLIES_COMMODITIES,
        PORT_SUPPLIES_TECH_PARTS,
        RD_CATEGORIES
      };
    }
    if (typeof window !== 'undefined') {
      window.RECIPE_GRAPH = RECIPE_GRAPH;
      window.STORE_CATEGORY_WHITELIST = STORE_CATEGORY_WHITELIST;
      window.PORT_SUPPLIES_FOOD_CONSUMER = PORT_SUPPLIES_FOOD_CONSUMER;
      window.PORT_SUPPLIES_COMMODITIES = PORT_SUPPLIES_COMMODITIES;
      window.PORT_SUPPLIES_TECH_PARTS = PORT_SUPPLIES_TECH_PARTS;
    }
