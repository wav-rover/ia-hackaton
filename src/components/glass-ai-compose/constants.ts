export const BACKGROUND_IMAGE_URL =
  "https://ik.imagekit.io/aitoolkit/bg%20images/Ethereal%20Orange%20Flower%204%20(1).png?updatedAt=1775226802133";

export const MAX_TEXTAREA_HEIGHT = 160;
export const WEB_SEARCH_LABEL_DURATION_MS = 1000;

export const GLASS_BLUR = {
  backdropFilter: "blur(24px) saturate(1.8)",
  WebkitBackdropFilter: "blur(24px) saturate(1.8)",
} as const;

export const GLASS_PANEL = {
  background: "rgba(255, 255, 255, 0.08)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow:
    "0 8px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
} as const;

export const ACTIVE_GLOW =
  "0 8px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 0 1.5px rgba(255, 255, 255, 0.25), 0 0 20px rgba(255, 255, 255, 0.06)";

export const SPRING_TRANSITION = { type: "spring" as const, stiffness: 350, damping: 28 };
export const SPRING_SNAPPY = { type: "spring" as const, stiffness: 320, damping: 20 };
export const SPRING_LAYOUT = { type: "spring" as const, stiffness: 400, damping: 28 };

export function modelTint(color: string, alpha: string) {
  return `${color}${alpha}`;
}
