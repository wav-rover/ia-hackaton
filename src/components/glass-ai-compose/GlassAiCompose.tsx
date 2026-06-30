"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  PaperPlaneRight,
  ImageSquare,
  GlobeSimple,
} from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { GlassToolbarButton } from "./GlassToolbarButton";
import { ImageThumbnail } from "./ImageThumbnail";
import { ModelSwitcher } from "./ModelSwitcher";
import {
  ACTIVE_GLOW,
  GLASS_BLUR,
  GLASS_PANEL,
  MAX_TEXTAREA_HEIGHT,
  MODELS,
  modelTint,
  SPRING_SNAPPY,
  SPRING_TRANSITION,
  WEB_SEARCH_LABEL_DURATION_MS,
} from "./constants";
import { cn } from "@/lib/utils";
import type { Model } from "./types";

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

function useWebSearchLabel(isWebSearchEnabled: boolean) {
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    if (!isWebSearchEnabled) {
      setShowLabel(false);
      return;
    }

    setShowLabel(true);
    const timer = setTimeout(() => setShowLabel(false), WEB_SEARCH_LABEL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isWebSearchEnabled]);

  return showLabel;
}

type GlassAiComposeProps = {
  onSend?: (text: string, images: string[]) => void;
  className?: string;
};

export default function GlassAiCompose({ onSend, className }: GlassAiComposeProps) {
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState("");
  const [activeModel, setActiveModel] = useState<Model>(MODELS[0]);
  const [images, setImages] = useState<string[]>([]);
  const [webSearch, setWebSearch] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reducedMotion = useReducedMotion() ?? false;
  const showWebLabel = useWebSearchLabel(webSearch);
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result;
        if (typeof result === "string") {
          setImages((previous) => [...previous, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

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
  const iconHover = reducedMotion ? undefined : { scale: 1.08, background: "rgba(255, 255, 255, 0.14)" };
  const iconTap = reducedMotion ? undefined : { scale: 0.88 };
  const mutedIconColor = "rgba(255, 255, 255, 0.5)";

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
              placeholder="Ask anything..."
              rows={1}
              className="w-full resize-none bg-transparent font-sans text-sm font-medium text-white/90 placeholder-white/40 outline-none"
              style={{
                caretColor: activeModel.color,
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
                <GlassToolbarButton
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={iconHover}
                  whileTap={iconTap}
                >
                  <ImageSquare size={16} weight="regular" color={mutedIconColor} />
                </GlassToolbarButton>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <GlassToolbarButton
                  onClick={() => setWebSearch((value) => !value)}
                  whileHover={
                    reducedMotion
                      ? undefined
                      : {
                          scale: 1.08,
                          background: webSearch
                            ? modelTint(activeModel.color, "28")
                            : "rgba(255, 255, 255, 0.14)",
                        }
                  }
                  whileTap={iconTap}
                  style={{
                    background: webSearch
                      ? modelTint(activeModel.color, "18")
                      : "rgba(255, 255, 255, 0.08)",
                    border: webSearch
                      ? `1px solid ${modelTint(activeModel.color, "22")}`
                      : "1px solid rgba(255, 255, 255, 0.12)",
                    transition: "background 0.15s, border 0.15s",
                  }}
                >
                  <GlobeSimple
                    size={16}
                    weight="regular"
                    color={webSearch ? activeModel.color : mutedIconColor}
                  />
                </GlassToolbarButton>

                <AnimatePresence>
                  {showWebLabel && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.15 }}
                      className="text-[10px] font-semibold"
                      style={{ color: modelTint(activeModel.color, "88") }}
                    >
                      Web search on
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <GlassToolbarButton
                size="md"
                onClick={handleSend}
                disabled={!canSend}
                animate={{
                  background: canSend
                    ? modelTint(activeModel.color, "40")
                    : "rgba(255, 255, 255, 0.06)",
                  border: canSend
                    ? `1px solid ${modelTint(activeModel.color, "66")}`
                    : "1px solid rgba(255, 255, 255, 0.08)",
                }}
                whileHover={canSend && !reducedMotion ? { scale: 1.08 } : undefined}
                whileTap={canSend && !reducedMotion ? { scale: 0.88 } : undefined}
                transition={SPRING_SNAPPY}
              >
                <PaperPlaneRight
                  size={16}
                  weight="regular"
                  color={canSend ? activeModel.color : "rgba(255, 255, 255, 0.3)"}
                />
              </GlassToolbarButton>
            </div>
          </div>

          <div className="mx-4 h-px bg-white/[0.07]" />

          <div className="relative z-10 px-3 py-2.5">
            <ModelSwitcher activeModel={activeModel} onSelect={setActiveModel} />
          </div>
        </motion.div>
    </div>
  );
}
