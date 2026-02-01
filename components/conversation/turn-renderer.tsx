"use client";

import type {
  ConversationTurn,
  ConversationComponent,
  UserResponse,
} from "@/lib/types/conversation";
import type { Vacation } from "@/lib/types/database";
import { Message } from "./message";
import { RadioQuestion } from "./radio-question";
import { ConvBoxGrid } from "./conv-box-grid";
import { ConvSwapSuggestion } from "./conv-swap-suggestion";
import { ConvQuickConfirm } from "./conv-quick-confirm";
import { ConvUrgentBanner } from "./conv-urgent-banner";
import { ConvBoxImage } from "./conv-box-image";
import { ConvQuickAdd } from "./conv-quick-add";
import { ConvAddItem } from "./conv-add-item";
import { ConvSkipWeek } from "./conv-skip-week";
import { ConvVacationCard } from "./conv-vacation-card";
import { ConvVacationBanner } from "./conv-vacation-banner";

export type TurnRendererContext = {
  boxId: string;
  userSlug: string;
  vacation?: Vacation | null;
  availableItemsFull: Array<{ id: string; name: string; emoji: string; category: "vegetable" | "fruit" }>;
  itemDetails?: Record<string, { emoji: string; category: string }>;
  onItemAdded?: (itemName: string) => void;
};

type TurnRendererProps = {
  turn: ConversationTurn;
  isActive: boolean;
  onResponse: (response: UserResponse) => void;
  ctx: TurnRendererContext;
};

function createResponse(
  turnId: string,
  componentType: ConversationComponent["type"],
  action: string,
  payload: Record<string, unknown> = {}
): UserResponse {
  return { turnId, componentType, action, payload, timestamp: Date.now() };
}

export function TurnRenderer({ turn, isActive, onResponse, ctx }: TurnRendererProps) {
  const disabled = !isActive;

  return (
    <div className="flex flex-col gap-3">
      {turn.components.map((component, i) => {
        const key = `${turn.id}-${component.type}-${i}`;

        switch (component.type) {
          case "message":
            return (
              <Message
                key={key}
                text={component.props.text}
                tone={component.props.tone}
              />
            );

          case "urgent-banner":
            return (
              <ConvUrgentBanner
                key={key}
                hoursUntilLock={component.props.hours}
                severity={component.props.severity}
              />
            );

          case "box-image":
            return (
              <ConvBoxImage
                key={key}
                boxId={component.props.boxId}
                items={component.props.items}
              />
            );

          case "box-grid":
            return (
              <ConvBoxGrid
                key={key}
                items={component.props.items}
                compact={component.props.compact}
                showSwapButtons={component.props.showSwapButtons}
                collapsed={component.props.collapsed}
                disabled={disabled}
                itemDetails={ctx.itemDetails}
                onSwapTap={(itemName) =>
                  onResponse(
                    createResponse(turn.id, "box-grid", "tap-swap", { itemName })
                  )
                }
                onRemoveTap={(itemName) =>
                  onResponse(
                    createResponse(turn.id, "box-grid", "tap-remove", { itemName })
                  )
                }
              />
            );

          case "radio-question":
            return (
              <RadioQuestion
                key={key}
                questionId={component.props.questionId}
                question={component.props.question}
                options={component.props.options}
                disabled={disabled}
                onSelect={(optionId) =>
                  onResponse(
                    createResponse(turn.id, "radio-question", "select", {
                      questionId: component.props.questionId,
                      optionId,
                    })
                  )
                }
              />
            );

          case "swap-suggestion":
            return (
              <ConvSwapSuggestion
                key={key}
                suggestionId={component.props.suggestionId}
                fromItem={component.props.fromItem}
                toItem={component.props.toItem}
                reason={component.props.reason}
                confidence={component.props.confidence}
                disabled={disabled}
                onAccept={() =>
                  onResponse(
                    createResponse(turn.id, "swap-suggestion", "accept", {
                      fromItem: component.props.fromItem,
                      toItem: component.props.toItem,
                    })
                  )
                }
                onReject={() =>
                  onResponse(
                    createResponse(turn.id, "swap-suggestion", "reject", {
                      fromItem: component.props.fromItem,
                      toItem: component.props.toItem,
                    })
                  )
                }
              />
            );

          case "quick-confirm":
            return (
              <ConvQuickConfirm
                key={key}
                label={component.props.label}
                prominent={component.props.prominent}
                disabled={disabled}
                onConfirm={() =>
                  onResponse(
                    createResponse(turn.id, "quick-confirm", "confirm")
                  )
                }
              />
            );

          case "quick-add":
            return (
              <ConvQuickAdd
                key={key}
                suggestions={component.props.suggestions}
                boxId={ctx.boxId}
                availableItems={ctx.availableItemsFull}
                disabled={disabled}
                onItemAdded={ctx.onItemAdded}
              />
            );

          case "add-item":
            return (
              <ConvAddItem
                key={key}
                prompt={component.props.prompt}
                boxId={ctx.boxId}
                disabled={disabled}
                onItemAdded={ctx.onItemAdded}
              />
            );

          case "skip-week":
            return (
              <ConvSkipWeek
                key={key}
                boxId={ctx.boxId}
                disabled={disabled}
              />
            );

          case "vacation-card":
            return (
              <ConvVacationCard
                key={key}
                userSlug={ctx.userSlug}
                disabled={disabled}
              />
            );

          case "vacation-banner":
            return ctx.vacation ? (
              <ConvVacationBanner
                key={key}
                vacation={ctx.vacation}
              />
            ) : null;

          default:
            return null;
        }
      })}
    </div>
  );
}
