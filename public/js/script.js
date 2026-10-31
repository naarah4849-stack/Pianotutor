import { ConfigManager, PROVIDERS } from "./config.js";
import { ApiService } from "./api.js";

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const homeScreen = $("#home-screen");
  const studioScreen = $("#studio-screen");
  const startForm = $("#start-form");
  const promptInput = $("#prompt-input");
  const chatForm = $("#chat-form");
  const chatInput = $("#chat-input");
  const messages = $("#chat-messages");
  const workspace = $("#workspace");
  const selectedNote = $("#selected-note");

  // Elementos de status do provedor na interface
  const headerProviderLabel = $("#header-provider-label");
  const chatProviderTag = $("#chat-provider-tag");

  // Elementos do Modal de Configuração Multi-Provedor
  const settingsModal = $("#settings-modal");
  const openSettingsBtn = $("#open-settings-btn");
  const modalCloseBtn = $("#modal-close-btn");
  const modalCancelBtn = $("#modal-cancel-btn");
  const settingsForm = $("#settings-form");
  const modalAlert = $("#modal-alert");
  const sourceStatusText = $("#source-status-text");

  // Seletor de Provedor
  const btnSelectGemini = $("#btn-select-gemini");
  const btnSelectAzure = $("#btn-select-azure");

  // Abas de Configuração
  const tabBtnGemini = $("#tab-btn-gemini");
  const tabBtnAzure = $("#tab-btn-azure");
  const panelGemini = $("#panel-gemini");
  const panelAzure = $("#panel-azure");

  // Campos Google Gemini
  const cfgGeminiKey = $("#cfg-gemini-key");
  const cfgGeminiModel = $("#cfg-gemini-model");
  const toggleGeminiKeyVisibility = $("#toggle-gemini-key-visibility");

  // Campos Azure OpenAI
  const cfgAzureKey = $("#cfg-azure-key");
  const cfgAzureEndpoint = $("#cfg-azure-endpoint");
  const cfgAzureModel = $("#cfg-azure-model");
  const toggleAzureKeyVisibility = $("#toggle-azure-key-visibility");

  let currentSelectedProvider = PROVIDERS.GEMINI;
  let audioContext = null;
  const conversationHistory = [];

  const noteFrequencies = {
    "C4": 261.63,
    "C#4": 277.18,
    "D4": 293.66,
    "D#4": 311.13,
    "E4": 329.63,
    "F4": 349.23,
    "F#4": 369.99,
    "G4": 392.00,
    "G#4": 415.30,
    "A4": 440.00,
    "A#4": 466.16,
    "B4": 493.88,
    "C5": 523.25
  };

  const noteNames = {
    "C4": "Dó (C)",
    "C#4": "Dó sustenido (C#)",
    "D4": "Ré (D)",
    "D#4": "Ré sustenido (D#)",
    "E4": "Mi (E)",
    "F4": "Fá (F)",
    "F#4": "Fá sustenido (F#)",
    "G4": "Sol (G)",
    "G#4": "Sol sustenido (G#)",
    "A4": "Lá (A)",
    "A#4": "Lá sustenido (A#)",
    "B4": "Si (B)",
    "C5": "Dó (C5)"
  };

  // Abre a tela de estudo com chat e piano.
  function showStudio(initialMessage = "") {
    homeScreen.classList.add("hidden");
    studioScreen.classList.remove("hidden");
    setView("both");

    if (initialMessage.trim()) {
      sendMessage(initialMessage.trim());
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Volta para a página inicial.
  function showHome() {
    studioScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Alterna entre Chat + Piano, Só Chat e Só Piano.
  function setView(view) {
    workspace.classList.remove(
      "view-both",
      "view-chat",
      "view-piano"
    );

    workspace.classList.add(`view-${view}`);

    $$(".view-btn").forEach(button => {
      const active = button.dataset.view === view;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  // Botão de início.
  startForm.addEventListener("submit", event => {
    event.preventDefault();
    showStudio(promptInput.value);
  });

  // Logotipo volta ao início.
  $("#brand-home").addEventListener("click", event => {
    event.preventDefault();
    showHome();
  });

  $("#back-home").addEventListener("click", showHome);

  // Sugestões da página inicial.
  $$(".suggestion-pill").forEach(button => {
    button.addEventListener("click", () => {
      promptInput.value = button.dataset.suggestion || "";
      promptInput.focus();
    });
  });

  // Botões dos modos de visualização.
  $$(".view-btn").forEach(button => {
    button.addEventListener("click", () => {
      setView(button.dataset.view);
    });
  });

  // Cria uma mensagem no histórico do chat.
  function addMessage(text, who, isError = false) {
    const row = document.createElement("div");

    row.className = `message ${
      who === "user" ? "user-message" : "tutor-message"
    }`;

    if (who === "tutor") {
      const avatar = document.createElement("div");

      avatar.className = "bot-avatar small";
      avatar.innerHTML =
        '<span class="material-symbols-outlined">smart_toy</span>';

      row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    if (who === "tutor") {
      const strong = document.createElement("strong");
      strong.textContent = isError ? "Piano Tutor AI (Aviso)" : "Piano Tutor AI";
      if (isError) {
        strong.style.color = "#dc2626";
      }
      bubble.appendChild(strong);
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    bubble.appendChild(paragraph);

    // Se for um aviso de erro de configuração, oferece link/botão para abrir modal
    if (isError) {
      const openSettingsInline = document.createElement("button");
      openSettingsInline.type = "button";
      openSettingsInline.textContent = "Configurar API agora";
      openSettingsInline.className = "secondary-btn";
      openSettingsInline.style.marginTop = "8px";
      openSettingsInline.style.fontSize = "11px";
      openSettingsInline.style.padding = "6px 12px";
      openSettingsInline.addEventListener("click", () => openModal());
      bubble.appendChild(openSettingsInline);
    }

    const time = document.createElement("time");
    time.textContent = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });

    bubble.appendChild(time);
    row.appendChild(bubble);
    messages.appendChild(row);

    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  // Mostra indicador de digitação do tutor
  function showTypingIndicator() {
    const row = document.createElement("div");
    row.className = "message tutor-message typing-indicator-row";
    row.id = "tutor-typing";

    const avatar = document.createElement("div");
    avatar.className = "bot-avatar small";
    avatar.innerHTML = '<span class="material-symbols-outlined">smart_toy</span>';
    row.appendChild(avatar);

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    const providerName = ConfigManager.getActiveProvider() === PROVIDERS.GEMINI ? "Gemini" : "Azure OpenAI";
    bubble.innerHTML = `<span style="color: var(--muted); font-style: italic;">O tutor está pensando (${providerName})...</span>`;
    row.appendChild(bubble);

    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function removeTypingIndicator() {
    const typing = $("#tutor-typing");
    if (typing) {
      typing.remove();
    }
  }

  // Envia mensagem usando a API conectada dinamicamente
  async function sendMessage(text) {
    const clean = text.trim();
    if (!clean) return;

    addMessage(clean, "user");
    chatInput.value = "";

    const activeProvider = ConfigManager.getActiveProvider();

    // Valida se o provedor ativo possui credenciais antes de tentar enviar
    if (!ConfigManager.hasValidConfig(activeProvider)) {
      if (activeProvider === PROVIDERS.GEMINI) {
        addMessage(
          "A API do Google Gemini ainda não foi configurada. Por favor, clique no botão de configurações (engrenagem) no canto superior direito para inserir sua API Key do Google Gemini.",
          "tutor",
          true
        );
      } else {
        addMessage(
          "A API do Azure OpenAI ainda não foi configurada. Por favor, clique no botão de configurações (engrenagem) para cadastrar sua API Key, Endpoint e Modelo do Azure.",
          "tutor",
          true
        );
      }
      return;
    }

    showTypingIndicator();

    try {
      const result = await ApiService.sendChatMessage(clean, conversationHistory);
      removeTypingIndicator();

      if (result.success && result.text) {
        addMessage(result.text, "tutor");
        conversationHistory.push({ role: "user", content: clean });
        conversationHistory.push({ role: "assistant", content: result.text });
      } else {
        addMessage(result.error || "Ocorreu um erro ao obter resposta do tutor.", "tutor", true);
      }
    } catch (err) {
      removeTypingIndicator();
      addMessage("Falha inesperada ao contatar o provedor de IA. Verifique suas configurações de rede e credenciais.", "tutor", true);
    }
  }

  chatForm.addEventListener("submit", event => {
    event.preventDefault();
    sendMessage(chatInput.value);
  });

  // Respostas rápidas dentro do chat.
  $$(".quick-replies button").forEach(button => {
    button.addEventListener("click", () => {
      sendMessage(button.dataset.message || button.textContent);
    });
  });

  // Inicializa o áudio do piano.
  function getAudioContext() {
    if (!audioContext) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        alert(
          "Seu navegador não oferece suporte ao áudio Web. Tente usar uma versão atualizada do Chrome."
        );
        return null;
      }

      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    return audioContext;
  }

  // Toca uma nota usando o áudio do navegador.
  function playNote(note) {
    const context = getAudioContext();

    if (!context || !noteFrequencies[note]) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = noteFrequencies[note];

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.22,
      context.currentTime + 0.015
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.85
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.88);

    $$(".white-key, .black-key").forEach(key => {
      key.classList.toggle("pressed", key.dataset.note === note);
    });

    selectedNote.innerHTML = `<i></i> ${noteNames[note] || note}`;
  }

  // Toca as teclas clicadas.
  $$(".white-key, .black-key").forEach(key => {
    key.addEventListener("click", () => {
      playNote(key.dataset.note);
    });
  });

  // Permite tocar usando as letras do teclado do computador.
  document.addEventListener("keydown", event => {
    if (
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    const target = event.target;

    if (
      target &&
      (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const pianoKey = $(`[data-key="${key}"]`);

    if (pianoKey) {
      event.preventDefault();
      playNote(pianoKey.dataset.note);
    }
  });

  // Limpa a nota selecionada.
  $("#clear-note").addEventListener("click", () => {
    $$(".white-key, .black-key").forEach(key => {
      key.classList.remove("pressed");
    });

    selectedNote.innerHTML = "<i></i> —";
  });

  // Toca a escala de Dó.
  $("#play-scale").addEventListener("click", async () => {
    const scale = [
      "C4", "D4", "E4", "F4",
      "G4", "A4", "B4", "C5"
    ];

    const context = getAudioContext();

    if (!context) return;

    for (const note of scale) {
      playNote(note);

      await new Promise(resolve => {
        window.setTimeout(resolve, 420);
      });
    }
  });

  // ==========================================
  // GERENCIAMENTO DA MODAL DE CONFIGURAÇÕES MULTI-PROVEDOR
  // ==========================================

  function showModalAlert(message, type = "error") {
    modalAlert.className = `modal-alert ${type}`;
    modalAlert.textContent = message;
    modalAlert.classList.remove("hidden");
  }

  function hideModalAlert() {
    modalAlert.classList.add("hidden");
    modalAlert.textContent = "";
  }

  // Atualiza indicadores visuais do provedor ativo no cabeçalho e na interface
  function updateProviderUI() {
    const activeProvider = ConfigManager.getActiveProvider();
    const isGemini = activeProvider === PROVIDERS.GEMINI;

    if (headerProviderLabel) {
      headerProviderLabel.textContent = isGemini ? "Google Gemini" : "Azure OpenAI";
    }

    if (chatProviderTag) {
      chatProviderTag.textContent = isGemini ? "TUTOR IA (GEMINI)" : "TUTOR IA (AZURE)";
    }

    updateSourceStatusText();
  }

  function updateSourceStatusText() {
    const source = ConfigManager.getActiveSource();
    const activeProvider = ConfigManager.getActiveProvider();
    const providerName = activeProvider === PROVIDERS.GEMINI ? "Google Gemini" : "Azure OpenAI";

    let sourceDesc = "";
    if (source === "localStorage") {
      sourceDesc = "<b>localStorage</b> (Prioridade 1 — definida pelo usuário)";
    } else if (source === "env.json") {
      sourceDesc = "<b>env.json</b> (Prioridade 2 — arquivo padrão)";
    } else {
      sourceDesc = "Nenhuma fonte persistida (Preencha os campos abaixo)";
    }

    sourceStatusText.innerHTML = `Provedor ativo: <b>${providerName}</b> | Fonte: ${sourceDesc}`;
  }

  // Alterna a seleção visual do provedor ativo no formulário
  function setModalActiveProvider(provider) {
    currentSelectedProvider = provider;

    const isGemini = provider === PROVIDERS.GEMINI;
    btnSelectGemini.classList.toggle("active", isGemini);
    btnSelectGemini.setAttribute("aria-checked", String(isGemini));

    btnSelectAzure.classList.toggle("active", !isGemini);
    btnSelectAzure.setAttribute("aria-checked", String(!isGemini));

    // Ao selecionar o provedor, navega diretamente para sua respectiva aba
    switchTab(provider);
  }

  // Alterna visualmente entre as abas Gemini e Azure OpenAI
  function switchTab(tab) {
    const isGemini = tab === PROVIDERS.GEMINI;

    tabBtnGemini.classList.toggle("active", isGemini);
    tabBtnGemini.setAttribute("aria-selected", String(isGemini));

    tabBtnAzure.classList.toggle("active", !isGemini);
    tabBtnAzure.setAttribute("aria-selected", String(!isGemini));

    panelGemini.classList.toggle("hidden", !isGemini);
    panelAzure.classList.toggle("hidden", isGemini);

    if (isGemini) {
      cfgGeminiKey.focus();
    } else {
      cfgAzureKey.focus();
    }
  }

  tabBtnGemini.addEventListener("click", () => switchTab(PROVIDERS.GEMINI));
  tabBtnAzure.addEventListener("click", () => switchTab(PROVIDERS.AZURE));

  btnSelectGemini.addEventListener("click", () => setModalActiveProvider(PROVIDERS.GEMINI));
  btnSelectAzure.addEventListener("click", () => setModalActiveProvider(PROVIDERS.AZURE));

  // Helper para alternar visibilidade de senhas
  function setupPasswordToggle(button, input) {
    button.addEventListener("click", () => {
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      const icon = button.querySelector(".material-symbols-outlined");
      if (icon) {
        icon.textContent = isPass ? "visibility_off" : "visibility";
      }
    });
  }

  setupPasswordToggle(toggleGeminiKeyVisibility, cfgGeminiKey);
  setupPasswordToggle(toggleAzureKeyVisibility, cfgAzureKey);

  function openModal() {
    hideModalAlert();

    const fullCfg = ConfigManager.getConfig();
    const geminiCfg = fullCfg.providers[PROVIDERS.GEMINI] || {};
    const azureCfg = fullCfg.providers[PROVIDERS.AZURE] || {};

    // Popula campos Google Gemini
    cfgGeminiKey.value = geminiCfg.apiKey || "";
    cfgGeminiModel.value = geminiCfg.model || "gemini-1.5-flash";

    // Popula campos Azure OpenAI
    cfgAzureKey.value = azureCfg.apiKey || "";
    cfgAzureEndpoint.value = azureCfg.endpoint || "";
    cfgAzureModel.value = azureCfg.model || "";

    // Remove eventuais classes de erro
    [cfgGeminiKey, cfgGeminiModel, cfgAzureKey, cfgAzureEndpoint, cfgAzureModel].forEach(input => {
      input.classList.remove("is-invalid");
    });

    // Define o provedor ativo atual e foca
    setModalActiveProvider(fullCfg.activeProvider || PROVIDERS.GEMINI);
    updateSourceStatusText();

    settingsModal.classList.remove("hidden");
  }

  function closeModal() {
    settingsModal.classList.add("hidden");
    hideModalAlert();
  }

  openSettingsBtn.addEventListener("click", openModal);
  modalCloseBtn.addEventListener("click", closeModal);
  modalCancelBtn.addEventListener("click", closeModal);

  // Fecha modal ao clicar fora do card
  settingsModal.addEventListener("click", event => {
    if (event.target === settingsModal) {
      closeModal();
    }
  });

  // Fecha ao pressionar ESC
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !settingsModal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Submissão e salvamento das configurações
  settingsForm.addEventListener("submit", event => {
    event.preventDefault();
    hideModalAlert();

    const candidateConfig = {
      activeProvider: currentSelectedProvider,
      providers: {
        [PROVIDERS.GEMINI]: {
          apiKey: cfgGeminiKey.value.trim(),
          model: cfgGeminiModel.value.trim() || "gemini-1.5-flash"
        },
        [PROVIDERS.AZURE]: {
          apiKey: cfgAzureKey.value.trim(),
          endpoint: cfgAzureEndpoint.value.trim(),
          model: cfgAzureModel.value.trim()
        }
      }
    };

    // Validações visuais
    if (currentSelectedProvider === PROVIDERS.GEMINI) {
      cfgGeminiKey.classList.toggle("is-invalid", !candidateConfig.providers[PROVIDERS.GEMINI].apiKey);
      cfgGeminiModel.classList.toggle("is-invalid", !candidateConfig.providers[PROVIDERS.GEMINI].model);
    } else {
      cfgAzureKey.classList.toggle("is-invalid", !candidateConfig.providers[PROVIDERS.AZURE].apiKey);
      cfgAzureEndpoint.classList.toggle("is-invalid", !candidateConfig.providers[PROVIDERS.AZURE].endpoint);
      cfgAzureModel.classList.toggle("is-invalid", !candidateConfig.providers[PROVIDERS.AZURE].model);
    }

    const saveResult = ConfigManager.saveConfig(candidateConfig);

    if (!saveResult.success) {
      showModalAlert(saveResult.error || "Erro ao salvar configurações.", "error");

      // Direciona para a aba que possui erro
      if (saveResult.error && saveResult.error.toLowerCase().includes("azure")) {
        switchTab(PROVIDERS.AZURE);
      } else if (saveResult.error && saveResult.error.toLowerCase().includes("gemini")) {
        switchTab(PROVIDERS.GEMINI);
      }
      return;
    }

    const providerName = currentSelectedProvider === PROVIDERS.GEMINI ? "Google Gemini" : "Azure OpenAI";
    showModalAlert(`Configurações salvas com sucesso! Provedor ativo: ${providerName}.`, "success");

    updateProviderUI();

    window.setTimeout(() => {
      closeModal();
    }, 750);
  });

  // Inicialização do sistema de configuração
  async function initConfig() {
    ConfigManager.subscribe(() => {
      updateProviderUI();
    });

    const res = await ConfigManager.initialize();
    updateProviderUI();

    if (!res.success) {
      console.info("ConfigManager: Provedor padrão definido (Google Gemini). Aguardando credenciais.");
    } else {
      console.info(`ConfigManager: Configuração inicializada com sucesso a partir de [${res.source}]. Provedor ativo: [${res.activeProvider}].`);
    }
  }

  // Inicializa configuração e visualização padrão
  initConfig();
  setView("both");
})();
