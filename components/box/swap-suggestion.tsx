"use client";

import { useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { SwapSuggestion as SwapSuggestionType } from "@/lib/types/patterns";
import { acceptSuggestion, rejectSuggestion } from "@/app/actions/suggestions";

type SwapSuggestionProps = {
  suggestion: SwapSuggestionType;
  boxId: string;
};

export function SwapSuggestionCard({ suggestion, boxId }: SwapSuggestionProps) {
  const [dismissed, setDismissed] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isAccepting, startAccepting] = useTransition();
  const [, startRejecting] = useTransition();
  const prefersReducedMotion = useReducedMotion();

  if (dismissed || accepted) return null;

  const handleAccept = () => {
    setAccepted(true);
    startAccepting(async () => {
      const result = await acceptSuggestion(
        boxId,
        suggestion.patternId,
        suggestion.fromItem.id,
        suggestion.toItem.id
      );
      if (!result.success) {
        setAccepted(false);
        alert(result.error);
      }
    });
  };

  const handleDismiss = () => {
    setDismissed(true);
    startRejecting(async () => {
      await rejectSuggestion(suggestion.patternId);
    });
  };

  return (
    <motion.div
      layout={!prefersReducedMotion}
      initial={prefersReducedMotion ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        prefersReducedMotion
          ? { opacity: 0 }
          : accepted
            ? { opacity: 0, scale: 1.05, transition: { duration: 0.2 } }
            : { opacity: 0, x: 80, transition: { duration: 0.2 } }
      }
      transition={{ duration: 0.3 }}
      role="region"
      aria-label={`Suggestion: swap ${suggestion.fromItem.name} for ${suggestion.toItem.name}`}
      className="card card-border bg-base-100 p-4 transition-colors duration-300 motion-reduce:transition-none"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-lg">
          <span aria-hidden="true">{suggestion.fromItem.emoji}</span>
          <span className="font-medium">{suggestion.fromItem.name}</span>
          <span aria-hidden="true" className="text-base-content/40">→</span>
          <span aria-hidden="true">{suggestion.toItem.emoji}</span>
          <span className="font-medium">{suggestion.toItem.name}</span>
          <span className="sr-only">
            Swap {suggestion.fromItem.name} for {suggestion.toItem.name}
          </span>
        </div>
      </div>

      <p className="mt-1 text-sm text-base-content/60">
        {suggestion.reason}
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isAccepting}
          className="btn btn-primary btn-sm min-h-[44px] min-w-[44px] flex-1 transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
        >
          {isAccepting ? "Swapping\u2026" : "Accept"}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="btn btn-ghost btn-sm min-h-[44px] min-w-[44px] flex-1 transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}
