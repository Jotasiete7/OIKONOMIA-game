# Guia de Assets de Áudio — OIKONOMIA

> ⚠️ **REGRA MANDATÓRIA DE DESENVOLVIMENTO:**  
> **Nunca commitar `.wav` não comprimido neste repositório.**  
> Todo áudio deve ser convertido para `.mp3` (**128 kbps** para música/ambiente, **96 kbps** para efeitos curtos) antes do commit.  
> Nomes de arquivo obrigatoriamente em **`kebab-case`**, sem espaço, sem parênteses e sem caracteres especiais.

---

Este diretório contém a estrutura oficial e normalizada de áudio do **OIKONOMIA**.
O motor de som (`client/audio.js`) gerencia a reprodução de forma assíncrona, leve e com **fallback automático** (se um arquivo de som não existir, o sintetizador procedural interno entra em ação sem travar o jogo).

---

## 1. Estrutura Atual de Pastas e Arquivos

```
client/assets/audio/
├── bgm/                                # Músicas de Fundo (128 kbps CBR/VBR)
│   ├── bgm-01.mp3                      # Tema Corporativo 1 / Lounge Menu
│   ├── bgm-02.mp3                      # Foco & Planejamento Estratégico
│   ├── bgm-03.mp3                      # Manhã Produtiva
│   ├── bgm-04.mp3                      # Prosperidade / Boom Econômico
│   ├── bgm-05.mp3                      # Estratégia de Mercado
│   ├── bgm-06.mp3                      # Tensão & Negócios / Crise
│   └── bgm-07.mp3                      # Visão Global
│
├── ambience/                           # Paisagens Sonoras Contínuas (128 kbps)
│   └── ambience-low-traffic.mp3        # Tráfego urbano moderado (seamless loop)
│
├── sfx/                                # Efeitos Sonoros Pontuais (96 kbps)
│   ├── apreensivo-blues-sfx.mp3        # Alerta de recessão ou queda de mercado
│   ├── building/
│   │   ├── demolish.mp3                # Demolição de lote
│   │   ├── hammer1.mp3                 # Construção de fábrica/fazenda/mina
│   │   └── upgrade.mp3                 # Melhoria ou expansão de filial
│   ├── economy/
│   │   ├── cash-register-low.mp3       # Caixa registradora / vendas no balcão
│   │   ├── coin-clink.mp3              # Tilintar de moedas / pequenas operações
│   │   └── loan-payout.mp3             # Concessão de crédito bancário
│   ├── events/
│   │   ├── great-win.mp3               # Conquista extraordinária / marco histórico
│   │   ├── news-flash.mp3              # Notícia urgente no Ticker corporativo
│   │   ├── warning-alert.mp3           # Alerta de risco / estoque zerado
│   │   ├── win-01.mp3                  # Conquista de meta / vitória
│   │   └── win-02.mp3                  # Conquista de meta alternativa
│   └── ui/
│       ├── click.mp3                   # Clique seco de botões e abas
│       ├── modal-open.mp3              # Abertura suave de janelas e relatórios
│       └── stamp-contract.mp3          # Carimbo de contrato ou homologação
└── README.md
```

---

## 2. Padrões de Compressão com FFmpeg

Para converter novos arquivos de som antes de adicioná-los:

```bash
# Música de fundo (BGM) e ambiente (128 kbps)
ffmpeg -i "origem.wav" -b:a 128k "client/assets/audio/bgm/bgm-xx.mp3"

# Efeitos sonoros curtos (SFX) (96 kbps)
ffmpeg -i "origem.wav" -b:a 96k "client/assets/audio/sfx/categoria/nome-do-efeito.mp3"
```

---

## 3. Fontes Recomendadas de Áudio CC0 / Royalty-Free

1. **[Kenney.nl](https://kenney.nl/assets/category:Audio):** Pacotes completos sob licença **CC0 (Domínio Público)** de interface (*UI Audio*), efeitos digitais e ambientes.
2. **[Freesound.org](https://freesound.org/):** Filtre por sons com licença *Creative Commons 0* para ruídos de tráfego, fábricas, portos e sinos de caixa registradora.
3. **[Pixabay Music](https://pixabay.com/music/):** Trilhas instrumentais livres para uso comercial (gêneros *lo-fi chill, corporate jazz, ambient acoustic*).

---

## 4. Como o Jogo Consome os Áudios

Todas as chamadas no código são feitas através do singleton `SoundEngine`:
- `SoundEngine.playBgm('bgm_1')`
- `SoundEngine.playAmbience('city')`
- `SoundEngine.playClick()`
- `SoundEngine.playBuild()`
- `SoundEngine.playDemolish()`
- `SoundEngine.playCashRegister()`
- `SoundEngine.setMasterVolume(0.8)`
- `SoundEngine.setBgmVolume(0.5)`
- `SoundEngine.setAmbienceVolume(0.4)`
- `SoundEngine.setSfxVolume(0.7)`
