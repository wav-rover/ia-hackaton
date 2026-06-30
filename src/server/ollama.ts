import { MessageRole } from "@/generated/prisma/client";

/**
 * Branchement au serveur Ollama (VM 306).
 *
 * Configuration via variables d'environnement (voir .env.example) :
 *   - OLLAMA_BASE_URL     : URL de base de l'API Ollama, ex. http://10.0.0.42:11434
 *                           (laisser vide => on garde la réponse simulée)
 *   - OLLAMA_MODEL        : nom du modèle servi par Ollama, ex. "llama3.1"
 *   - OLLAMA_API_KEY      : (optionnel) jeton Bearer si l'API est protégée
 *   - OLLAMA_SYSTEM_PROMPT: (optionnel) consigne système ajoutée en tête
 */

const REQUEST_TIMEOUT_MS = 60_000;

function getOllamaConfig() {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL?.trim().replace(/\/+$/, "") ?? "",
    model: process.env.OLLAMA_MODEL?.trim() ?? "",
    apiKey: process.env.OLLAMA_API_KEY?.trim(),
    systemPrompt: process.env.OLLAMA_SYSTEM_PROMPT?.trim(),
  };
}

export type ChatHistoryEntry = {
  role: MessageRole;
  content: string;
};

type OllamaRole = "system" | "user" | "assistant";

type OllamaMessage = {
  role: OllamaRole;
  content: string;
};

export function isOllamaConfigured(): boolean {
  const { baseUrl, model } = getOllamaConfig();
  return Boolean(baseUrl && model);
}

function toOllamaMessages(history: ChatHistoryEntry[], systemPrompt?: string): OllamaMessage[] {
  const messages: OllamaMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  for (const entry of history) {
    messages.push({
      role: entry.role === MessageRole.USER ? "user" : "assistant",
      content: entry.content,
    });
  }
  return messages;
}

function extractContent(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as {
    // Format natif Ollama: /api/chat
    message?: { content?: unknown };
    // Format compatible OpenAI: /v1/chat/completions
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  const native = payload.message?.content;
  if (typeof native === "string" && native.trim()) return native.trim();

  const openai = payload.choices?.[0]?.message?.content;
  if (typeof openai === "string" && openai.trim()) return openai.trim();

  return null;
}

/**
 * Interroge Ollama et renvoie la réponse de l'assistant.
 * Lève une erreur si Ollama n'est pas configuré ou répond mal :
 * l'appelant décide du repli (réponse simulée).
 */
export async function generateChatReply(history: ChatHistoryEntry[]): Promise<string> {
  const { baseUrl, model, apiKey, systemPrompt } = getOllamaConfig();

  if (!baseUrl) {
    throw new Error("OLLAMA_BASE_URL non configuré");
  }
  if (!model) {
    throw new Error("OLLAMA_MODEL non configuré");
  }

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages: toOllamaMessages(history, systemPrompt),
      stream: false,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Ollama a répondu ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data: unknown = await response.json();
  const content = extractContent(data);
  if (!content) {
    throw new Error("Réponse Ollama vide ou inattendue");
  }
  return content;
}
