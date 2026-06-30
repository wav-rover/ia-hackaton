"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GLASS_BLUR, GLASS_PANEL, SPRING_TRANSITION } from "@/components/glass-ai-compose/constants";
import type { ChatMessage } from "@/components/glass-ai-compose/types";

type MessageProps = {
  message: ChatMessage;
};

const TypingDots = () => (
  <div className="flex items-center gap-1 py-0.5">
    {[0, 1, 2].map((dot) => (
      <motion.span
        key={dot}
        className="size-1.5 rounded-full bg-white/60"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: dot * 0.18 }}
      />
    ))}
  </div>
);

export default function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_TRANSITION}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "relative isolate max-w-[80%] overflow-hidden rounded-2xl px-4 py-2.5",
          isUser ? "rounded-br-md" : "rounded-bl-md",
        )}
        style={{
          background: GLASS_PANEL.background,
          border: GLASS_PANEL.border,
          boxShadow: GLASS_PANEL.boxShadow,
        }}
      >
        <div className="pointer-events-none absolute inset-0 z-[-1]" style={GLASS_BLUR} />

        {message.images && message.images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.images.map((src, index) => (
              <img
                key={`${index}-${src.slice(-20)}`}
                src={src}
                alt=""
                className="size-20 rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        {message.isPending ? (
          <TypingDots />
        ) : (
          message.content !== "" && (
            <p className="whitespace-pre-wrap break-words font-sans text-sm font-medium text-white/90">
              {message.content}
            </p>
          )
        )}
      </div>
    </motion.div>
  );
}
