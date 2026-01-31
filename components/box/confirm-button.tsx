"use client";

import { useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { confirmBox } from "@/app/actions/box";

type TimeLayout = "urgent" | "browsing" | "locked";

type ConfirmButtonProps = {
  boxId: string;
  timeLayout: TimeLayout;
  isConfirmed?: boolean;
};

export function ConfirmButton({ boxId, timeLayout, isConfirmed }: ConfirmButtonProps) {
  const [isPending, startTransition] = useTransition();
  const prefersReducedMotion = useReducedMotion();

  if (timeLayout === "locked" || isConfirmed) {
    return null;
  }

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmBox(boxId);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  if (timeLayout === "urgent") {
    return (
      <div className="fixed bottom-0 left-0 right-0 border-t border-base-300 bg-base-100 p-4">
        <div className="mx-auto max-w-2xl">
          <motion.button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    scale: [1, 1.02, 1],
                    transition: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }
            }
            className="btn btn-primary w-full min-h-[44px] transition-colors duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
          >
            {isPending ? "Confirming\u2026" : "Confirm Box Now"}
          </motion.button>
        </div>
      </div>
    );
  }

  // browsing
  return (
    <motion.button
      type="button"
      onClick={handleConfirm}
      disabled={isPending}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      className="btn btn-primary mt-6 w-full min-h-[44px] transition-all duration-300 focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none"
    >
      {isPending ? "Confirming\u2026" : "Confirm Box"}
    </motion.button>
  );
}
