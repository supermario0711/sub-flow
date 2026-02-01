"use client";

type ChatContainerProps = {
  children: React.ReactNode;
};

export function ChatContainer({ children }: ChatContainerProps) {
  return (
    <div className="flex flex-col h-dvh bg-base-100 min-w-0 touch-pan-y overscroll-contain">
      {children}
    </div>
  );
}
