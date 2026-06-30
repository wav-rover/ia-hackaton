import { NextResponse } from "next/server";
import { z } from "zod";
import { MessageRole } from "@/generated/prisma/client";
import { auth } from "@/server/auth";
import {
  buildConversationTitle,
  findConversationForRequest,
  getChatSessionIdFromRequest,
  toClientMessage,
} from "@/server/conversations";
import { db } from "@/server/db";
import { generateChatReply } from "@/server/ollama";

const SIMULATED_REPLY =
  "Ceci est une réponse simulée pour la démo. La connexion à un vrai modèle viendra plus tard.";

const createMessageSchema = z.object({
  content: z.string().trim().min(1),
  images: z.array(z.string()).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const sessionId = getChatSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "Session chat manquante" }, { status: 400 });
  }

  const { id } = await context.params;
  const session = await auth();
  const conversation = await findConversationForRequest(
    id,
    sessionId,
    session?.user?.id,
  );

  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      images: true,
    },
  });

  return NextResponse.json({
    messages: messages.map(toClientMessage),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const sessionId = getChatSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "Session chat manquante" }, { status: 400 });
  }

  const { id } = await context.params;
  const session = await auth();
  const conversation = await findConversationForRequest(
    id,
    sessionId,
    session?.user?.id,
  );

  if (!conversation) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Message invalide" }, { status: 400 });
  }

  const { content, images } = parsed.data;
  const hasImages = images && images.length > 0;

  // Historique existant + nouveau message utilisateur, transmis au modèle.
  const priorMessages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  let assistantReply = SIMULATED_REPLY;
  try {
    assistantReply = await generateChatReply([
      ...priorMessages,
      { role: MessageRole.USER, content },
    ]);
  } catch (error) {
    console.error("Echec de l'appel au modèle Ollama, repli sur la réponse simulée:", error);
  }

  const [userMessage, assistantMessage] = await db.$transaction(async (tx) => {
    const createdUserMessage = await tx.message.create({
      data: {
        conversationId: id,
        role: MessageRole.USER,
        content,
        ...(hasImages ? { images } : {}),
      },
      select: {
        id: true,
        role: true,
        content: true,
        images: true,
      },
    });

    const createdAssistantMessage = await tx.message.create({
      data: {
        conversationId: id,
        role: MessageRole.ASSISTANT,
        content: assistantReply,
      },
      select: {
        id: true,
        role: true,
        content: true,
        images: true,
      },
    });

    const shouldUpdateTitle = conversation.title === "Nouvelle conversation";
    await tx.conversation.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        ...(shouldUpdateTitle ? { title: buildConversationTitle(content) } : {}),
      },
    });

    return [createdUserMessage, createdAssistantMessage];
  });

  return NextResponse.json({
    messages: [toClientMessage(userMessage), toClientMessage(assistantMessage)],
  });
}
