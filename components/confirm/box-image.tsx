"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getBoxImageUrl, triggerBoxImageGeneration } from "@/app/actions/image";

const STATUS_MESSAGES = [
  "Curating your box\u2026",
  "Arranging the freshest picks\u2026",
  "Adding a dash of color\u2026",
  "Polishing the presentation\u2026",
  "Almost ready to serve\u2026",
  "Putting on the finishing touches\u2026",
  "Making it picture-perfect\u2026",
  "Your box is looking great\u2026",
  "Just a moment more\u2026",
  "Wrapping things up\u2026",
];

const POLL_INTERVAL = 3000;
const MAX_POLLS = 20;

type BoxImageProps = {
  boxId: string;
  imageUrl: string | null;
  items: { name: string; emoji: string }[];
};

/**
 * Displays the AI-generated box image with a fade-in animation.
 * When no image is available yet, triggers generation, shows an emoji
 * grid with rotating status messages, and polls for the result.
 */
export function BoxImage({ boxId, imageUrl: initialUrl, items }: BoxImageProps) {
  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [loaded, setLoaded] = useState(false);
  const [polling, setPolling] = useState(!initialUrl);
  const [messageIndex, setMessageIndex] = useState(0);
  const triggered = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  // Trigger generation once on mount if no image
  useEffect(() => {
    if (initialUrl || triggered.current) return;
    triggered.current = true;
    triggerBoxImageGeneration(boxId);
  }, [boxId, initialUrl]);

  // Poll for the image URL
  useEffect(() => {
    if (!polling) return;

    let attempts = 0;
    let cancelled = false;

    const tick = async () => {
      attempts++;
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);

      const url = await getBoxImageUrl(boxId);
      if (cancelled) return;

      if (url) {
        setImageUrl(url);
        setPolling(false);
      } else if (attempts >= MAX_POLLS) {
        setPolling(false);
      }
    };

    const interval = setInterval(tick, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [polling, boxId]);

  const alt = `Fresh produce box with ${items.map((i) => i.name).join(", ")}`;

  return (
    <section aria-label="Your box image" className="mt-8">
      <AnimatePresence mode="wait">
        {imageUrl ? (
          <motion.div
            key="image"
            className="overflow-hidden rounded-lg"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={loaded ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src={imageUrl}
              alt={alt}
              width={672}
              height={448}
              className="w-full rounded-lg"
              onLoad={() => setLoaded(true)}
              priority
            />
          </motion.div>
        ) : (
          <motion.div
            key="fallback"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg bg-base-200 p-6"
          >
            <div className="grid grid-cols-3 gap-3">
              {items.map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-4xl" role="img" aria-label={item.name}>
                    {item.emoji}
                  </span>
                  <span className="text-xs text-base-content/60">{item.name}</span>
                </div>
              ))}
            </div>

            {polling && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-base-content/50">
                <span className="loading loading-dots loading-sm" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={messageIndex}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {STATUS_MESSAGES[messageIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
