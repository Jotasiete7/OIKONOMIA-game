# Guia de Assets de Áudio — OIKONOMIA

Este diretório contém a estrutura oficial de áudio do **OIKONOMIA**.
O motor de som (`client/audio.js`) gerencia a reprodução de forma assíncrona, leve e com **fallback automático** (se um arquivo de som não existir, o sintetizador procedural interno entra em ação sem travar o jogo).

---

## 1. Estrutura de Pastas

```
client/assets/audio/
├── bgm/                       # Músicas de Fundo (Background Music)
│   ├── oiko_menu_theme.mp3     # Música do Menu Principal / Novo Jogo
│   ├── oiko_daytime_01.mp3     # Trilha corporativa suave / planejamento 1
│   ├── oiko_daytime_02.mp3     # Trilha corporativa suave / planejamento 2
│   ├── oiko_crisis_market.mp3  # Trilha tensa (queda de mercado / recessão)
│   └── oiko_prosperity.mp3     # Trilha triunfante (boom econômico / lucro recorde)
│
├── ambience/                  # Paisagens Sonoras Contínuas (Seamless Loops)
│   ├── city_traffic_loop.mp3   # Zumbido urbano de fundo geral (tráfego distante)
│   ├── commercial_hub_loop.mp3 # Burburinho de compras e pedestres
│   ├── industrial_zone_loop.mp3# Maquinário, engrenagens e chaminés industriais
│   ├── rural_farm_loop.mp3     # Vento no campo, pássaros, pastos
│   └── seaport_loop.mp3        # Água, gaivotas e cargueiro portuário
│
├── sfx/                       # Efeitos Sonoros Pontuais (One-shots)
│   ├── ui/
│   │   ├── click.wav           # Clique de botões e abas
│   │   ├── modal_open.wav      # Abertura de janelas e relatórios
│   │   └── stamp_contract.wav  # Assinatura de contrato ou licença
│   ├── economy/
│   │   ├── cash_register.wav   # Caixa registradora / vendas / lucros
│   │   ├── coin_clink.wav      # Movimentação financeira / moeda
│   │   └── loan_payout.wav     # Empréstimo concedido / grande aporte
│   ├── building/
│   │   ├── construct.wav       # Nova construção no mapa
│   │   ├── demolish.wav        # Demolição de lote
│   │   └── upgrade.wav         # Upgrade de filial
│   └── events/
│       ├── celebration.wav     # Fechamento anual positivo / meta batida
│       ├── news_flash.wav      # Notícia urgente no Ticker corporativo
│       └── warning_alert.wav   # Alerta de perigo / estoque zerado
└── README.md
```

---

## 2. Especificações Técnicas dos Arquivos

### A. Músicas de Fundo (BGM)
- **Formatos Aceitos:** `.mp3` (recomendado pela ampla compatibilidade) ou `.ogg`.
- **Taxa de Amostragem (Sample Rate):** 44.1 kHz.
- **Taxa de Bits (Bitrate):** 128 kbps a 192 kbps (CBR ou VBR suave).
- **Canais:** Estéreo.
- **Mixagem:** Volumes nivelados entre `-14 LUFS` e `-18 LUFS` para manter o foco na jogabilidade estratégica sem fadiga auditiva.
- **Tamanho Estimado:** 1.5MB a 3.5MB por faixa.

### B. Paisagens Sonoras (Ambience Loops)
- **Formatos:** `.mp3` ou `.ogg`.
- **Taxa de Amostragem:** 44.1 kHz.
- **Taxa de Bits:** 96 kbps a 128 kbps.
- **Duração:** 30 a 90 segundos.
- **Regra Crucial:** **Seamless Looping**. A transição entre o início e o fim da faixa deve conter corte em ponto zero (*zero-crossing*) ou crossfade de 1 a 2 segundos para evitar estalos (*clicks*) ao reiniciar o loop.

### C. Efeitos Sonoros (SFX)
- **Formatos:** `.wav` (PCM 16-bit 44.1 kHz) ou `.mp3` (128 kbps).
- **Duração:** Entre 0.05s e 1.5s.
- **Latência / Transiente:** Sem espaço em silêncio no início do áudio. O som deve disparar no milissegundo 0.

---

## 3. Fontes Recomendadas de Áudio CC0 / Royalty-Free

Para compor a biblioteca de som sem problemas de licenciamento:
1. **[Kenney.nl](https://kenney.nl/assets/category:Audio):** Pacotes completos sob licença **CC0 (Domínio Público)** de interface (*UI Audio*), efeitos digitais e ambientes.
2. **[Freesound.org](https://freesound.org/):** Filtre por sons com licença *Creative Commons 0* para ruídos de tráfego, fábricas, portos e sinos de caixa registradora.
3. **[Pixabay Music](https://pixabay.com/music/):** Trilhas instrumentais livres para uso comercial (gêneros *lo-fi chill, corporate jazz, ambient acoustic*).

---

## 4. Como o Jogo Consome os Áudios

Todas as chamadas no código são feitas através do singleton `SoundEngine`:
- `SoundEngine.playBgm('oiko_daytime_01')`
- `SoundEngine.playAmbience('city_traffic_loop')`
- `SoundEngine.playSfx('economy/cash_register')` (ou `SoundEngine.playCashRegister()`)
- `SoundEngine.setMasterVolume(0.8)`
- `SoundEngine.setBgmVolume(0.5)`
- `SoundEngine.setAmbienceVolume(0.4)`
- `SoundEngine.setSfxVolume(0.7)`
