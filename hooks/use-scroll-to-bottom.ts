"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 100;

export function useScrollToBottom(containerRef: React.RefObject<HTMLElement | null>) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkIfAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < THRESHOLD;
    setIsAtBottom(atBottom);
  }, [containerRef]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior });
    },
    [containerRef]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      checkIfAtBottom();
      isUserScrolling.current = true;
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        isUserScrolling.current = false;
      }, 150);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [containerRef, checkIfAtBottom]);

  // Auto-scroll on content changes via MutationObserver + ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const autoScroll = () => {
      if (isAtBottom && !isUserScrolling.current) {
        scrollToBottom("instant" as ScrollBehavior);
      }
    };

    const mutationObserver = new MutationObserver(autoScroll);
    mutationObserver.observe(el, { childList: true, subtree: true });

    const resizeObserver = new ResizeObserver(autoScroll);
    resizeObserver.observe(el);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [containerRef, isAtBottom, scrollToBottom]);

  return { isAtBottom, scrollToBottom };
}
