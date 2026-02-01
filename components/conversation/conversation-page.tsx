"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  ConversationTurn,
  ConversationContext,
  UserResponse,
  NextTurnResponse,
  SideEffect,
} from "@/lib/types/conversation";
import type { Vacation } from "@/lib/types/database";
import type { TurnRendererContext } from "./turn-renderer";
import { confirmBoxInChat, swapItem, removeItem, editBoxInChat } from "@/app/actions/box";
import { addItem } from "@/app/actions/add-item";
import { ChatContainer } from "./chat-container";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

/** Replace placeholder boxId in box-image components with the real one. */
function patchBoxImageIds(turn: ConversationTurn, realBoxId: string) {
  for (const comp of turn.components) {
    if (comp.type === "box-image" && comp.props.boxId === "CURRENT_BOX") {
      comp.props.boxId = realBoxId;
    }
  }
}

/**
 * If a confirm side-effect exists but the turn has no box-image component,
 * inject one so the user always sees the image after confirming.
 */
function ensureBoxImageOnConfirm(
  turn: ConversationTurn,
  sideEffects: SideEffect[] | undefined,
  realBoxId: string,
  itemDetails?: Record<string, { emoji: string; category: string }>
) {
  const hasConfirm = sideEffects?.some((e) => e.type === "confirm-box");
  if (!hasConfirm) return;

  const hasBoxImage = turn.components.some((c) => c.type === "box-image");
  if (hasBoxImage) return;

  const items = itemDetails
    ? Object.entries(itemDetails).map(([name, d]) => ({ name, emoji: d.emoji }))
    : [];

  turn.components.push({
    type: "box-image",
    props: { boxId: realBoxId, items },
  });
}

type ConversationPageProps = {
  context: ConversationContext;
  boxId: string;
  userSlug: string;
  vacation?: Vacation | null;
  /** Map of item names to their box_item IDs and item IDs for executing swaps */
  itemIdMap: Record<string, { boxItemId: string; itemId: string }>;
  /** Map of item names to item IDs for swap targets */
  availableItemMap: Record<string, string>;
  /** Full available items for quick-add rendering */
  availableItemsFull: Array<{ id: string; name: string; emoji: string; category: "vegetable" | "fruit" }>;
  /** Map of item names to emoji + category for rich rendering */
  itemDetails?: Record<string, { emoji: string; category: string }>;
  forceFallback?: boolean;
};

export function ConversationPage({
  context,
  boxId,
  userSlug,
  vacation,
  itemIdMap,
  availableItemMap,
  availableItemsFull,
  itemDetails,
  forceFallback = false,
}: ConversationPageProps) {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const turnRendererCtx = useMemo<TurnRendererContext>(
    () => ({
      boxId,
      userSlug,
      vacation,
      availableItemsFull,
      itemDetails,
    }),
    [boxId, userSlug, vacation, availableItemsFull, itemDetails]
  );

  const fetchNextTurn = useCallback(
    async (
      history: ConversationTurn[],
      lastResponse: UserResponse | null
    ): Promise<NextTurnResponse | null> => {
      try {
        const params = forceFallback ? "?fallback=1" : "";
        const res = await fetch(`/api/conversation/next-turn${params}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context, history, lastResponse }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error?.message ?? "Something went wrong.");
          return null;
        }

        return data as NextTurnResponse;
      } catch {
        setError("Failed to connect. Please try again.");
        return null;
      }
    },
    [context, forceFallback]
  );

  const executeSideEffects = useCallback(
    async (effects: SideEffect[]) => {
      for (const effect of effects) {
        switch (effect.type) {
          case "confirm-box":
            await confirmBoxInChat(boxId);
            break;
          case "swap-item": {
            const fromInfo = itemIdMap[effect.fromItem];
            const toItemId = availableItemMap[effect.toItem];
            if (fromInfo && toItemId) {
              await swapItem(boxId, fromInfo.boxItemId, toItemId);
            }
            break;
          }
          case "remove-item": {
            const removeInfo = itemIdMap[effect.itemName];
            if (removeInfo) {
              await removeItem(boxId, removeInfo.boxItemId);
            }
            break;
          }
          case "add-item": {
            const addItemId = availableItemMap[effect.itemName];
            if (addItemId) {
              await addItem(boxId, addItemId);
            }
            break;
          }
          case "edit-box":
            await editBoxInChat(boxId);
            setDone(false);
            break;
          case "skip-week":
            // No auto-execution — the ConvSkipWeek component handles this
            // via its own button + confirmation modal.
            break;
        }
      }
    },
    [boxId, itemIdMap, availableItemMap]
  );

  const processTurn = useCallback(
    (result: NextTurnResponse) => {
      patchBoxImageIds(result.turn, boxId);
      ensureBoxImageOnConfirm(result.turn, result.sideEffects, boxId, itemDetails);
    },
    [boxId, itemDetails]
  );

  // Fetch first turn on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      const result = await fetchNextTurn([], null);
      if (cancelled) return;

      if (result) {
        processTurn(result);
        setTurns([result.turn]);
        setDone(result.done ?? false);
        if (result.sideEffects) {
          void executeSideEffects(result.sideEffects);
        }
      }
      setLoading(false);
    }

    void init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserResponse = useCallback(
    async (response: UserResponse) => {
      if (loading) return;

      setLoading(true);
      setError(null);

      const newHistory = [...turns];
      const result = await fetchNextTurn(newHistory, response);

      if (result) {
        processTurn(result);
        setTurns((prev) => [...prev, result.turn]);
        setDone(result.done ?? false);
        if (result.sideEffects) {
          void executeSideEffects(result.sideEffects);
        }
      }

      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, turns, fetchNextTurn, executeSideEffects, processTurn]
  );

  const handleTextSubmit = useCallback(
    (text: string) => {
      const response: UserResponse = {
        turnId: turns.length > 0 ? turns[turns.length - 1].id : "init",
        componentType: "text-input",
        action: "send",
        payload: { text },
        timestamp: Date.now(),
      };
      void handleUserResponse(response);
    },
    [turns, handleUserResponse]
  );

  const activeTurnId =
    !loading && turns.length > 0 ? turns[turns.length - 1].id : null;

  return (
    <ChatContainer>
      <MessageList
        turns={turns}
        activeTurnId={activeTurnId}
        onResponse={handleUserResponse}
        isTyping={loading}
        ctx={turnRendererCtx}
      />

      <div className="sticky bottom-0 shrink-0 z-10">
        {error && (
          <div className="px-4 pb-2">
            <div role="alert" className="alert alert-error">
              <span>{error}</span>
            </div>
          </div>
        )}

        <ChatInput
          onSubmit={handleTextSubmit}
          disabled={loading}
        />
      </div>
    </ChatContainer>
  );
}
