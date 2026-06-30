"use client";

import { motion } from "framer-motion";
import { MODELS, modelTint, SPRING_LAYOUT } from "./constants";
import type { Model } from "./types";

type ModelSwitcherProps = {
  activeModel: Model;
  onSelect: (model: Model) => void;
};

export function ModelSwitcher({ activeModel, onSelect }: ModelSwitcherProps) {
  return (
    <div className="relative flex items-center gap-0.5">
      {MODELS.map((model) => {
        const isActive = model.label === activeModel.label;

        return (
          <button
            key={model.label}
            type="button"
            onClick={() => onSelect(model)}
            className="relative z-10 flex flex-1 cursor-pointer flex-col items-center rounded-lg bg-transparent px-3 py-1.5"
          >
            {isActive && (
              <motion.div
                layoutId="model-pill"
                className="absolute inset-0 rounded-lg"
                style={{
                  background: modelTint(model.color, "18"),
                  border: `1px solid ${modelTint(model.color, "22")}`,
                }}
                transition={SPRING_LAYOUT}
              />
            )}
            <span
              className="relative z-10 text-[11px] font-semibold transition-colors duration-150"
              style={{ color: isActive ? model.color : "rgba(255,255,255,0.50)" }}
            >
              {model.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
