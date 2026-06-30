"use client";

import type { ReactNode } from "react";
import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { SPRING_SNAPPY } from "./constants";

type GlassToolbarButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  style?: React.CSSProperties;
  animate?: React.ComponentProps<typeof motion.button>["animate"];
  whileHover?: React.ComponentProps<typeof motion.button>["whileHover"];
  whileTap?: React.ComponentProps<typeof motion.button>["whileTap"];
  transition?: Transition;
  children: ReactNode;
};

export function GlassToolbarButton({
  onClick,
  disabled,
  size = "sm",
  className,
  style,
  animate,
  whileHover,
  whileTap,
  transition = SPRING_SNAPPY,
  children,
}: GlassToolbarButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      animate={animate}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={transition}
      className={cn(
        "flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.08]",
        size === "sm" && "h-8 w-8",
        size === "md" && "h-9 w-9",
        disabled && "pointer-events-none opacity-40",
        className,
      )}
      style={style}
    >
      {children}
    </motion.button>
  );
}
