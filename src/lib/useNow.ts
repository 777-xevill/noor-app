import { useEffect, useState } from 'react';

/** Current time, refreshed every `intervalMs` (aligned to the interval so minutes flip on time). */
export function useNow(intervalMs = 10_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(new Date());
      timer = setTimeout(tick, intervalMs - (Date.now() % intervalMs));
    };
    timer = setTimeout(tick, intervalMs - (Date.now() % intervalMs));
    return () => clearTimeout(timer);
  }, [intervalMs]);
  return now;
}
