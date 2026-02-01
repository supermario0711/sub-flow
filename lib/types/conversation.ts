import { z } from "zod";

// --- Turn structure ---

export type ConversationTurn = {
  id: string;
  role: "assistant";
  components: ConversationComponent[];
  timestamp: number;
};

export type ConversationComponent =
  | MessageComponent
  | RadioQuestionComponent
  | UrgentBannerConvComponent
  | BoxGridConvComponent
  | SwapSuggestionConvComponent
  | QuickConfirmConvComponent
  | BoxImageConvComponent
  | QuickAddConvComponent
  | AddItemConvComponent
  | SkipWeekConvComponent
  | VacationCardConvComponent
  | VacationBannerConvComponent;

// --- Component types ---

export type MessageComponent = {
  type: "message";
  props: {
    text: string;
    tone: "greeting" | "suggestion" | "confirmation" | "info";
  };
};

export type RadioQuestionComponent = {
  type: "radio-question";
  props: {
    questionId: string;
    question: string;
    options: Array<{
      id: string;
      label: string;
      description?: string;
    }>;
  };
};

export type UrgentBannerConvComponent = {
  type: "urgent-banner";
  props: {
    hours: number;
    severity: "warning" | "critical";
  };
};

export type BoxGridConvComponent = {
  type: "box-grid";
  props: {
    items: string[];
    compact: boolean;
    showSwapButtons: boolean;
    /** When true, shows a summary with item count + expand button instead of the full grid. */
    collapsed?: boolean;
  };
};

export type SwapSuggestionConvComponent = {
  type: "swap-suggestion";
  props: {
    suggestionId: string;
    fromItem: string;
    toItem: string;
    reason: string;
    confidence: number;
  };
};

export type QuickConfirmConvComponent = {
  type: "quick-confirm";
  props: {
    label: string;
    prominent: boolean;
  };
};

export type BoxImageConvComponent = {
  type: "box-image";
  props: {
    boxId: string;
    items: Array<{ name: string; emoji: string }>;
  };
};

export type QuickAddConvComponent = {
  type: "quick-add";
  props: {
    /** Suggested item names to show as pill buttons (must be from availableItems). */
    suggestions: string[];
  };
};

export type AddItemConvComponent = {
  type: "add-item";
  props: {
    /** Prompt text shown above the search sheet trigger. */
    prompt: string;
  };
};

export type SkipWeekConvComponent = {
  type: "skip-week";
  props: {
    label: string;
  };
};

export type VacationCardConvComponent = {
  type: "vacation-card";
  props: Record<string, never>;
};

export type VacationBannerConvComponent = {
  type: "vacation-banner";
  props: Record<string, never>;
};

// --- User responses ---

export type UserResponse = {
  turnId: string;
  componentType: ConversationComponent["type"] | "text-input";
  action: string;
  payload: Record<string, unknown>;
  timestamp: number;
};

// --- Conversation context ---

export type ConversationContext = {
  hoursUntilLock: number;
  timeContext: "urgent" | "balanced" | "relaxed";
  boxItems: Array<{
    id: string;
    name: string;
    category: "VEGETABLE" | "FRUIT";
  }>;
  /** Items available for swapping/adding (not currently in the box). */
  availableItems: Array<{
    name: string;
    category: "VEGETABLE" | "FRUIT";
  }>;
  isNewUser: boolean;
  patterns: Array<{
    type: "item_dislike" | "item_preference";
    itemName: string;
    confidence: number;
    occurrences: number;
  }>;
  /** Whether the user currently has an active vacation scheduled. */
  hasActiveVacation: boolean;
};

// --- API request/response ---

export type NextTurnRequest = {
  context: ConversationContext;
  history: ConversationTurn[];
  lastResponse: UserResponse | null;
};

export type NextTurnResponse = {
  success: boolean;
  turn: ConversationTurn;
  done: boolean;
  fallback?: boolean;
  sideEffects?: SideEffect[];
};

export type SideEffect =
  | { type: "confirm-box" }
  | { type: "swap-item"; fromItem: string; toItem: string }
  | { type: "remove-item"; itemName: string }
  | { type: "add-item"; itemName: string }
  | { type: "edit-box" }
  | { type: "skip-week" };

// --- Zod schema for API validation ---

const conversationContextSchema = z.object({
  hoursUntilLock: z.number(),
  timeContext: z.enum(["urgent", "balanced", "relaxed"]),
  boxItems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.enum(["VEGETABLE", "FRUIT"]),
    })
  ),
  availableItems: z.array(
    z.object({
      name: z.string(),
      category: z.enum(["VEGETABLE", "FRUIT"]),
    })
  ),
  isNewUser: z.boolean(),
  hasActiveVacation: z.boolean(),
  patterns: z.array(
    z.object({
      type: z.enum(["item_dislike", "item_preference"]),
      itemName: z.string(),
      confidence: z.number(),
      occurrences: z.number(),
    })
  ),
});

const conversationTurnSchema = z.object({
  id: z.string(),
  role: z.literal("assistant"),
  components: z.array(z.record(z.string(), z.unknown())),
  timestamp: z.number(),
});

const userResponseSchema = z.object({
  turnId: z.string(),
  componentType: z.string(),
  action: z.string(),
  payload: z.record(z.string(), z.unknown()),
  timestamp: z.number(),
});

export const nextTurnRequestSchema = z.object({
  context: conversationContextSchema,
  history: z.array(conversationTurnSchema),
  lastResponse: userResponseSchema.nullable(),
});
