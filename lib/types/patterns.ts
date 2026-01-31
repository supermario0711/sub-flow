import type { Item } from "./database";

export type PatternType = "item_dislike" | "item_preference";

export type SwapContext =
  | "user_initiated"
  | "suggestion_accepted"
  | "suggestion_rejected";

export type Pattern = {
  id: string;
  user_id: string;
  type: PatternType;
  item_id: string;
  confidence: number;
  occurrences: number;
  last_triggered_at: string | null;
  last_rejected_at: string | null;
  rejection_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SwapSuggestion = {
  fromItem: Pick<Item, "id" | "name" | "emoji">;
  toItem: Pick<Item, "id" | "name" | "emoji">;
  reason: string;
  confidence: number;
  patternId: string;
};
