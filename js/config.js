/**
 * Módulo de Gerenciamento de Configuração da API
 *
 * Responsável por:
 * 1. Prioridade 1: Leitura do localStorage
 * 2. Prioridade 2: Leitura do arquivo env.json
 * 3. Validação de dados (apiKey, endpoint, model)
 * 4. Salvamento seguro no localStorage
 * 5. Notificação de atualizações para observadores (callbacks)
 */
export const ConfigManager = (() => {
  const STORAGE_KEY = "piano_tutor_api_config";
  const ENV_PATH = "./env.json";

  let currentConfig = {
    apiKey: "",
    endpoint: "",
    model: ""
  };

  let activeSource = null; // 'localStorage' | 'env.json' | null
  const listeners = [];

  /**
   * Sanitiza e valida um objeto de configuração
   * @param {Object} cfg
   * @returns {{isValid: boolean, error?: string, sanitized?: {apiKey: string, endpoint: string, model: string}}}
   */
  function validate(cfg) {
    if (!cfg || typeof cfg !== "object") {
      return { isValid: false, error: "Objeto de configuração inválido ou ausente." };
    }

    const apiKey = typeof cfg.apiKey === "string" ? cfg.apiKey.trim() : "";
    const endpoint = typeof cfg.endpoint === "string" ? cfg.endpoint.trim() : "";
    const model = typeof cfg.model === "string" ? cfg.model.trim() : "";

    if (!apiKey) {
      return { isValid: false, error: "A chave de API (API Key) é obrigatória." };
    }

    if (!endpoint) {
      return { isValid: false, error: "O endpoint da API é obrigatório." };
    }

    if (!model) {
      return { isValid: false, error: "O modelo (Model) da API é obrigatório." };
    }

    // Validação de formato de URL do endpoint
    try {
      const parsedUrl = new URL(endpoint);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return { isValid: false, error: "O endpoint deve utilizar protocolo HTTP ou HTTPS válido." };
      }
    } catch (_) {
      return { isValid: false, error: "O endpoint informado não é uma URL válida." };
    }

    return {
      isValid: true,
      sanitized: { apiKey, endpoint, model }
    };
  }

  /**
   * Tenta carregar as configurações do localStorage (Prioridade 1)
   */
  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      const validation = validate(parsed);
      if (validation.isValid) {
        return validation.sanitized;
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
      // Adicionamos timestamp de cache busting para permitir atualizações no env.json em desenvolvimento
      const response = await fetch(`${ENV_PATH}?_t=${Date.now()}`);
      if (!response.ok) {
        console.warn(`Arquivo ${ENV_PATH} não encontrado ou retornou status ${response.status}.`);
        return null;
      }

      const parsed = await response.json();
      const validation = validate(parsed);
      if (validation.isValid) {
        return validation.sanitized;
      }
    } catch (err) {
      console.warn("Aviso ao carregar ou interpretar env.json:", err.message);
    }
    return null;
  }

  /**
   * Salva novas configurações inseridas pelo usuário (Prioridade 1/Manual)
   * @param {{apiKey: string, endpoint: string, model: string}} newConfig
   */
  function saveConfig(newConfig) {
    const validation = validate(newConfig);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validation.sanitized));
      currentConfig = { ...validation.sanitized };
      activeSource = "localStorage";
      notifyListeners();
      return { success: true, config: { ...currentConfig } };
    } catch (err) {
      return { success: false, error: "Não foi possível salvar no localStorage: " + err.message };
    }
  }

  /**
   * Limpa a configuração manual do localStorage (útil para testes de prioridade)
   */
  function clearStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Inicializa o carregamento seguindo a ordem de prioridade:
   * 1. localStorage
   * 2. env.json
   * 3. Configuração pendente / manual
   */
  async function initialize() {
    // 1. Checa localStorage
    const storageConfig = loadFromStorage();
    if (storageConfig) {
      currentConfig = storageConfig;
      activeSource = "localStorage";
      notifyListeners();
      return { success: true, source: "localStorage", config: { ...currentConfig } };
    }

    // 2. Checa env.json
    const envConfig = await loadFromEnvFile();
    if (envConfig) {
      currentConfig = envConfig;
      activeSource = "env.json";
      notifyListeners();
      return { success: true, source: "env.json", config: { ...currentConfig } };
    }

    // 3. Nenhuma configuração válida encontrada
    currentConfig = { apiKey: "", endpoint: "", model: "" };
    activeSource = null;
    notifyListeners();
    return {
      success: false,
      source: null,
      error: "Nenhuma configuração de API encontrada. Por favor, configure as credenciais."
    };
  }

  /**
   * Retorna a configuração atual em uso
   */
  function getConfig() {
    return { ...currentConfig };
  }

  /**
   * Retorna se a aplicação possui uma configuração pronta para uso
   */
  function hasValidConfig() {
    return validate(currentConfig).isValid;
  }

  /**
   * Retorna a fonte atual da configuração ('localStorage', 'env.json' ou null)
   */
  function getActiveSource() {
    return activeSource;
  }

  function subscribe(listener) {
    if (typeof listener === "function") {
      listeners.push(listener);
    }
  }

  function notifyListeners() {
    const configSnapshot = getConfig();
    const sourceSnapshot = activeSource;
    listeners.forEach(fn => {
      try {
        fn(configSnapshot, sourceSnapshot);
      } catch (e) {
        console.error("Erro no listener de configuração:", e);
      }
    });
  }

  return {
    initialize,
    getConfig,
    saveConfig,
    validate,
    hasValidConfig,
    getActiveSource,
    clearStorage,
    subscribe,
    STORAGE_KEY
  };
})();
