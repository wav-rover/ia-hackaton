import { chatSessionHeaders } from "@/lib/chat-session";
import type { ChatMessage } from "@/components/glass-ai-compose/types";

export type ConversationSummary = {
  id: string;
  title: string;
};

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const response = await fetch("/api/conversations", {
    headers: chatSessionHeaders(),
  });
  const data = await parseJson<{ conversations: ConversationSummary[] }>(response);
  return data.conversations;
}

export async function createConversation(title?: string): Promise<ConversationSummary> {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...chatSessionHeaders(),
    },
    body: JSON.stringify(title ? { title } : {}),
  });
  const data = await parseJson<{ conversation: ConversationSummary }>(response);
  return data.conversation;
}

export async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    headers: chatSessionHeaders(),
  });
  const data = await parseJson<{ messages: ChatMessage[] }>(response);
  return data.messages;
}

export async function sendMessage(
  conversationId: string,
  content: string,
  images: string[],
): Promise<ChatMessage[]> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...chatSessionHeaders(),
    },
    body: JSON.stringify({
      content,
      ...(images.length > 0 ? { images } : {}),
    }),
  });
  const data = await parseJson<{ messages: ChatMessage[] }>(response);
  return data.messages;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: "DELETE",
    headers: chatSessionHeaders(),
  });
  await parseJson<{ success: boolean }>(response);
}
