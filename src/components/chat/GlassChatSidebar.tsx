"use client";

import { Plus, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING_TRANSITION } from "@/components/glass-ai-compose/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const MOCK_CHATS = [
  { id: "1", title: "Analyse bilan Q4", preview: "Résumé des résultats financiers…" },
  { id: "2", title: "Stratégie produit 2026", preview: "Roadmap et priorités…" },
  { id: "3", title: "Rapport conformité", preview: "Points de vigilance réglementaire…" },
  { id: "4", title: "Support client — Lot #482", preview: "Suivi des réclamations…" },
  { id: "5", title: "Audit interne Q1", preview: "Synthèse des contrôles…" },
  { id: "6", title: "Note de cadrage IA", preview: "Cas d'usage prioritaires…" },
] as const;

type GlassChatSidebarProps = {
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
};

type ChatListItemProps = {
  title: string;
  isActive: boolean;
  onSelect: () => void;
};

function ChatListItem({ title, isActive, onSelect }: ChatListItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full truncate rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
        isActive
          ? "bg-neutral-800 text-white/90"
          : "text-white/55 hover:bg-neutral-800/60 hover:text-white/75",
      )}
    >
      {title}
    </button>
  );
}

export default function GlassChatSidebar({
  activeChatId,
  onSelectChat,
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
          className={cn(
            "fixed top-20 mt-2 left-4 z-40 w-[min(200px,calc(100vw-2rem))]",
            className,
          )}
        >
          <div className="flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
            <div className="flex shrink-0 items-center justify-between gap-1 px-2 py-2">
              <span className="text-[10px] font-medium text-white/35">Chats</span>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handleNewChat}
                  aria-label="Nouvelle conversation"
                  className="flex size-6 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-neutral-800 hover:text-white/80"
                >
                  <Plus size={12} weight="bold" />
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer le menu"
                    className="flex size-6 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-neutral-800 hover:text-white/80 md:hidden"
                  >
                    <X size={12} weight="bold" />
                  </button>
                )}
              </div>
            </div>

            <ScrollArea className="h-56">
              <div className="flex flex-col gap-0.5 px-1.5 pb-2">
                {MOCK_CHATS.map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    title={chat.title}
                    isActive={activeChatId === chat.id}
                    onSelect={() => handleSelectChat(chat.id)}
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
