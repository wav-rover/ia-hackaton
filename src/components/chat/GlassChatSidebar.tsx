"use client";

import { Plus, Trash, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GLASS_BLUR,
  GLASS_PANEL,
  SPRING_TRANSITION,
} from "@/components/glass-ai-compose/constants";
import type { ConversationSummary } from "@/lib/chat-api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type GlassChatSidebarProps = {
  chats: ConversationSummary[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onNewChat: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
};

type ChatListItemProps = {
  title: string;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
};

function ChatListItem({ title, isActive, onSelect, onDelete }: ChatListItemProps) {
  return (
    <div
      className={cn(
        "group relative isolate flex min-w-0 w-full items-center gap-0.5 overflow-hidden rounded-lg pr-0.5 transition-colors",
        !isActive && "hover:bg-white/[0.06]",
      )}
      style={
        isActive
          ? {
              background: GLASS_PANEL.background,
              border: GLASS_PANEL.border,
              boxShadow: GLASS_PANEL.boxShadow,
            }
          : undefined
      }
    >
      {isActive && (
        <div
          className="pointer-events-none absolute inset-0 z-[-1] rounded-lg"
          style={GLASS_BLUR}
        />
      )}
      <button
        type="button"
        onClick={onSelect}
        title={title}
        className={cn(
          "min-w-0 flex-1 overflow-hidden px-2 py-1.5 text-left text-xs transition-colors",
          isActive ? "text-white/90" : "text-white/55 group-hover:text-white/75",
        )}
      >
        <span className="block truncate">{title}</span>
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        aria-label={`Supprimer ${title}`}
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-white/30 opacity-0 transition-all hover:bg-white/[0.08] hover:text-white/70 group-hover:opacity-100"
      >
        <Trash size={11} weight="bold" />
      </button>
    </div>
  );
}

export default function GlassChatSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
  isOpen = true,
  onClose,
  className,
}: GlassChatSidebarProps) {
  const handleSelectChat = (id: string) => {
    onSelectChat(id);
    onClose?.();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={SPRING_TRANSITION}
          className={cn("flex h-full w-full flex-col", className)}
        >
          <div
            className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
            style={{
              background: GLASS_PANEL.background,
              border: GLASS_PANEL.border,
              boxShadow: GLASS_PANEL.boxShadow,
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 z-[-1] rounded-xl"
              style={GLASS_BLUR}
            />

            <div className="absolute left-4 right-4 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative z-10 flex shrink-0 items-center justify-between gap-1 px-2 py-2">
              <span className="text-[10px] font-medium text-white/35">Chats</span>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handleNewChat}
                  aria-label="Nouvelle conversation"
                  className="flex size-6 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/80"
                >
                  <Plus size={12} weight="bold" />
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer le menu"
                    className="flex size-6 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/80 md:hidden"
                  >
                    <X size={12} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            <ScrollArea className="relative z-10 min-h-0 flex-1 w-full [&>[data-radix-scroll-area-viewport]>div]:!block [&>[data-radix-scroll-area-viewport]>div]:min-w-0">
              <div className="flex w-full min-w-0 flex-col gap-0.5 px-1.5 pb-2">
                {chats.map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    title={chat.title}
                    isActive={activeChatId === chat.id}
                    onSelect={() => handleSelectChat(chat.id)}
                    onDelete={() => onDeleteChat(chat.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
