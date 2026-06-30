import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  buildConversationTitle,
  getChatSessionIdFromRequest,
} from "@/server/conversations";
import { db } from "@/server/db";

export async function GET(request: Request) {
  const sessionId = getChatSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "Session chat manquante" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id;

  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ sessionId }, ...(userId ? [{ userId }] : [])],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const sessionId = getChatSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "Session chat manquante" }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id;

  let title = "Nouvelle conversation";
  try {
    const body = (await request.json()) as { title?: string };
    if (typeof body.title === "string" && body.title.trim()) {
      title = buildConversationTitle(body.title);
    }
  } catch {
    // Body optionnel pour une nouvelle conversation vide.
  }

  const conversation = await db.conversation.create({
    data: {
      title,
      sessionId,
      ...(userId ? { userId } : {}),
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
