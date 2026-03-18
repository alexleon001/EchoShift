import { useEffect, useState, useRef } from 'react';

/**
 * useCountUp — Animates a number from 0 to target over a duration.
 * Returns the current animated value.
 */
export function useCountUp(target: number, durationMs = 800, delay = 500): number {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }

    const timeout = setTimeout(() => {
      startTime.current = Date.now();

      const animate = () => {
        const elapsed = Date.now() - (startTime.current ?? Date.now());
        const progress = Math.min(elapsed / durationMs, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));

        if (progress < 1) {
          rafId.current = requestAnimationFrame(animate);
        }
      };

      rafId.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [target, durationMs, delay]);

  return value;
}
