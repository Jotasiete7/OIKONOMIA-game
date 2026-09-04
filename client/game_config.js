/**
 * game_config.js — Catálogos de Configuração Estática & UI
 * OIKONOMIA v0.8.3
 */

// Catálogo dos 24 Avatares Oficiais (6 Executivos, 6 Especialistas Industriais, 6 Animais de Mercado, 6 Robôs & IA)
export const AVATAR_CATALOG = [
  // 1. Executivos & Magnatas
  { id: 'human_ceo',     category: 'Executivos',  name: 'Executivo Magnata',     emoji: '👨‍💼', desc: 'Estrategista corporativo e fusões.' },
  { id: 'human_banker',  category: 'Executivos',  name: 'Banqueira Financeira',  emoji: '👩‍💼', desc: 'Gestão de liquidez e expansão de crédito.' },
  { id: 'human_tycoon',  category: 'Executivos',  name: 'Investidor Anjo',       emoji: '🤵',   desc: 'Aporte de risco e venture capital.' },
  { id: 'human_diplomat',category: 'Executivos',  name: 'Negociadora Global',    emoji: '🧕',   desc: 'Relações comerciais e portos abertos.' },
  { id: 'human_elder',   category: 'Executivos',  name: 'Conselheiro Patriarca', emoji: '👴',   desc: 'Tradição industrial e governança sólida.' },
  { id: 'human_heiress', category: 'Executivos',  name: 'Herdeira Visionária',   emoji: '👑',   desc: 'Reestruturação ágil e marketing agressivo.' },

  // 2. Especialistas da Indústria & Ciência
  { id: 'human_tech',    category: 'Indústria',   name: 'Diretora de Inovação',  emoji: '👩‍🔬', desc: 'P&D industrial e chips de alta densidade.' },
  { id: 'human_miner',   category: 'Indústria',   name: 'Barão da Mineração',    emoji: '👷‍♂️', desc: 'Extração pesada de recursos e minérios.' },
  { id: 'human_farmer',  category: 'Indústria',   name: 'Mestre do Agronegócio', emoji: '🧑‍🌾', desc: 'Produtividade de safras e silos graneleiros.' },
  { id: 'human_captain', category: 'Indústria',   name: 'Capitão Mercante',      emoji: '🧑‍✈️', desc: 'Rotas ultramarinas e comércio de cabotagem.' },
  { id: 'human_architect',category: 'Indústria',  name: 'Arquiteta Urbana',      emoji: '👷‍♀️', desc: 'Otimização de tráfego e zoneamento.' },
  { id: 'human_chemist', category: 'Indústria',   name: 'Químico Industrial',    emoji: '🧑‍🔬', desc: 'Refino petroquímico e novos materiais.' },
  
  // 3. Animais de Mercado (Wall Street & Estratégia)
  { id: 'animal_fox',    category: 'Estratégia',  name: 'Raposa Estrategista',   emoji: '🦊', desc: 'Faro apurado para margens e arbitragem.' },
  { id: 'animal_wolf',   category: 'Estratégia',  name: 'Lobo de Negócios',      emoji: '🐺', desc: 'Agressividade comercial e market share.' },
  { id: 'animal_owl',    category: 'Estratégia',  name: 'Coruja Analista',       emoji: '🦉', desc: 'Auditoria de custos e eficiência contábil.' },
  { id: 'animal_bull',   category: 'Estratégia',  name: 'Touro Trader',          emoji: '🐂', desc: 'Crescimento implacável e escala fabril.' },
  { id: 'animal_bear',   category: 'Estratégia',  name: 'Urso Acumulador',       emoji: '🐻', desc: 'Reserva de liquidez em ciclos de crise.' },
  { id: 'animal_eagle',  category: 'Estratégia',  name: 'Águia da Logística',    emoji: '🦅', desc: 'Visão panorâmica de fretes e abastecimento.' },

  // 4. Robôs & Cyberpunk
  { id: 'robot_alpha',   category: 'Robôs & IA',  name: 'Androide Alpha-9',      emoji: '🤖', desc: 'Logística autônoma e roteamento de frotas.' },
  { id: 'robot_drone',   category: 'Robôs & IA',  name: 'Drone Logístico',       emoji: '🛸', desc: 'Distribuição ultrarrápida de ponta a ponta.' },
  { id: 'robot_core',    category: 'Robôs & IA',  name: 'IA Oiko-Core',          emoji: '🧠', desc: 'Previsão de demanda macroeconômica.' },
  { id: 'robot_mecha',   category: 'Robôs & IA',  name: 'Mecha Industrial',      emoji: '🦾', desc: 'Automação pesada e manufatura 24/7.' },
  { id: 'robot_cyber',   category: 'Robôs & IA',  name: 'Cyborg Operador',      emoji: '🦿', desc: 'Manutenção preditiva de plantas fabris.' },
  { id: 'robot_satellite',category: 'Robôs & IA', name: 'Satélite de Telemetria',emoji: '🛰️', desc: 'Monitoramento global de consumo e preços.' }
];

// Paletas de Cores Corporativas
export const COLOR_PALETTES = [
  { id: 'emerald', name: 'Esmeralda', hex: '#10b981', borderClass: 'border-emerald-500', bgClass: 'bg-emerald-500', textClass: 'text-emerald-400' },
  { id: 'sky',     name: 'Safira',    hex: '#0284c7', borderClass: 'border-sky-500',     bgClass: 'bg-sky-500',     textClass: 'text-sky-400' },
  { id: 'amber',   name: 'Dourado',   hex: '#f59e0b', borderClass: 'border-amber-500',   bgClass: 'bg-amber-500',   textClass: 'text-amber-400' },
  { id: 'purple',  name: 'Cyberpunk', hex: '#a855f7', borderClass: 'border-purple-500',  bgClass: 'bg-purple-500',  textClass: 'text-purple-400' },
  { id: 'rose',    name: 'Carmim',    hex: '#f43f5e', borderClass: 'border-rose-500',    bgClass: 'bg-rose-500',    textClass: 'text-rose-400' },
  { id: 'cyan',    name: 'Titânio',   hex: '#06b6d4', borderClass: 'border-cyan-500',    bgClass: 'bg-cyan-500',    textClass: 'text-cyan-400' }
];

// Predefinições de Dificuldade (Balanceamento Estilo Capitalism Lab)
export const DIFFICULTY_PRESETS = [
  { id: 'easy',     name: '🌱 Empreendedor',   startingCash: 120000, desc: 'Aporte de $120k. Expansão acelerada e margem de segurança.' },
  { id: 'standard', name: '🏛️ Magnata Padrão', startingCash: 50000,  desc: 'Aporte de $50k. Desafio equilibrado: comece no varejo e expanda com cautela.' },
  { id: 'hard',     name: '⚡ Hardcore',       startingCash: 20000,  desc: 'Aporte de $20k. Capital reduzido, disciplina rígida e margem de erro zero.' }
];

// Dicas Estratégicas para o Loading
export const ECONOMIC_TIPS = [
  "💡 Terrenos no Downtown (Centro) têm aluguel diário maior, mas tráfego massivo para produtos de alto giro.",
  "💡 A integração vertical (Minas/Fazendas ➔ Fábricas ➔ Lojas) elimina intermediários e maximiza a rentabilidade.",
  "💡 Produtos de primeira necessidade (Pão, Leite, Ovos) possuem demanda contínua mesmo durante flutuações.",
  "💡 Contratar campanhas de publicidade na TV e Rádio expande seu Brand Rating em toda a região metropolitana.",
  "💡 Portos Marítimos oferecem insumos internacionais com custo de frete baseado na distância até seu lote.",
  "💡 Acompanhe periodicamente a DRE consolidada para garantir que suas receitas superem custos fixos e aluguéis.",
  "💡 Desbloqueie Montargis ao atingir $500k de patrimônio e Várzea ao inaugurar sua primeira Fazenda em operação.",
  "💡 O atalho ESPAÇO pausa e acelera a passagem do tempo. ESC fecha janelas ativas ou abre o Menu de Pausa.",
  "💡 Salve seus jogos regularmente no navegador ou exporte arquivos .oiko para manter backups no computador.",
  "💡 Vender ou demolir instalações deficitárias recupera parte do capital investido e zera despesas diárias de solo."
];
