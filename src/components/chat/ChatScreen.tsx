"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, PanelLeft } from "lucide-react";
import GlassAiCompose from "@/components/glass-ai-compose";
import GlassChatSidebar, { MOCK_CHATS } from "@/components/chat/GlassChatSidebar";
import Message from "@/components/chat/Message";
import LogoTechCorpIndustries from "@/components/branding/LogoTechCorpIndustries";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { SPRING_LAYOUT } from "@/components/glass-ai-compose/constants";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/components/glass-ai-compose/types";

const SIMULATED_REPLY =
  "Ceci est une réponse simulée pour la démo. La connexion à un vrai modèle viendra plus tard.";
const SIMULATED_REPLY_DELAY_MS = 800;
const AT_BOTTOM_THRESHOLD_PX = 24;
const AT_TOP_THRESHOLD_PX = 8;

const createId = () => Math.random().toString(36).slice(2);

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
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showTopBlur, setShowTopBlur] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string>(MOCK_CHATS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const hasMessages = messages.length > 0;
  const isSidebarVisible = isDesktop || isSidebarOpen;

  const viewportRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

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
    setShowScrollButton(false);
    setShowTopBlur(false);
    isAtBottomRef.current = true;
  }, []);

  const handleNewChat = useCallback(() => {
    handleGoHome();
    setActiveChatId("new");
  }, [handleGoHome]);

  const handleSelectChat = useCallback((id: string) => {
    setActiveChatId(id);
  }, []);

  const handleSend = useCallback((text: string, images: string[]) => {
    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: text,
      images: images.length > 0 ? images : undefined,
    };
    const assistantId = createId();
    const pendingAssistant: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      isPending: true,
    };

    isAtBottomRef.current = true;
    setShowScrollButton(false);
    setShowTopBlur(false);
    setMessages((previous) => [...previous, userMessage, pendingAssistant]);

    setTimeout(() => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId
            ? { ...message, content: SIMULATED_REPLY, isPending: false }
            : message,
        ),
      );
    }, SIMULATED_REPLY_DELAY_MS);
  }, []);

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
          className="fixed left-4 top-4 z-30 flex items-center gap-2 rounded-xl border border-gray-500/10 bg-neutral-950 px-3 py-3 text-sm font-semibold text-white/90 transition-opacity hover:opacity-90"
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

        <GlassChatSidebar
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          isOpen={isSidebarVisible}
          onClose={isDesktop ? undefined : () => setIsSidebarOpen(false)}
        />

        {hasMessages && (
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
            hasMessages ? "shrink-0 pb-6" : "flex-1 justify-center",
          )}
        >
          <GlassAiCompose onSend={handleSend} />

          <AnimatePresence>
            {!hasMessages && (
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
