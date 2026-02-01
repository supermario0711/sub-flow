"use client";

import { useRef } from "react";
import type { ConversationTurn, UserResponse } from "@/lib/types/conversation";
import { TurnRenderer, type TurnRendererContext } from "./turn-renderer";
import { TypingIndicator } from "./typing-indicator";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";

type MessageListProps = {
  turns: ConversationTurn[];
  activeTurnId: string | null;
  onResponse: (response: UserResponse) => void;
  isTyping?: boolean;
  ctx: TurnRendererContext;
};

export function MessageList({
  turns,
  activeTurnId,
  onResponse,
  isTyping = false,
  ctx,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isAtBottom, scrollToBottom } = useScrollToBottom(scrollRef);

  return (
    <div className="relative flex-1">
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto touch-pan-y"
      >
        <div className="mx-auto max-w-3xl px-2 md:px-4 py-6 flex flex-col gap-4 md:gap-6">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className="animate-in fade-in duration-200"
            >
              <TurnRenderer
                turn={turn}
                isActive={turn.id === activeTurnId}
                onResponse={onResponse}
                ctx={ctx}
              />
            </div>
          ))}

          <TypingIndicator visible={isTyping} />

          <div className="min-h-[24px] min-w-[24px] shrink-0" />
        </div>
      </div>

      {/* Scroll-to-bottom button */}
      <button
        type="button"
        onClick={() => scrollToBottom()}
        aria-label="Scroll to bottom"
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 btn btn-circle btn-sm bg-base-100 shadow-md border border-base-300 transition-all duration-200 ${
          isAtBottom
            ? "scale-0 opacity-0 pointer-events-none"
            : "scale-100 opacity-100"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
