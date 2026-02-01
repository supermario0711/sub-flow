"use client";

import { useRef, useTransition } from "react";
import { skipWeek } from "@/app/actions/vacation";

type SkipButtonProps = {
  boxId: string;
  onSkipped?: () => void;
};

export function SkipButton({ boxId, onSkipped }: SkipButtonProps) {
  const [isPending, startTransition] = useTransition();
  const modalRef = useRef<HTMLDialogElement>(null);

  const handleSkip = () => {
    modalRef.current?.showModal();
  };

  const handleConfirm = () => {
    modalRef.current?.close();
    startTransition(async () => {
      const result = await skipWeek(boxId);
      if (!result.success) {
        alert(result.error);
      } else {
        onSkipped?.();
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleSkip}
        disabled={isPending}
        aria-label="Skip this week&apos;s box"
        className="btn btn-ghost btn-outline w-full min-h-[44px] mt-3 transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
      >
        {isPending ? "Skipping\u2026" : "Skip This Week"}
      </button>

      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle" aria-label="Skip confirmation">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Skip this week&apos;s box?</h3>
          <p className="py-4">
            You won&apos;t receive a delivery this week. You can undo this
            by resetting your box.
          </p>
          <div className="modal-action flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="btn btn-error w-full sm:w-auto min-h-[44px]"
            >
              Skip
            </button>
            <form method="dialog" className="w-full sm:w-auto">
              <button type="submit" className="btn btn-ghost w-full sm:w-auto min-h-[44px]">
                Cancel
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">close</button>
        </form>
      </dialog>
    </>
  );
}
