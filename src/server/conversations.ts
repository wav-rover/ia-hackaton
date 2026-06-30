import { MessageRole } from "@/generated/prisma/client";
import { db } from "@/server/db";

const CHAT_SESSION_HEADER = "x-chat-session";
const MAX_TITLE_LENGTH = 48;

export function getChatSessionIdFromRequest(request: Request): string | null {
  const sessionId = request.headers.get(CHAT_SESSION_HEADER)?.trim();
  return sessionId || null;
}

export async function findConversationForRequest(
  conversationId: string,
  sessionId: string,
  userId?: string,
) {
  return db.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ sessionId }, ...(userId ? [{ userId }] : [])],
    },
  });
}

export function buildConversationTitle(content: string): string {
  const normalized = content.trim().replace(/\s+/g, " ");
  if (!normalized) return "Nouvelle conversation";
  if (normalized.length <= MAX_TITLE_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_TITLE_LENGTH - 1)}…`;
}

export function toClientMessage(message: {
  id: string;
  role: MessageRole;
  content: string;
  images: unknown;
}) {
  return {
    id: message.id,
    role: message.role === MessageRole.USER ? ("user" as const) : ("assistant" as const),
    content: message.content,
    images: Array.isArray(message.images)
      ? message.images.filter((image): image is string => typeof image === "string")
      : undefined,
  };
}
