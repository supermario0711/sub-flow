"use client";

import { useTransition } from "react";
import { confirmBox } from "@/app/actions/box";

type TimeLayout = "urgent" | "browsing" | "locked";

type ConfirmButtonProps = {
  boxId: string;
  timeLayout: TimeLayout;
  isConfirmed?: boolean;
};

export function ConfirmButton({ boxId, timeLayout, isConfirmed }: ConfirmButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (timeLayout === "locked" || isConfirmed) {
    return null;
  }

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmBox(boxId);
      if (!result.success) {
        // redirect throws, so we only get here on error
        alert(result.error);
      }
    });
  };

  if (timeLayout === "urgent") {
    return (
      <div className="fixed bottom-0 left-0 right-0 border-t border-base-300 bg-base-100 p-4">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="btn btn-primary w-full min-h-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
          >
            {isPending ? "Confirming\u2026" : "Confirm Box Now"}
          </button>
        </div>
      </div>
    );
  }

  // browsing
  return (
    <button
      type="button"
      onClick={handleConfirm}
      disabled={isPending}
      className="btn btn-primary mt-6 w-full min-h-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
    >
      {isPending ? "Confirming\u2026" : "Confirm Box"}
    </button>
  );
}
