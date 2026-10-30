/**
 * Serviço de Integração com API (Tutor IA)
 *
 * Utiliza as configurações dinâmicas gerenciadas pelo ConfigManager.
 * Não armazena nem expõe credenciais fixas no código.
 * Suporta os formatos de chat completions comuns (como OpenAI/Gemini/OpenAI-compatible).
 */
import { ConfigManager } from "./config.js";

export const ApiService = (() => {
  /**
   * Envia uma mensagem para a API de IA configurada
   * @param {string} prompt Mensagem do usuário
   * @param {Array<{role: string, content: string}>} history Histórico de mensagens
   * @returns {Promise<{success: boolean, text?: string, error?: string}>}
   */
  async function sendChatMessage(prompt, history = []) {
    if (!ConfigManager.hasValidConfig()) {
      return {
        success: false,
        error: "Configuração da API ausente ou inválida. Por favor, acesse o botão de Configurações (ícone de engrenagem) e informe os dados da API."
      };
    }

    const { apiKey, endpoint, model } = ConfigManager.getConfig();

    const systemPrompt =
      "Você é o Piano Tutor AI, um tutor musical amigável, acolhedor e didático especializado em ensinar piano, teoria musical, notas e acordes para iniciantes. Suas respostas devem ser claras, encorajadoras e concisas.";

    const messagesPayload = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: prompt }
    ];

    try {
      const response = await fetch(endpoint, {
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

      if (!response.ok) {
        let errorDetail = `Status HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.error && errJson.error.message) {
            errorDetail += `: ${errJson.error.message}`;
          }
        } catch (_) {
          // Caso a resposta não seja JSON
        }

        // Sanitização de segurança: nunca expor apiKey
        const sanitizedDetail = errorDetail.replace(new RegExp(apiKey, "g"), "[CHAVE_PROTEGIDA]");
        return {
          success: false,
          error: `Falha na comunicação com a API (${sanitizedDetail}).`
        };
      }

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

        // Formato OpenAI Chat Completions
        replyText = data.choices[0].message.content;

    } else if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts
    ) {

        // Formato Gemini
        replyText = data.candidates[0].content.parts
            .map(p => p.text || "")
            .join("");

    } else if (typeof data === "string") {

        replyText = data;

    } else {

        console.error("Formato de resposta não reconhecido:", data);
        replyText = "Desculpe, não consegui interpretar a resposta. Tente novamente.";

    }

      return {
        success: true,
        text: replyText.trim()
      };
    } catch (err) {
      // Protege contra vazamento acidental em stack trace ou mensagem
      let safeMsg = err.message || "Erro desconhecido ao conectar com a API.";
      if (apiKey) {
        safeMsg = safeMsg.replace(new RegExp(apiKey, "g"), "[CHAVE_PROTEGIDA]");
      }

      return {
        success: false,
        error: `Não foi possível conectar ao endpoint informado: ${safeMsg}`
      };
    }
  }

  return {
    sendChatMessage
  };
})();
