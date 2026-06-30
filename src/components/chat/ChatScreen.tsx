"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, PanelLeft } from "lucide-react";
import GlassAiCompose from "@/components/glass-ai-compose";
import GlassChatSidebar from "@/components/chat/GlassChatSidebar";
import Message from "@/components/chat/Message";
import LogoTechCorpIndustries from "@/components/branding/LogoTechCorpIndustries";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { SPRING_LAYOUT } from "@/components/glass-ai-compose/constants";
import {
  createConversation,
  deleteConversation,
  fetchConversations,
  fetchMessages,
  sendMessage,
  type ConversationSummary,
} from "@/lib/chat-api";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/components/glass-ai-compose/types";

const AT_BOTTOM_THRESHOLD_PX = 24;
const AT_TOP_THRESHOLD_PX = 8;

const createPendingId = () => `pending-${Math.random().toString(36).slice(2)}`;

function updateScrollMetrics(element: HTMLDivElement) {
  const { scrollTop, scrollHeight, clientHeight } = element;
  const canScroll = scrollHeight - clientHeight > AT_TOP_THRESHOLD_PX;
  const atBottom =
    scrollHeight - scrollTop - clientHeight < AT_BOTTOM_THRESHOLD_PX;
  const scrolledFromTop = scrollTop > AT_TOP_THRESHOLD_PX;

  return {
    atBottom,
    showScrollButton: !atBottom,
    showTopBlur: canScroll && scrolledFromTop,
  };
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showTopBlur, setShowTopBlur] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const hasMessages = messages.length > 0;
  const isChatView = activeChatId !== null;
  const showWelcomeBadge = !isChatView && !hasMessages;
  const showMessageArea = isChatView && (hasMessages || isLoadingChat);

  const viewportRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const loadRequestRef = useRef(0);

  const refreshConversations = useCallback(async () => {
    const nextConversations = await fetchConversations();
    setConversations(nextConversations);
    return nextConversations;
  }, []);

  const syncScrollState = useCallback((element: HTMLDivElement) => {
    const metrics = updateScrollMetrics(element);
    isAtBottomRef.current = metrics.atBottom;
    setShowScrollButton(metrics.showScrollButton);
    setShowTopBlur(metrics.showTopBlur);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
  }, []);

  const handleViewportScroll = useCallback<React.UIEventHandler<HTMLDivElement>>(
    (event) => syncScrollState(event.currentTarget),
    [syncScrollState],
  );

  useEffect(() => {
    refreshConversations().catch(() => {
      setConversations([]);
    });
  }, [refreshConversations]);

  useEffect(() => {
    if (isAtBottomRef.current) scrollToBottom("smooth");
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    syncScrollState(viewport);

    const resizeObserver = new ResizeObserver(() => syncScrollState(viewport));
    resizeObserver.observe(viewport);

    return () => resizeObserver.disconnect();
  }, [messages, syncScrollState]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateIsDesktop = () => setIsDesktop(mediaQuery.matches);

    updateIsDesktop();
    mediaQuery.addEventListener("change", updateIsDesktop);

    return () => mediaQuery.removeEventListener("change", updateIsDesktop);
  }, []);

  const handleGoHome = useCallback(() => {
    setMessages([]);
    setActiveChatId(null);
    setShowScrollButton(false);
    setShowTopBlur(false);
    isAtBottomRef.current = true;
  }, []);

  const handleNewChat = useCallback(() => {
    handleGoHome();
  }, [handleGoHome]);

  const handleSelectChat = useCallback(async (id: string) => {
    const requestId = ++loadRequestRef.current;
    setActiveChatId(id);
    setMessages([]);
    setIsLoadingChat(true);
    setShowScrollButton(false);
    setShowTopBlur(false);

    try {
      const loadedMessages = await fetchMessages(id);
      if (requestId !== loadRequestRef.current) return;
      setMessages(loadedMessages);
      isAtBottomRef.current = true;
    } catch {
      if (requestId !== loadRequestRef.current) return;
      setMessages([]);
    } finally {
      if (requestId === loadRequestRef.current) {
        setIsLoadingChat(false);
      }
    }
  }, []);

  const handleDeleteChat = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id);
      } catch {
        return;
      }

      setConversations((previous) => previous.filter((chat) => chat.id !== id));

      if (activeChatId === id) {
        loadRequestRef.current += 1;
        handleGoHome();
      }
    },
    [activeChatId, handleGoHome],
  );

  const handleSend = useCallback(
    async (text: string, images: string[]) => {
      if (isSending) return;

      const pendingAssistantId = createPendingId();
      const optimisticUserMessage: ChatMessage = {
        id: createPendingId(),
        role: "user",
        content: text,
        images: images.length > 0 ? images : undefined,
      };
      const pendingAssistant: ChatMessage = {
        id: pendingAssistantId,
        role: "assistant",
        content: "",
        isPending: true,
      };

      isAtBottomRef.current = true;
      setShowScrollButton(false);
      setShowTopBlur(false);
      setMessages((previous) => [...previous, optimisticUserMessage, pendingAssistant]);
      setIsSending(true);

      try {
        let conversationId = activeChatId;
        if (!conversationId) {
          const conversation = await createConversation(text);
          conversationId = conversation.id;
          setActiveChatId(conversationId);
          setConversations((previous) => [conversation, ...previous]);
        }

        const savedMessages = await sendMessage(conversationId, text, images);

        setMessages((previous) => {
          const withoutOptimistic = previous.filter(
            (message) =>
              message.id !== optimisticUserMessage.id &&
              message.id !== pendingAssistantId,
          );
          return [...withoutOptimistic, ...savedMessages];
        });

        await refreshConversations();
      } catch {
        setMessages((previous) =>
          previous.filter(
            (message) =>
              message.id !== optimisticUserMessage.id &&
              message.id !== pendingAssistantId,
          ),
        );
      } finally {
        setIsSending(false);
      }
    },
    [activeChatId, isSending, refreshConversations],
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <img
        src="/images/bg.jpg"
        alt=""
        className="pointer-events-none fixed inset-0 blur-xl h-full w-full object-cover opacity-50"
      />

      <div className="relative z-10 flex h-screen flex-col">
        <Link
          href="/"
          onClick={handleGoHome}
          aria-label="Retour à l'accueil"
          className="fixed left-4 top-4 z-30 flex items-center gap-2 rounded-xl border border-gray-500/30 bg-neutral-950 px-3 py-3 text-sm font-semibold text-white/90 transition-opacity hover:opacity-90"
        >
          <LogoTechCorpIndustries />
        </Link>

        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Ouvrir les conversations"
          className={cn(
            "fixed top-20 left-4 z-30 flex size-7 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-white/50 transition-colors hover:bg-neutral-900 hover:text-white/75 md:hidden",
            isSidebarOpen && "pointer-events-none opacity-0",
          )}
        >
          <PanelLeft className="size-3.5" />
        </button>

        <AnimatePresence>
          {!isDesktop && isSidebarOpen && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-label="Fermer le menu"
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-black/40 md:hidden"
            />
          )}
        </AnimatePresence>

        {(isDesktop || isSidebarOpen) && (
          <div className="fixed top-20 mt-2 bottom-4 left-4 z-40 flex w-[min(200px,calc(100vw-2rem))] flex-col gap-5 md:bottom-8">
            <div className="min-h-0 flex-1">
              <GlassChatSidebar
                chats={conversations}
                activeChatId={activeChatId}
                onSelectChat={handleSelectChat}
                onDeleteChat={handleDeleteChat}
                onNewChat={handleNewChat}
                isOpen
                onClose={isDesktop ? undefined : () => setIsSidebarOpen(false)}
              />
            </div>

            <div className="mt-auto hidden shrink-0 overflow-hidden rounded-xl border border-gray-500/20 bg-neutral-950 px-2.5 py-2.5 md:block">
              <p className="text-[10px] font-medium text-white/75">Projet Hackathon IA</p>
              <p className="mt-1 text-[10px] leading-relaxed text-white/60">
                Interface chat pro pour interroger Phi-3.5-Financial, avec historique des conversations.
                Inférence locale via Ollama — le modèle tourne chez nous, l&apos;UI reste le point d&apos;entrée.
              </p>
            </div>
          </div>
        )}

        {showMessageArea && (
          <div className="relative min-h-0 flex-1">
            <ScrollArea
              type="scroll"
              className="h-full"
              viewportRef={viewportRef}
              onViewportScroll={handleViewportScroll}
            >
              <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 p-4">
                {messages.map((message) => (
                  <Message key={message.id} message={message} />
                ))}
              </div>
            </ScrollArea>

            <AnimatePresence>
              {showTopBlur && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20"
                >
                  <ProgressiveBlur position="top" height="100%" />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => scrollToBottom("smooth")}
                  aria-label="Revenir en bas"
                  className="absolute bottom-3 left-1/2 z-20 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-neutral-950 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
                >
                  <ArrowDown className="size-4 text-white/80" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}

        <motion.div
          layout
          transition={SPRING_LAYOUT}
          className={cn(
            "flex w-full flex-col items-center gap-3",
            hasMessages || isChatView ? "shrink-0 pb-6" : "flex-1 justify-center",
          )}
        >
          <GlassAiCompose onSend={handleSend} />

          <AnimatePresence>
            {showWelcomeBadge && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="flex max-w-[420px] items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-2 py-1 text-[9px] font-medium text-white/80 shadow-[0_8px_40px_rgba(0,0,0,0.4)] md:gap-2 md:px-3 md:py-1.5 md:text-[11px]"
              >
                <span className="flex-1 text-center">
                  Essayez le nouveau modèle de TechCorp Industries
                </span>
                <ArrowUpRight className="size-3 shrink-0 text-white/50 md:size-3.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
