import { useEffect, useState } from 'react';

/**
 * How many rows of a long list to draw right now. It starts small so the screen appears at once, then
 * grows in batches on later frames, so opening a screen with hundreds of rows never freezes the app.
 */
export function useProgressive(total: number, first = 16, step = 24): number {
  const [count, setCount] = useState(first);
  useEffect(() => {
    if (count >= total) return;
    const id = setTimeout(() => setCount((c) => Math.min(total, c + step)), 40);
    return () => clearTimeout(id);
  }, [count, total, step]);
  return Math.min(count, total);
}
