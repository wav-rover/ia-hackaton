import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import {
  findConversationForRequest,
  getChatSessionIdFromRequest,
} from "@/server/conversations";
import { db } from "@/server/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
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

  await db.conversation.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
