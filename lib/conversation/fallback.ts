import type {
  ConversationContext,
  ConversationComponent,
  ConversationTurn,
} from "@/lib/types/conversation";

/**
 * Returns a deterministic first turn when Gemini fails.
 * Uses context to produce a sensible opening turn.
 */
export function getFallbackFirstTurn(
  context: ConversationContext
): ConversationTurn {
  const components: ConversationComponent[] = [];

  // Always start with a greeting
  components.push({
    type: "message",
    props: {
      text:
        context.timeContext === "urgent"
          ? "Your box locks soon \u2014 let\u0027s make sure it\u0027s right!"
          : "Hey! Here\u0027s your upcoming veggie box.",
      tone: "greeting",
    },
  });

  // Urgent: show banner
  if (context.timeContext === "urgent") {
    components.push({
      type: "urgent-banner",
      props: {
        hours: context.hoursUntilLock,
        severity: context.hoursUntilLock < 3 ? "critical" : "warning",
      },
    });
  }

  // Show box contents
  const isUrgent = context.timeContext === "urgent";
  components.push({
    type: "box-grid",
    props: {
      items: context.boxItems.map((i) => i.name),
      compact: isUrgent,
      showSwapButtons: !isUrgent,
      collapsed: isUrgent,
    },
  });

  // If strong dislike pattern, suggest swap
  const strongDislike = context.patterns.find(
    (p) =>
      p.type === "item_dislike" &&
      p.confidence >= 0.65 &&
      context.boxItems.some((i) => i.name === p.itemName)
  );

  if (strongDislike) {
    components.push({
      type: "swap-suggestion",
      props: {
        suggestionId: "fallback-swap-1",
        fromItem: strongDislike.itemName,
        toItem: "Zucchini",
        reason: `You\u0027ve swapped ${strongDislike.itemName} ${strongDislike.occurrences} times`,
        confidence: strongDislike.confidence,
      },
    });
  }

  // Urgent: show quick-add pills for fast additions
  if (isUrgent && context.availableItems.length > 0) {
    const preferredItems = context.patterns
      .filter((p) => p.type === "item_preference")
      .sort((a, b) => b.confidence - a.confidence)
      .map((p) => p.itemName)
      .filter((name) => context.availableItems.some((i) => i.name === name));

    const hasPreferences = preferredItems.length > 0;
    const suggestions = hasPreferences
      ? preferredItems.slice(0, 3)
      : context.availableItems.slice(0, 5).map((i) => i.name);

    components.push({
      type: "quick-add",
      props: { suggestions },
    });
  }

  // Quick confirm always last (unless urgent with suggestion — go straight to confirm)
  if (context.timeContext !== "urgent" || !strongDislike) {
    components.push({
      type: "quick-confirm",
      props: {
        label: context.timeContext === "urgent" ? "Looks Good!" : "Confirm Box",
        prominent: context.timeContext === "urgent",
      },
    });
  }

  return {
    id: "fallback-turn-1",
    role: "assistant",
    components,
    timestamp: Date.now(),
  };
}
