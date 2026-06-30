"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import GlassAiCompose from "@/components/glass-ai-compose";
import Message from "@/components/chat/Message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import {
  BACKGROUND_IMAGE_URL,
  GLASS_BLUR,
  GLASS_PANEL,
  SPRING_LAYOUT,
} from "@/components/glass-ai-compose/constants";
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
  const hasMessages = messages.length > 0;

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
        src={BACKGROUND_IMAGE_URL}
        alt=""
        className="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-60"
      />

      <div className="relative z-10 flex h-screen flex-col">
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
                  className="absolute bottom-3 left-1/2 z-20 flex size-9 -translate-x-1/2 items-center justify-center rounded-full"
                  style={{
                    background: GLASS_PANEL.background,
                    border: GLASS_PANEL.border,
                    boxShadow: GLASS_PANEL.boxShadow,
                    backdropFilter: GLASS_BLUR.backdropFilter,
                    WebkitBackdropFilter: GLASS_BLUR.WebkitBackdropFilter,
                  }}
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
            "flex w-full justify-center",
            hasMessages ? "shrink-0 pb-6" : "flex-1 items-center",
          )}
        >
          <GlassAiCompose onSend={handleSend} />
        </motion.div>
      </div>
    </div>
  );
}
