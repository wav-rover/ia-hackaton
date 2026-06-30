"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const BACKGROUND_IMAGES = [
  "/images/bg.webp",
  "/images/bg-2.webp",
  "/images/bg-3.webp",
  "/images/bg-4.webp",
] as const;

const ROTATION_INTERVAL_MS = 10_000;
const CROSSFADE_DURATION_S = 3;
const KEN_BURNS_DURATION_S = ROTATION_INTERVAL_MS / 1000;

const CROSSFADE_EASE = [0.22, 1, 0.36, 1] as const;

export default function RotatingBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    BACKGROUND_IMAGES.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % BACKGROUND_IMAGES.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 scale-105 blur-xl">
        <AnimatePresence mode="sync" initial={false}>
          <motion.img
            key={BACKGROUND_IMAGES[currentIndex]}
            src={BACKGROUND_IMAGES[currentIndex]}
            alt=""
            initial={{ opacity: 0, scale: 1.07 }}
            animate={{ opacity: 0.5, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: CROSSFADE_DURATION_S, ease: CROSSFADE_EASE },
              scale: { duration: KEN_BURNS_DURATION_S, ease: [0.25, 0.1, 0.25, 1] },
            }}
            className="absolute inset-0 h-full w-full object-cover will-change-[opacity,transform]"
          />
        </AnimatePresence>
      </div>
    </div>
  );
}
