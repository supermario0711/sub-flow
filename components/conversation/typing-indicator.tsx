"use client";

type TypingIndicatorProps = {
  visible: boolean;
};

export function TypingIndicator({ visible }: TypingIndicatorProps) {
  if (!visible) return null;

  return (
    <div
      className="group/message w-full animate-in fade-in duration-200"
      data-role="assistant"
      aria-busy="true"
      aria-label="Loading next message"
    >
      <div className="flex w-full items-start gap-3 justify-start">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-base-100 ring-1 ring-base-300"
          aria-hidden="true"
        >
          <span className="text-sm">🌿</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl bg-base-200 px-4 py-3">
          <span className="animate-pulse text-sm text-base-content/60">
            Thinking
          </span>
          <span className="flex items-center gap-0.5">
            <span
              className="inline-block size-1.5 animate-bounce rounded-full bg-base-content/40"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="inline-block size-1.5 animate-bounce rounded-full bg-base-content/40"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="inline-block size-1.5 animate-bounce rounded-full bg-base-content/40"
              style={{ animationDelay: "300ms" }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
