"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { GlassToolbarButton } from "./GlassToolbarButton";
import { ImageThumbnail } from "./ImageThumbnail";
import {
  ACTIVE_GLOW,
  GLASS_BLUR,
  GLASS_PANEL,
  MAX_TEXTAREA_HEIGHT,
  modelTint,
  SPRING_SNAPPY,
  SPRING_TRANSITION,
} from "./constants";
import { cn } from "@/lib/utils";

function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  isEnabled: boolean,
  onOutsideClick: () => void,
) {
  useEffect(() => {
    if (!isEnabled) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isEnabled, onOutsideClick, ref]);
}

type GlassAiComposeProps = {
  onSend?: (text: string, images: string[]) => void;
  className?: string;
};

export default function GlassAiCompose({ onSend, className }: GlassAiComposeProps) {
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const reducedMotion = useReducedMotion() ?? false;
  const canSend = message.trim().length > 0 || images.length > 0;

  const deactivate = useCallback(() => setIsActive(false), []);
  useClickOutside(containerRef, isActive, deactivate);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, []);

  const resetComposer = useCallback(() => {
    setMessage("");
    setImages([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, []);

  const handleSend = () => {
    if (!canSend) return;
    onSend?.(message.trim(), images);
    resetComposer();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const removeImage = (index: number) => {
    setImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index));
  };

  const transition = reducedMotion ? { duration: 0.15 } : SPRING_TRANSITION;
  const iconTap = reducedMotion ? undefined : { scale: 0.88 };

  return (
    <div
      ref={containerRef}
      className={cn("relative z-10 w-[calc(100%-2rem)] max-w-[420px]", className)}
    >
      <motion.div
          animate={{ boxShadow: isActive ? ACTIVE_GLOW : GLASS_PANEL.boxShadow }}
          transition={transition}
          className="relative isolate overflow-hidden rounded-2xl"
          style={{
            background: GLASS_PANEL.background,
            border: GLASS_PANEL.border,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 z-[-1] rounded-2xl"
            style={GLASS_BLUR}
          />

          <div className="absolute left-6 right-6 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative z-10 flex flex-col gap-6 p-4 pb-2">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                resizeTextarea();
              }}
              onFocus={() => setIsActive(true)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message…"
              rows={1}
              className="w-full resize-none bg-transparent font-sans text-sm font-medium text-white/90 placeholder-white/40 outline-none"
              style={{
                caretColor: "#7DD3FC",
                maxHeight: MAX_TEXTAREA_HEIGHT,
              }}
            />

            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={transition}
                  className="flex gap-2 overflow-hidden"
                >
                  <AnimatePresence>
                    {images.map((src, index) => (
                      <ImageThumbnail
                        key={`${index}-${src.slice(-20)}`}
                        src={src}
                        onRemove={() => removeImage(index)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white/70">
                  Modèle{" "}
                  <span className="text-white/90">Phi-3.5-Financial</span>
                </span>
              </div>

              <GlassToolbarButton
                size="md"
                onClick={handleSend}
                disabled={!canSend}
                animate={{
                  background: canSend
                    ? modelTint("#7DD3FC", "40")
                    : "rgba(255, 255, 255, 0.06)",
                  border: canSend
                    ? `1px solid ${modelTint("#7DD3FC", "66")}`
                    : "1px solid rgba(255, 255, 255, 0.08)",
                }}
                whileHover={canSend && !reducedMotion ? { scale: 1.08 } : undefined}
                whileTap={canSend && !reducedMotion ? { scale: 0.88 } : undefined}
                transition={SPRING_SNAPPY}
              >
                <PaperPlaneRight
                  size={16}
                  weight="regular"
                  color={canSend ? "#7DD3FC" : "rgba(255, 255, 255, 0.3)"}
                />
              </GlassToolbarButton>
            </div>
          </div>

          <div className="mx-4 h-px bg-white/[0.07]" />
        </motion.div>
    </div>
  );
}
