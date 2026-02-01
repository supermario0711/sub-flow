"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BoxImage } from "./box-image";

type ConfirmItem = {
  id: string;
  items: { id: string; name: string; emoji: string; category: string };
};

type ConfirmContentProps = {
  boxId: string;
  items: ConfirmItem[];
  imageUrl: string | null;
  weekLabel: string;
};

/**
 * Client component for the animated confirmation page content:
 * celebration emoji, heading, staggered item list, and AI box image.
 */
export function ConfirmContent({ boxId, items, imageUrl, weekLabel }: ConfirmContentProps) {
  const prefersReducedMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.06,
      },
    },
  };

  const itemVariant = {
    hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <>
      <div className="mt-6 text-center">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          Box Confirmed!
        </h1>
        <p className="mb-8 text-base-content/60">Week of {weekLabel}</p>
      </div>

      <BoxImage
        boxId={boxId}
        imageUrl={imageUrl}
        items={items.map((i) => ({ name: i.items.name, emoji: i.items.emoji }))}
      />

      <motion.ul
        className="mt-8 flex flex-col gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {items.map((boxItem) => (
          <motion.li
            key={boxItem.id}
            variants={itemVariant}
            className="flex items-center gap-4 rounded-lg bg-base-200 p-4"
          >
            <span className="text-3xl" role="img" aria-label={boxItem.items.name}>
              {boxItem.items.emoji}
            </span>
            <div>
              <p className="font-medium">{boxItem.items.name}</p>
              <span className="badge badge-ghost badge-sm capitalize">
                {boxItem.items.category}
              </span>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </>
  );
}
