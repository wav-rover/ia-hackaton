const CHAT_SESSION_KEY = "chat-session-id";

export function getChatSessionId(): string {
  if (typeof window === "undefined") return "";

  const existing = localStorage.getItem(CHAT_SESSION_KEY);
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  localStorage.setItem(CHAT_SESSION_KEY, sessionId);
  return sessionId;
}

export function chatSessionHeaders(): HeadersInit {
  return { "x-chat-session": getChatSessionId() };
}
