/**
 * Serviço de Integração com APIs de Inteligência Artificial (Tutor IA)
 *
 * Suporta provedores independentes:
 * 1. Google Gemini (API REST oficial do Google Generative Language) - Provedor Padrão
 * 2. Azure OpenAI (Responses API / Chat Completions compatível)
 *
 * Utiliza as configurações ativas gerenciadas pelo ConfigManager.
 * Sanitiza automaticamente credenciais em traces e mensagens de erro para evitar vazamentos.
 */

import { ConfigManager, PROVIDERS } from "./config.js";

export const ApiService = (() => {
  const SYSTEM_PROMPT =
    "Você é o Piano Tutor AI, um tutor musical amigável, acolhedor e didático especializado em ensinar piano, teoria musical, notas e acordes para iniciantes. Suas respostas devem ser claras, encorajadoras e concisas.";

  /**
   * Sanitiza qualquer ocorrência de chave de API em textos de erro ou logs
   * @param {string} text
   * @param {string} apiKey
   * @returns {string}
   */
  function sanitizeApiKey(text, apiKey) {
    if (!text || typeof text !== "string") return "";
    if (!apiKey || typeof apiKey !== "string") return text;
    try {
      const escaped = apiKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return text.replace(new RegExp(escaped, "g"), "[CHAVE_PROTEGIDA]");
    } catch (_) {
      return text;
    }
  }

  /**
   * Converte o histórico da aplicação para a estrutura 'contents' exigida pela API do Google Gemini
   * @param {string} prompt Mensagem atual do usuário
   * @param {Array<{role: string, content: string}>} history
   * @returns {Array<{role: string, parts: Array<{text: string}>}>}
   */
  function formatGeminiContents(prompt, history = []) {
    const contents = [];

    // Filtra e converte mensagens do histórico
    for (const msg of history) {
      if (!msg || !msg.content || typeof msg.content !== "string") continue;
      const cleanText = msg.content.trim();
      if (!cleanText) continue;

      // Na API do Gemini, assistente é 'model' e usuário é 'user'
      const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";

      // Agrupa se houver mensagens consecutivas com o mesmo papel
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts.push({ text: cleanText });
      } else {
        contents.push({
          role,
          parts: [{ text: cleanText }]
        });
      }
    }

    // A primeira mensagem da conversa no Gemini deve ser do 'user'
    if (contents.length > 0 && contents[0].role !== "user") {
      contents.shift();
    }

    // Adiciona o prompt atual do usuário
    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
      contents[contents.length - 1].parts.push({ text: prompt });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: prompt }]
      });
    }

    return contents;
  }

  /**
   * Comunicação oficial com a API do Google Gemini
   */
  async function callGemini(prompt, history, cfg) {
    const { apiKey, model } = cfg;
    const cleanModel = (model || "gemini-1.5-flash").trim();
    const endpoint = `${ConfigManager.buildGeminiEndpoint(cleanModel)}?key=${encodeURIComponent(apiKey)}`;

    const contents = formatGeminiContents(prompt, history);

    const payload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    };

    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(payload)
      });
    } catch (networkErr) {
      const safe = sanitizeApiKey(networkErr.message || "Erro de rede ao contatar o Gemini", apiKey);
      return {
        success: false,
        error: `Não foi possível conectar aos servidores do Google Gemini: ${safe}. Verifique sua conexão de rede.`
      };
    }

    if (!response.ok) {
      let rawError = `Status HTTP ${response.status}`;
      let specificMessage = "";

      try {
        const errJson = await response.json();
        if (errJson.error) {
          specificMessage = errJson.error.message || "";
          rawError += `: ${specificMessage}`;
        }
      } catch (_) {
        // Resposta não-JSON
      }

      const safeError = sanitizeApiKey(rawError, apiKey);

      // Tratamentos específicos por status
      if (response.status === 400) {
        if (/api[ _]?key/i.test(specificMessage)) {
          return {
            success: false,
            error: "A chave de API do Google Gemini informada é inválida ou não foi autorizada. Por favor, verifique sua API Key nas configurações."
          };
        }
        return {
          success: false,
          error: `Requisição inválida para o Google Gemini (400): ${safeError}`
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: `Acesso negado à API do Google Gemini (403). Verifique se a chave possui permissões para o serviço de IA Generativa.`
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: `O modelo "${cleanModel}" não foi encontrado na API do Google Gemini. Verifique o identificador do modelo nas configurações (ex: gemini-1.5-flash).`
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: "Limite de requisições do Google Gemini atingido (Rate limit ou Quota excedida). Aguarde alguns instantes antes de enviar nova mensagem."
        };
      }

      if (response.status >= 500) {
        return {
          success: false,
          error: `O serviço do Google Gemini está temporariamente instável (Status ${response.status}). Tente novamente em alguns segundos.`
        };
      }

      return {
        success: false,
        error: `Falha na comunicação com a API do Google Gemini (${safeError}).`
      };
    }

    try {
      const data = await response.json();

      // Checa bloqueios por política de segurança da Google
      const candidate = data.candidates && data.candidates[0];
      if (candidate && candidate.finishReason === "SAFETY") {
        return {
          success: false,
          error: "A resposta do tutor foi bloqueada pelos filtros de moderação e segurança do Gemini."
        };
      }

      if (candidate && candidate.content && Array.isArray(candidate.content.parts)) {
        const replyText = candidate.content.parts
          .map(part => part.text || "")
          .join("");

        if (replyText.trim()) {
          return {
            success: true,
            text: replyText.trim()
          };
        }
      }

      return {
        success: false,
        error: "O Google Gemini não retornou texto válido na resposta. Tente reformular sua pergunta."
      };
    } catch (parseErr) {
      return {
        success: false,
        error: "Falha ao interpretar os dados retornados pelo Google Gemini."
      };
    }
  }

  /**
   * Comunicação com o provedor Azure OpenAI (mantém compatibilidade total)
   */
  async function callAzure(prompt, history, cfg) {
    const { apiKey, endpoint, model } = cfg;

    const messagesPayload = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: prompt }
    ];

    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          input: messagesPayload
        })
      });
    } catch (networkErr) {
      const safe = sanitizeApiKey(networkErr.message || "Erro de rede ao contatar o Azure", apiKey);
      return {
        success: false,
        error: `Não foi possível conectar ao endpoint do Azure OpenAI: ${safe}. Verifique a URL configurada.`
      };
    }

    if (!response.ok) {
      let errorDetail = `Status HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.error && errJson.error.message) {
          errorDetail += `: ${errJson.error.message}`;
        }
      } catch (_) {
        // Resposta não-JSON
      }

      const sanitizedDetail = sanitizeApiKey(errorDetail, apiKey);

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: "Chave de API do Azure OpenAI não autorizada ou expirada. Verifique suas credenciais nas configurações."
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: "Endpoint ou implantação do Azure OpenAI não encontrada (404). Verifique se a URL e o Deployment estão corretos."
        };
      }

      return {
        success: false,
        error: `Falha na comunicação com a API do Azure OpenAI (${sanitizedDetail}).`
      };
    }

    try {
      const data = await response.json();
      let replyText = "";

      if (data.output && Array.isArray(data.output)) {
        // Formato Azure OpenAI Responses API
        replyText = data.output
          .filter(item => item.type === "message")
          .flatMap(item => item.content || [])
          .filter(content => content.type === "output_text")
          .map(content => content.text)
          .join("\n");
      } else if (
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content
      ) {
        // Formato OpenAI Chat Completions padrão
        replyText = data.choices[0].message.content;
      } else if (typeof data === "string") {
        replyText = data;
      } else {
        console.error("Formato de resposta Azure não reconhecido:", data);
        replyText = "Desculpe, não consegui interpretar a resposta do Azure OpenAI. Tente novamente.";
      }

      return {
        success: true,
        text: replyText.trim()
      };
    } catch (parseErr) {
      return {
        success: false,
        error: "Falha ao processar os dados recebidos do Azure OpenAI."
      };
    }
  }

  /**
   * Envia uma mensagem para o provedor de IA atualmente selecionado
   * @param {string} prompt Mensagem do usuário
   * @param {Array<{role: string, content: string}>} history Histórico de mensagens
   * @returns {Promise<{success: boolean, text?: string, error?: string, provider?: string}>}
   */
  async function sendChatMessage(prompt, history = []) {
    const activeProvider = ConfigManager.getActiveProvider();

    // Valida se o provedor ativo está configurado
    if (!ConfigManager.hasValidConfig(activeProvider)) {
      if (activeProvider === PROVIDERS.GEMINI) {
        return {
          success: false,
          provider: PROVIDERS.GEMINI,
          error: "A API do Google Gemini ainda não foi configurada. Por favor, acesse o botão de Configurações (ícone de engrenagem) e informe sua API Key do Google Gemini para conversar com o tutor."
        };
      } else {
        return {
          success: false,
          provider: PROVIDERS.AZURE,
          error: "A API do Azure OpenAI não foi completamente configurada. Por favor, acesse o botão de Configurações (ícone de engrenagem) e informe a API Key, o Endpoint e o Modelo do Azure OpenAI."
        };
      }
    }

    const providerConfig = ConfigManager.getProviderConfig(activeProvider);

    if (activeProvider === PROVIDERS.GEMINI) {
      const result = await callGemini(prompt, history, providerConfig);
      return { ...result, provider: PROVIDERS.GEMINI };
    } else if (activeProvider === PROVIDERS.AZURE) {
      const result = await callAzure(prompt, history, providerConfig);
      return { ...result, provider: PROVIDERS.AZURE };
    } else {
      return {
        success: false,
        error: `Provedor de inteligência artificial desconhecido: "${activeProvider}".`
      };
    }
  }

  return {
    sendChatMessage
  };
})();
