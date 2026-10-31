# Piano Tutor AI

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B%20Modules-f7df1e.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-API-630ed4.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Google Gemini API](https://img.shields.io/badge/AI-Google%20Gemini%20(Default)-4285F4.svg)](https://ai.google.dev/)
[![Azure OpenAI](https://img.shields.io/badge/AI-Azure%20OpenAI-0078D4.svg)](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
[![Firebase Hosting](https://img.shields.io/badge/Deploy-Firebase%20Hosting-ffca28.svg)](https://firebase.google.com/docs/hosting)

> Plataforma web interativa para ensino musical, combinando síntese sonora em tempo real via **Web Audio API** com tutoria conversacional orientada por **Inteligência Artificial Generativa** (suporte nativo e independente a **Google Gemini** como provedor padrão e **Azure OpenAI**).

---

## 1. Visão Geral do Projeto

O **Piano Tutor AI** é uma aplicação web de página única (*Single Page Application* - SPA), responsiva e leve, desenvolvida para fornecer instrução musical autoguiada e acessível. A aplicação unifica a teoria musical e a prática instrumental em um único espaço de trabalho interativo: de um lado, um tutor de IA didático e acolhedor; do outro, um teclado virtual cromático totalmente funcional com síntese nativa de som no navegador.

O usuário pode formular perguntas teóricas sobre notas, escalas e acordes e, simultaneamente, exercitar a percepção sonora e o dedilhado no teclado virtual via cliques de mouse ou atalhos ergonômicos no teclado do computador, sem a necessidade de plugins de terceiros ou backends complexos.

A aplicação está estruturada para deploy estático na pasta `public/`, integrada com o **Firebase Hosting** e configurada para inicialização ágil em qualquer servidor web estático.

---

## 2. Objetivos da Aplicação

- **Democratização do Ensino Musical:** Disponibilizar instrução musical de piano gratuita, didática e de fácil acesso diretamente no navegador.
- **Integração entre Teoria e Prática:** Permitir que o estudante leia as instruções do tutor e teste os intervalos e afinações no piano simultaneamente na mesma tela.
- **Arquitetura Multi-Provedor com Gemini Padrão:** Oferecer flexibilidade total na escolha do modelo de inteligência artificial, utilizando a API oficial do **Google Gemini** por padrão e permitindo alternância instantânea para o **Azure OpenAI**.
- **Gerenciamento Seguro e Hierárquico de Credenciais:** Desacoplar credenciais de API do código-fonte através de uma hierarquia de três níveis (`localStorage` > `env.json` > Modal Manual).
- **Zero Dependências Pesadas:** Garantir alta performance e fidelidade visual utilizando apenas padrões web nativos (HTML5 semântico, CSS3 com variáveis e JavaScript modular ES6+).

---

## 3. Principais Funcionalidades

### 🎹 Piano Virtual Interativo
- **Escala Cromática Completa (1 Oitava):** Cobre de Dó central ($C_4$ / $261.63\text{ Hz}$) a Dó agudo ($C_5$ / $523.25\text{ Hz}$), abrangendo 7 teclas brancas diatônicas e 5 teclas pretas com acidentes sustenidos/bemóis.
- **Afinação Precisa:** Frequências calibradas no padrão de afinação de concerto ($A_4 = 440\text{ Hz}$).
- **Mapeamento de Teclado PC (QWERTY):** Posicionamento ergonômico na linha principal do teclado do computador (`A`, `S`, `D`, `F`, `G`, `H`, `J` para notas naturais e `W`, `E`, `T`, `Y`, `U` para acidentes).
- **Leitura em Tempo Real:** Indicação instantânea da nota tocada, exibindo nome e notação de cifras (ex: `Dó (C)`, `Sol sustenido (G#)`).
- **Execução Automática da Escala de Dó:** Botão dedicado que reproduz sequencialmente as 8 notas da escala de Dó Maior com intervalos temporizados de $420\text{ ms}$.

### 🤖 Tutor Musical com IA (Google Gemini e Azure OpenAI)
- **Persona Didática:** Tutor especializado em acolher iniciantes, explicando conceitos musicais de forma clara, encorajadora e concisa.
- **Provedor Padrão — Google Gemini:** Integração direta com a API REST oficial (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`).
- **Provedor Alternativo — Azure OpenAI:** Suporte mantido para implantações Azure OpenAI Responses API e chat completions compatíveis.
- **Histórico Conversacional Contextualizado:** Preserva o histórico de perguntas e respostas anteriores, adaptando o formato de dados dinamicamente entre as APIs (`user`/`model` no Gemini vs. `user`/`assistant` no Azure).
- **Sugestões e Respostas Rápidas:** Pílulas de prompts comuns na página inicial e no chat para acelerar dúvidas frequentes (acordes, escalas, teoria).

### ⚙️ Modal de Configurações Multi-Provedor
- **Seletor de Provedor em Tempo Real:** Alternância com um clique entre Google Gemini e Azure OpenAI, atualizando imediatamente o comportamento do chat sem recarregar a página.
- **Abas Independentes:** Duas abas dedicadas (**Google Gemini** e **Azure OpenAI**) com validação isolada, impedindo que os dados de um provedor sobrescrevam os do outro.
- **Endpoint Gerenciado para Gemini:** A URL oficial da API do Google é construída automaticamente com base no modelo selecionado, sem exigir digitação de endpoints complexos pelo usuário.
- **Visibilidade de Senha:** Botões de alternância (*reveal/hide*) para inspeção segura das API Keys digitadas.
- **Indicador de Fonte Ativa:** Notificação dinâmica indicando a origem das configurações em uso (`localStorage`, `env.json` ou pendente).

### 🖥️ Modos de Visualização do Estúdio (Studio View Modes)
- **Chat + Piano (`both`):** Layout dividido em duas colunas para estudo assistido e prática simultânea.
- **Só Chat (`chat`):** Modo focado para leitura aprofundada de explicações teóricas.
- **Só Piano (`piano`):** Modo expandido com teclado em dimensões ampliadas para prática instrumental.

---

## 4. Tecnologias Utilizadas

### Core da Aplicação
- **HTML5:** Estrutura semântica, formulários acessíveis, teclado virtual com semântica de botões e tags `<kbd>` para atalhos.
- **CSS3 Moderno:** Variáveis CSS customizadas (design tokens), Flexbox, CSS Grid layouts, glassmorphism (`backdrop-filter: blur`), animações keyframes (`fadeIn`, `slideUp`) e regras responsivas para desktop, tablet e mobile.
- **JavaScript (ES6+ Modules):** Arquitetura orientada a módulos nativos (`import`/`export`), sem necessidade de bundlers ou transpiladores como Webpack ou Vite.
- **Web Audio API:** Síntese sonora procedural de baixa latência em tempo real:
  - `AudioContext`: Gerenciador do ciclo de vida e estado do áudio no navegador.
  - `OscillatorNode`: Geração de ondas sonoras no formato `triangle` para um timbre aveludado próximo a instrumentos acústicos.
  - `GainNode`: Modelagem dinâmica de envelope acústico (ataque ultrarrápido de $15\text{ ms}$ até $0.22$ de ganho e decaimento exponencial de $850\text{ ms}$ até $0.0001$).

### Tipografia e Ícones
- **Google Fonts:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (pesos 400, 500, 600, 700).
- **Google Fonts Icons:** [Material Symbols Outlined](https://fonts.google.com/icons) para sinalização visual contextual.

### Serviços de Inteligência Artificial
- **Google Generative Language API (REST v1beta):** Endpoint oficial `generateContent` com autenticação via cabeçalho `x-goog-api-key` e query parameter, instruções de sistema (`system_instruction`) e estruturação de mensagens em `contents`.
- **Azure OpenAI Service / OpenAI Compatible:** Endpoints de chat completions com autorização via cabeçalho `Bearer` e payload estruturado.

### Infraestrutura de Hospedagem
- **Firebase Hosting:** Arquivos de configuração `.firebaserc` e `firebase.json` apontando para a pasta raiz `public/` com rewrites SPA.

---

## 5. Estrutura de Diretórios

```plaintext
Pianotutor/
│
├── .firebase/                  # Metadados e cache de deploy do Firebase CLI
├── .firebaserc                 # Vinculação com o projeto Firebase (pianotutor-9dd29)
├── .gitattributes              # Normalização de finais de linha (Git LF/CRLF)
├── .gitignore                  # Protege credenciais locais sensíveis (ignora env.json)
├── firebase.json               # Configuração do Firebase Hosting (public: "public")
├── README.md                   # Documentação técnica e guia do sistema
│
└── public/                     # Diretório raiz servido na web (Single Page Application)
    ├── index.html              # Ponto de entrada HTML5, estrutura de telas e modal
    ├── env.example.json        # Template de referência para configuração multi-provedor
    ├── env.json                # Arquivo local de credenciais padrão (ignorado no git)
    │
    ├── css/
    │   └── style.css           # Design system completo, estilos do estúdio, teclado e modal
    │
    └── js/
        ├── config.js           # ConfigManager: gestão multi-provedor, prioridades e validação
        ├── api.js              # ApiService: cliente HTTP para Google Gemini e Azure OpenAI
        └── script.js           # Controlador da UI, sintetizador Web Audio API e fluxo do chat
```

### Detalhamento dos Componentes em `public/`

| Arquivo | Responsabilidade |
| :--- | :--- |
| [`public/index.html`](public/index.html) | Estrutura as três seções da aplicação: Topbar institucional, Tela Hero inicial, Estúdio interativo (Painel do Chat + Painel do Piano) e a Modal de Configurações da API. |
| [`public/css/style.css`](public/css/style.css) | Centraliza tokens de cores (`--primary`, `--lavender`, `--ink`), skeumorfismo das teclas brancas e pretas, estados `:hover` e `.pressed`, responsividade mobile e abas da modal. |
| [`public/js/config.js`](public/js/config.js) | Exporta `ConfigManager`, constantes `PROVIDERS`, endpoints e modelos padrão. Implementa a hierarquia de prioridades, persistência no `localStorage`, normalização e migração de versões anteriores. |
| [`public/js/api.js`](public/js/api.js) | Exporta `ApiService`. Coordena requisições HTTP para Google Gemini e Azure OpenAI, adapta estruturas de histórico, trata status de erro da API e aplica sanitização em chaves secretas. |
| [`public/js/script.js`](public/js/script.js) | Liga os eventos do DOM, gerencia o `AudioContext`, mapeia frequências das notas, processa respostas rápidas e orquestra a alternância de provedores e abas na modal. |
| [`public/env.example.json`](public/env.example.json) | Modelo padrão documentando a estrutura JSON aceita para configuração automática de Gemini e Azure. |

---

## 6. Arquitetura e Funcionamento do Sistema

### Fluxo de Dados e Interação

```
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                   |
|                                                                                   |
|   +-----------------------+   +-----------------------+   +-------------------+   |
|   |   Studio View Modes   |   |   Chat Panel (Tutor)  |   |   Virtual Piano   |   |
|   |  (Both / Chat / Piano)|   |  Prompt Input / Fast  |   |   Mouse & QWERTY  |   |
|   |                       |   |       Replies         |   |      Keyboard     |   |
|   +-----------+-----------+   +-----------+-----------+   +---------+---------+   |
+---------------|---------------------------|-------------------------|-------------+
                |                           |                         |
                v                           v                         v
+-------------------------------+   +-------------------+   +-----------------------+
|      public/js/script.js      |   | public/js/api.js  |   |    Web Audio API      |
|  - Alternância de telas       |   |  - System prompt  |   |  - AudioContext       |
|  - Renderização de mensagens  |-->|  - Parser Gemini  |   |  - Onda Triangle      |
|  - Controle da Modal/Abas     |   |  - Parser Azure   |   |  - Envelope de ganho  |
+---------------+---------------+   +---------+---------+   +-----------------------+
                |                             |
                v                             v
+-------------------------------+   +-----------------------------------------------+
|     public/js/config.js       |   |         Provedores Externos de IA             |
|  - Prioridade 1: localStorage |   |  • Google Gemini REST API (Padrão)            |
|  - Prioridade 2: env.json     |-->|    https://generativelanguage.googleapis.com  |
|  - Prioridade 3: Modal Manual |   |  • Azure OpenAI Service Endpoint              |
+-------------------------------+   +-----------------------------------------------+
```

### Lógica de Prioridade de Configuração (3 Níveis)

1. **Prioridade 1 — `localStorage`:**
   Verificado na inicialização sob a chave `piano_tutor_api_config`. Se o usuário configurou suas credenciais diretamente na modal do navegador, esses dados têm preferência máxima e sobrepõem qualquer arquivo estático.
2. **Prioridade 2 — `public/env.json`:**
   Caso o `localStorage` esteja vazio, a aplicação tenta realizar um `fetch("./env.json")` com parâmetro de *cache busting*. Se o arquivo existir e contiver chaves válidas, a configuração é carregada automaticamente.
3. **Prioridade 3 — Configuração Pendente / Modal Manual:**
   Se nenhuma fonte contiver credenciais preenchidas, o sistema define o Google Gemini como padrão e aguarda o preenchimento manual pelo usuário. Caso o usuário tente enviar uma mensagem no chat sem credenciais, o tutor exibe um alerta orientador com botão direto para a modal de configurações.

### Retrocompatibilidade e Migração de Configurações
O módulo `config.js` possui um analisador que detecta configurações em formato legado (com `apiKey`, `endpoint` e `model` na raiz) e realiza a migração instantânea para o namespace `providers.azure`, estabelecendo o Google Gemini como provedor ativo sem provocar perda de credenciais preexistentes.

---

## 7. Mapeamento de Teclas e Frequências Sonoras

O piano virtual opera com 13 notas na afinação padrão de concerto ($A_4 = 440\text{ Hz}$):

| Tecla Musical | Nome por Extenso | Tecla do Computador | Frequência Calibrada | Tipo de Tecla |
| :---: | :--- | :---: | :---: | :---: |
| **C4** | Dó central | <kbd>A</kbd> | $261.63\text{ Hz}$ | Branca (Diatônica) |
| **C#4** | Dó sustenido / Ré bemol | <kbd>W</kbd> | $277.18\text{ Hz}$ | Preta (Acidente) |
| **D4** | Ré | <kbd>S</kbd> | $293.66\text{ Hz}$ | Branca (Diatônica) |
| **D#4** | Ré sustenido / Mi bemol | <kbd>E</kbd> | $311.13\text{ Hz}$ | Preta (Acidente) |
| **E4** | Mi | <kbd>D</kbd> | $329.63\text{ Hz}$ | Branca (Diatônica) |
| **F4** | Fá | <kbd>F</kbd> | $349.23\text{ Hz}$ | Branca (Diatônica) |
| **F#4** | Fá sustenido / Sol bemol | <kbd>T</kbd> | $369.99\text{ Hz}$ | Preta (Acidente) |
| **G4** | Sol | <kbd>G</kbd> | $392.00\text{ Hz}$ | Branca (Diatônica) |
| **G#4** | Sol sustenido / Lá bemol | <kbd>Y</kbd> | $415.30\text{ Hz}$ | Preta (Acidente) |
| **A4** | Lá (Diapasão padrão) | <kbd>H</kbd> | $440.00\text{ Hz}$ | Branca (Diatônica) |
| **A#4** | Lá sustenido / Si bemol | <kbd>U</kbd> | $466.16\text{ Hz}$ | Preta (Acidente) |
| **B4** | Si | <kbd>J</kbd> | $493.88\text{ Hz}$ | Branca (Diatônica) |
| **C5** | Dó agudo | *(Mouse)* | $523.25\text{ Hz}$ | Branca (Diatônica) |

---

## 8. Segurança e Boas Práticas

- **Sanitização Ativa de Chaves (`[CHAVE_PROTEGIDA]`):** Todas as chamadas de rede do `api.js` passam por filtros de segurança. Se ocorrer um erro HTTP (como 400 ou 401) contendo a chave na mensagem de retorno do servidor, ela é substituída pela expressão `[CHAVE_PROTEGIDA]` antes de qualquer exibição no console ou nos balões de chat da interface.
- **Campos Ocultos por Padrão:** Inputs de credenciais utilizam `type="password"` por padrão, prevenindo visualização acidental ou gravação indevida de tela.
- **Proteção no Controle de Versão:** O arquivo `.gitignore` instrui a exclusão de qualquer arquivo `env.json` do controle de versão do Git, evitando a publicação não intencional de credenciais em repositórios remotos.
- **Isolamento de Origem no Navegador:** Por se tratar de uma SPA estática executada no cliente, o `localStorage` do navegador armazena as chaves de forma restrita à origem do domínio local/remoto do usuário.

---

## 9. Como Executar o Projeto

Como o Piano Tutor AI utiliza **ES Modules** nativos (`import`/`export`) e efetua requisições assíncronas ao `./env.json`, ele **não** deve ser aberto diretamente pelo protocolo `file://`. A aplicação deve ser servida através de um servidor HTTP local simples.

### Pré-requisitos
- Um navegador moderno (Google Chrome, Microsoft Edge, Mozilla Firefox ou Safari).
- Qualquer utilitário de servidor HTTP local (Python 3, Node.js, ou extensão Live Server do VS Code).

---

### Passo a Passo

#### 1. Clonar o repositório
```bash
git clone https://github.com/naarah4849-stack/Pianotutor.git
cd Pianotutor
```

#### 2. Configurar Credenciais (Opcional)
Você pode configurar as chaves diretamente pela interface visual da aplicação ou criar um arquivo `public/env.json` a partir do modelo `public/env.example.json`:

```json
{
  "defaultProvider": "gemini",
  "providers": {
    "gemini": {
      "apiKey": "SUA_CHAVE_GEMINI_AQUI",
      "model": "gemini-1.5-flash"
    },
    "azure": {
      "apiKey": "SUA_CHAVE_AZURE_AQUI",
      "endpoint": "https://seu-recurso.openai.azure.com/openai/deployments/seu-deployment/chat/completions?api-version=2024-02-15-preview",
      "model": "gpt-4o-mini"
    }
  }
}
```

#### 3. Iniciar o Servidor HTTP Local

*Opção A — Utilizando Python 3 (servindo a pasta `public`):*
```bash
# A partir da raiz do projeto:
python -m http.server 8000 --directory public
```

*Opção B — Utilizando Node.js (`npx serve`):*
```bash
npx serve public
```

*Opção C — Utilizando o Firebase CLI:*
```bash
# Executa os emuladores locais do Firebase Hosting
firebase emulators:start
# Ou alternativamente:
firebase serve --only hosting
```

*Opção D — Utilizando VS Code Live Server:*
1. Abra a pasta `Pianotutor` no Visual Studio Code.
2. Navegue até o arquivo `public/index.html`.
3. Clique com o botão direito e selecione **Open with Live Server**.

#### 4. Acessar a Aplicação
Abra seu navegador e acesse o endereço indicado pelo terminal, tipicamente:
```text
http://localhost:8000
```

---

## 10. Configuração das APIs de IA na Interface

Ao abrir a aplicação, clique no ícone de engrenagem no cabeçalho superior direito:

### Para o Google Gemini (Padrão)
1. Obtenha sua chave gratuita em [aistudio.google.com](https://aistudio.google.com/).
2. Na modal de configurações, confirme se **Google Gemini** está selecionado.
3. Insira sua chave no campo **API Key Google Gemini**.
4. O modelo sugerido é `gemini-1.5-flash` (podendo utilizar `gemini-1.5-pro` ou `gemini-2.0-flash`).
5. Clique em **Salvar configurações**. O endpoint é gerenciado e montado automaticamente.

### Para o Azure OpenAI
1. Na modal de configurações, clique no seletor **Azure OpenAI** ou acerte a aba correspondente.
2. Informe a **API Key** gerada no portal da Azure.
3. Cole a **URL completa do Endpoint** de Chat Completions da sua implantação.
4. Digite o nome do **Modelo / Deployment** configurado.
5. Clique em **Salvar configurações**.

---

## 11. Observações e Limitações

- **Conectividade com a Internet:** As chamadas para os modelos de inteligência artificial exigem conexão ativa com a internet para alcançar os servidores da Google (`generativelanguage.googleapis.com`) ou da Microsoft Azure.
- **CORS e Políticas de Domínio:** A API do Google Gemini suporta chamadas originadas de clientes web com cabeçalho `x-goog-api-key`. No Azure OpenAI, verifique se as políticas de CORS do seu recurso permitem requisições a partir do seu domínio de hospedagem ou `localhost`.
- **Áudio no Navegador:** Navegadores modernos restringem a inicialização automática do `AudioContext` antes da primeira interação do usuário. O Piano Tutor AI trata essa condição ativando o contexto sonoro logo no primeiro clique em tecla ou envio de mensagem.

---

## 12. Possíveis Melhorias Futuras

- [ ] **Expansão de Oitavas:** Controles para transposição de oitavas ($C_2$ a $C_7$) para execução de repertórios mais amplos.
- [ ] **Polifonia Aprimorada para Acordes:** Suporte refinado a múltiplos toques simultâneos de teclado para execução de tríades harmônicas completas.
- [ ] **Suporte a Hardware via Web MIDI API:** Conexão direta com teclados físicos USB ou controladores MIDI Bluetooth.
- [ ] **Partituras Interativas com VexFlow:** Renderização em tempo real das notas e pautas musicais explicadas pelo tutor acima do teclado virtual.
- [ ] **Avaliação Prática por Microfone:** Comparação de afinação utilizando entrada de áudio do microfone do usuário para validar exercícios práticos.

---

## 13. Autoria e Licença

- **Autora:** [Naara Alves](https://github.com/naarah4849-stack)
- **Repositório:** [https://github.com/naarah4849-stack/Pianotutor](https://github.com/naarah4849-stack/Pianotutor)
- **Licença:** Distribuído sob a licença [MIT](https://opensource.org/licenses/MIT).
