import type { MODELS } from "./constants";

export type Model = (typeof MODELS)[number];

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  images?: string[];
  isPending?: boolean;
};
