import { useEffect, useRef, useCallback } from "react";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useInactivityTimer(onInactive: () => void, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(onInactive);
  callbackRef.current = onInactive;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled) return;
    timerRef.current = setTimeout(() => {
      callbackRef.current();
    }, INACTIVITY_TIMEOUT);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handler = () => resetTimer();

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetTimer(); // start initial timer

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, resetTimer]);

  return { resetTimer };
}
