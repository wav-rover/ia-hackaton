"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GLASS_BLUR, GLASS_PANEL, SPRING_TRANSITION } from "@/components/glass-ai-compose/constants";
import { DotmHex7 } from "@/components/ui/dotm-hex-7";
import type { ChatMessage } from "@/components/glass-ai-compose/types";
import { DotmCircular7 } from "../ui/dotm-circular-7";

type MessageProps = {
  message: ChatMessage;
};

const ThinkingIndicator = () => (
  <div className="flex items-center py-0.5">
    <DotmCircular7
      size={20}
      dotSize={3}
      speed={1.2}
      bloom
    />
  </div>
);

export default function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  if (message.isPending && !isUser) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_TRANSITION}
        className="flex w-full justify-start"
      >
        <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5">
          <ThinkingIndicator />
        </div>
      </motion.div>
    );
  }

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

        {message.content !== "" && (
          <p className="whitespace-pre-wrap break-words font-sans text-sm font-medium text-white/90">
            {message.content}
          </p>
        )}
      </div>
    </motion.div>
  );
}
