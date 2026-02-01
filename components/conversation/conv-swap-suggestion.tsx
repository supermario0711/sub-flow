"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type ConvSwapSuggestionProps = {
  suggestionId: string;
  fromItem: string;
  toItem: string;
  reason: string;
  confidence: number;
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
};

export function ConvSwapSuggestion({
  fromItem,
  toItem,
  reason,
  onAccept,
  onReject,
  disabled = false,
}: ConvSwapSuggestionProps) {
  const [responded, setResponded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isDisabled = disabled || responded;

  const handleAccept = () => {
    if (isDisabled) return;
    setResponded(true);
    onAccept();
  };

  const handleReject = () => {
    if (isDisabled) return;
    setResponded(true);
    onReject();
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="region"
      aria-label={`Suggestion: swap ${fromItem} for ${toItem}`}
      className="card card-border bg-base-100 p-4 transition-colors duration-300 motion-reduce:transition-none"
    >
      <div className="flex items-center gap-2 text-lg">
        <span className="font-medium">{fromItem}</span>
        <span aria-hidden="true" className="text-base-content/40">
          &rarr;
        </span>
        <span className="font-medium">{toItem}</span>
        <span className="sr-only">
          Swap {fromItem} for {toItem}
        </span>
      </div>

      <p className="mt-1 text-sm text-base-content/60">{reason}</p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isDisabled}
          className="btn btn-primary btn-sm min-h-[44px] min-w-[44px] flex-1 transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={isDisabled}
          className="btn btn-ghost btn-sm min-h-[44px] min-w-[44px] flex-1 transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}
