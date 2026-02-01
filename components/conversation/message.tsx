"use client";

type MessageProps = {
  text: string;
  tone: "greeting" | "suggestion" | "confirmation" | "info";
};

const toneBubbleClass: Record<MessageProps["tone"], string> = {
  greeting: "",
  suggestion: "border-l-2 border-primary",
  confirmation: "bg-success/10",
  info: "",
};

const toneIcon: Record<MessageProps["tone"], string | null> = {
  greeting: null,
  suggestion: null,
  confirmation: "\u2713",
  info: null,
};

export function Message({ text, tone }: MessageProps) {
  const icon = toneIcon[tone];

  return (
    <div className="group/message w-full" data-role="assistant">
      <div className="flex w-full items-start gap-3 justify-start">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-base-100 ring-1 ring-base-300"
          aria-hidden="true"
        >
          <span className="text-sm">🌿</span>
        </div>
        <div className="flex flex-col gap-1 max-w-[80%]">
          <span className="text-xs text-base-content/60">Sub-Flow</span>
          <div
            className={`rounded-2xl bg-base-200 px-4 py-3 text-sm text-base-content ${toneBubbleClass[tone]}`}
          >
            {icon && (
              <span className="mr-1 inline-block" aria-hidden="true">
                {icon}
              </span>
            )}
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}
