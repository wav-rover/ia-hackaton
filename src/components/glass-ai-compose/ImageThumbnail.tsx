"use client";

import { X } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { SPRING_TRANSITION } from "./constants";

type ImageThumbnailProps = {
  src: string;
  onRemove: () => void;
};

export function ImageThumbnail({ src, onRemove }: ImageThumbnailProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={SPRING_TRANSITION}
      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10"
    >
      <img src={src} alt="Upload preview" className="h-full w-full object-cover" />
      <motion.button
        type="button"
        onClick={onRemove}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.85 }}
        className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/60"
      >
        <X size={10} weight="regular" className="text-white/80" />
      </motion.button>
    </motion.div>
  );
}
