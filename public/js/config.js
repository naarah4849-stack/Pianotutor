/**
 * Módulo de Gerenciamento de Configuração da API (Multi-Provedor: Google Gemini & Azure OpenAI)
 *
 * Responsável por:
 * 1. Prioridade 1: Leitura e persistência no localStorage
 * 2. Prioridade 2: Leitura do arquivo env.json
 * 3. Provedor padrão: Google Gemini
 * 4. Suporte independente a múltiplos provedores (Google Gemini e Azure OpenAI)
 * 5. Migração transparente e compatibilidade com configurações legadas do Azure OpenAI
 * 6. Validação individual de credenciais por provedor
 * 7. Notificação reativa de atualizações para observadores (listeners)
 */

export const PROVIDERS = {
  GEMINI: "gemini",
  AZURE: "azure"
};

export const GEMINI_DEFAULT_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
export const GEMINI_DEFAULT_MODEL = "gemini-1.5-flash";

export const ConfigManager = (() => {
  const STORAGE_KEY = "piano_tutor_api_config";
  const ENV_PATH = "./env.json";

  let activeProvider = PROVIDERS.GEMINI;

  let providersConfig = {
    [PROVIDERS.GEMINI]: {
      apiKey: "",
      model: GEMINI_DEFAULT_MODEL
    },
    [PROVIDERS.AZURE]: {
      apiKey: "",
      endpoint: "",
      model: ""
    }
  };

  let activeSource = null; // 'localStorage' | 'env.json' | null
  const listeners = [];

  /**
   * Constrói a URL oficial da API REST do Google Gemini para o modelo especificado
   * @param {string} model
   * @returns {string}
   */
  function buildGeminiEndpoint(model) {
    const cleanModel = (model || GEMINI_DEFAULT_MODEL).trim();
    return `${GEMINI_DEFAULT_ENDPOINT}/${encodeURIComponent(cleanModel)}:generateContent`;
  }

  /**
   * Valida as configurações de um provedor específico
   * @param {string} provider 'gemini' | 'azure'
   * @param {Object} cfg
   * @returns {{isValid: boolean, error?: string, sanitized?: Object}}
   */
  function validateProvider(provider, cfg) {
    if (!cfg || typeof cfg !== "object") {
      return { isValid: false, error: "Dados do provedor ausentes ou inválidos." };
    }

    const apiKey = typeof cfg.apiKey === "string" ? cfg.apiKey.trim() : "";

    if (provider === PROVIDERS.GEMINI) {
      if (!apiKey) {
        return {
          isValid: false,
          error: "A chave de API (API Key) do Google Gemini é obrigatória."
        };
      }

      const model = typeof cfg.model === "string" && cfg.model.trim()
        ? cfg.model.trim()
        : GEMINI_DEFAULT_MODEL;

      return {
        isValid: true,
        sanitized: {
          apiKey,
          model
        }
      };
    }

    if (provider === PROVIDERS.AZURE) {
      const endpoint = typeof cfg.endpoint === "string" ? cfg.endpoint.trim() : "";
      const model = typeof cfg.model === "string" ? cfg.model.trim() : "";

      if (!apiKey) {
        return {
          isValid: false,
          error: "A chave de API (API Key) do Azure OpenAI é obrigatória."
        };
      }

      if (!endpoint) {
        return {
          isValid: false,
          error: "O endpoint da API do Azure OpenAI é obrigatório."
        };
      }

      if (!model) {
        return {
          isValid: false,
          error: "O modelo/deployment do Azure OpenAI é obrigatório."
        };
      }

      try {
        const parsedUrl = new URL(endpoint);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          return {
            isValid: false,
            error: "O endpoint do Azure deve utilizar protocolo HTTP ou HTTPS válido."
          };
        }
      } catch (_) {
        return {
          isValid: false,
          error: "O endpoint do Azure informado não é uma URL válida."
        };
      }

      return {
        isValid: true,
        sanitized: {
          apiKey,
          endpoint,
          model
        }
      };
    }

    return { isValid: false, error: `Provedor desconhecido: "${provider}".` };
  }

  /**
   * Normaliza qualquer estrutura de configuração (nova ou legada), garantindo retrocompatibilidade
   * @param {Object} raw
   * @returns {{activeProvider: string, providers: {gemini: Object, azure: Object}} | null}
   */
  function normalizeConfig(raw) {
    if (!raw || typeof raw !== "object") return null;

    // Caso 1: Formato novo com estrutura 'providers'
    if (raw.providers && typeof raw.providers === "object") {
      const candidateActive = raw.activeProvider || raw.defaultProvider || PROVIDERS.GEMINI;
      const chosenActive = [PROVIDERS.GEMINI, PROVIDERS.AZURE].includes(candidateActive)
        ? candidateActive
        : PROVIDERS.GEMINI;

      const geminiRaw = raw.providers[PROVIDERS.GEMINI] || {};
      const azureRaw = raw.providers[PROVIDERS.AZURE] || {};

      return {
        activeProvider: chosenActive,
        providers: {
          [PROVIDERS.GEMINI]: {
            apiKey: typeof geminiRaw.apiKey === "string" ? geminiRaw.apiKey.trim() : "",
            model: typeof geminiRaw.model === "string" && geminiRaw.model.trim()
              ? geminiRaw.model.trim()
              : GEMINI_DEFAULT_MODEL
          },
          [PROVIDERS.AZURE]: {
            apiKey: typeof azureRaw.apiKey === "string" ? azureRaw.apiKey.trim() : "",
            endpoint: typeof azureRaw.endpoint === "string" ? azureRaw.endpoint.trim() : "",
            model: typeof azureRaw.model === "string" ? azureRaw.model.trim() : ""
          }
        }
      };
    }

    // Caso 2: Formato legado com apiKey/endpoint/model na raiz (Azure OpenAI pré-existente)
    if (raw.apiKey || raw.endpoint || raw.model) {
      // Se era o formato antigo onde o usuário salvava explicitamente Azure, permitimos definir activeProvider
      const chosenActive = raw.activeProvider && [PROVIDERS.GEMINI, PROVIDERS.AZURE].includes(raw.activeProvider)
        ? raw.activeProvider
        : PROVIDERS.GEMINI;

      return {
        activeProvider: chosenActive,
        providers: {
          [PROVIDERS.GEMINI]: {
            apiKey: (raw.providers && raw.providers.gemini?.apiKey) || "",
            model: (raw.providers && raw.providers.gemini?.model) || GEMINI_DEFAULT_MODEL
          },
          [PROVIDERS.AZURE]: {
            apiKey: typeof raw.apiKey === "string" ? raw.apiKey.trim() : "",
            endpoint: typeof raw.endpoint === "string" ? raw.endpoint.trim() : "",
            model: typeof raw.model === "string" ? raw.model.trim() : ""
          }
        }
      };
    }

    return null;
  }

  /**
   * Tenta carregar as configurações do localStorage (Prioridade 1)
   */
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const normalized = normalizeConfig(parsed);
      if (normalized) {
        return normalized;
      }
    } catch (err) {
      console.warn("Aviso ao ler configurações do localStorage:", err.message);
    }
    return null;
  }

  /**
   * Tenta carregar as configurações do arquivo env.json (Prioridade 2)
   */
  async function loadFromEnvFile() {
    try {
      const response = await fetch(`${ENV_PATH}?_t=${Date.now()}`);
      if (!response.ok) {
        return null;
      }

      const parsed = await response.json();
      const normalized = normalizeConfig(parsed);
      if (!normalized) return null;

      // Só considera o env.json como fonte ativa válida se ao menos um dos provedores tiver apiKey
      const geminiHasKey = Boolean(normalized.providers[PROVIDERS.GEMINI]?.apiKey);
      const azureHasKey = Boolean(normalized.providers[PROVIDERS.AZURE]?.apiKey);

      if (geminiHasKey || azureHasKey) {
        return normalized;
      }
    } catch (err) {
      console.warn("Aviso ao carregar ou interpretar env.json:", err.message);
    }
    return null;
  }

  /**
   * Inicializa o carregamento seguindo a ordem de prioridade:
   * 1. localStorage
   * 2. env.json
   * 3. Configuração padrão com credenciais pendentes
   */
  async function initialize() {
    // 1. Checa localStorage (Prioridade 1)
    const storageConfig = loadFromStorage();
    if (storageConfig) {
      activeProvider = storageConfig.activeProvider;
      providersConfig = storageConfig.providers;
      activeSource = "localStorage";
      notifyListeners();
      return {
        success: hasValidConfig(),
        source: "localStorage",
        activeProvider,
        config: getConfig()
      };
    }

    // 2. Checa env.json (Prioridade 2)
    const envConfig = await loadFromEnvFile();
    if (envConfig) {
      activeProvider = envConfig.activeProvider;
      providersConfig = envConfig.providers;
      activeSource = "env.json";
      notifyListeners();
      return {
        success: hasValidConfig(),
        source: "env.json",
        activeProvider,
        config: getConfig()
      };
    }

    // 3. Nenhuma configuração persistida
    activeProvider = PROVIDERS.GEMINI;
    providersConfig = {
      [PROVIDERS.GEMINI]: { apiKey: "", model: GEMINI_DEFAULT_MODEL },
      [PROVIDERS.AZURE]: { apiKey: "", endpoint: "", model: "" }
    };
    activeSource = null;
    notifyListeners();
    return {
      success: false,
      source: null,
      activeProvider,
      error: "Nenhuma configuração de API encontrada. Por favor, configure as credenciais."
    };
  }

  /**
   * Salva novas configurações inseridas pelo usuário
   * @param {{activeProvider?: string, providers?: Object, apiKey?: string, endpoint?: string, model?: string}} newConfigData
   */
  function saveConfig(newConfigData) {
    const normalized = normalizeConfig(newConfigData);
    if (!normalized) {
      return { success: false, error: "Estrutura de configuração inválida." };
    }

    // Valida o provedor ativo selecionado
    const targetProvider = normalized.activeProvider;
    const providerCfg = normalized.providers[targetProvider];
    const validation = validateProvider(targetProvider, providerCfg);

    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Se o provedor não-ativo tiver dados preenchidos, valida-o também para evitar dados corrompidos
    const otherProvider = targetProvider === PROVIDERS.GEMINI ? PROVIDERS.AZURE : PROVIDERS.GEMINI;
    const otherCfg = normalized.providers[otherProvider];
    if (otherProvider === PROVIDERS.AZURE && (otherCfg.apiKey || otherCfg.endpoint || otherCfg.model)) {
      const otherValidation = validateProvider(otherProvider, otherCfg);
      if (!otherValidation.isValid) {
        return {
          success: false,
          error: `Atenção na aba Azure OpenAI: ${otherValidation.error}`
        };
      }
    } else if (otherProvider === PROVIDERS.GEMINI && otherCfg.apiKey) {
      const otherValidation = validateProvider(otherProvider, otherCfg);
      if (!otherValidation.isValid) {
        return {
          success: false,
          error: `Atenção na aba Google Gemini: ${otherValidation.error}`
        };
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      activeProvider = normalized.activeProvider;
      providersConfig = normalized.providers;
      activeSource = "localStorage";
      notifyListeners();
      return { success: true, config: getConfig() };
    } catch (err) {
      return { success: false, error: "Não foi possível salvar no localStorage: " + err.message };
    }
  }

  /**
   * Alterna o provedor ativo ('gemini' ou 'azure') e persiste a escolha no localStorage se houver dados salvos
   * @param {string} provider
   */
  function setActiveProvider(provider) {
    if (![PROVIDERS.GEMINI, PROVIDERS.AZURE].includes(provider)) {
      return { success: false, error: `Provedor inválido: ${provider}` };
    }

    activeProvider = provider;

    // Atualiza no localStorage se já existir configuração persistida
    try {
      const stored = loadFromStorage();
      if (stored) {
        stored.activeProvider = provider;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      }
    } catch (e) {
      console.warn("Aviso ao persistir troca de provedor no storage:", e);
    }

    notifyListeners();
    return { success: true, activeProvider, config: getConfig() };
  }

  /**
   * Retorna a configuração consolidada e os dados do provedor ativo
   */
  function getConfig() {
    const activeCfg = providersConfig[activeProvider] || {};
    const activeEndpoint = activeProvider === PROVIDERS.GEMINI
      ? buildGeminiEndpoint(activeCfg.model)
      : (activeCfg.endpoint || "");

    return {
      activeProvider,
      provider: activeProvider,
      providers: {
        [PROVIDERS.GEMINI]: { ...providersConfig[PROVIDERS.GEMINI] },
        [PROVIDERS.AZURE]: { ...providersConfig[PROVIDERS.AZURE] }
      },
      // Compatibilidade direta com código existente que consome apiKey, endpoint, model
      apiKey: activeCfg.apiKey || "",
      endpoint: activeEndpoint,
      model: activeCfg.model || ""
    };
  }

  /**
   * Retorna os dados de configuração de um provedor específico
   * @param {string} provider 'gemini' | 'azure'
   */
  function getProviderConfig(provider) {
    const target = provider || activeProvider;
    const cfg = providersConfig[target] || {};
    const endpoint = target === PROVIDERS.GEMINI
      ? buildGeminiEndpoint(cfg.model)
      : (cfg.endpoint || "");

    return {
      provider: target,
      ...cfg,
      endpoint
    };
  }

  /**
   * Verifica se o provedor ativo (ou especificado) possui credenciais válidas prontas para uso
   * @param {string} [provider]
   */
  function hasValidConfig(provider = activeProvider) {
    const cfg = providersConfig[provider];
    if (!cfg) return false;
    return validateProvider(provider, cfg).isValid;
  }

  /**
   * Retorna o identificador do provedor ativo
   * @returns {string} 'gemini' | 'azure'
   */
  function getActiveProvider() {
    return activeProvider;
  }

  /**
   * Retorna a fonte atual da configuração ('localStorage', 'env.json' ou null)
   */
  function getActiveSource() {
    return activeSource;
  }

  /**
   * Valida configuração (pode receber o formato legado ou novo)
   */
  function validate(cfg) {
    const normalized = normalizeConfig(cfg);
    if (!normalized) {
      return { isValid: false, error: "Objeto de configuração inválido ou ausente." };
    }
    const current = normalized.activeProvider;
    return validateProvider(current, normalized.providers[current]);
  }

  /**
   * Limpa o armazenamento local
   */
  function clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      activeSource = null;
      return true;
    } catch (_) {
      return false;
    }
  }

  function subscribe(listener) {
    if (typeof listener === "function") {
      listeners.push(listener);
    }
  }

  function notifyListeners() {
    const snapshot = getConfig();
    const sourceSnapshot = activeSource;
    listeners.forEach(fn => {
      try {
        fn(snapshot, sourceSnapshot);
      } catch (e) {
        console.error("Erro no listener de configuração:", e);
      }
    });
  }

  return {
    initialize,
    getConfig,
    getProviderConfig,
    getActiveProvider,
    setActiveProvider,
    saveConfig,
    validate,
    validateProvider,
    hasValidConfig,
    getActiveSource,
    clearStorage,
    subscribe,
    buildGeminiEndpoint,
    STORAGE_KEY,
    PROVIDERS
  };
})();
