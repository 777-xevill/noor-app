import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/** The signed-in session (null when signed out); `ready` once the saved session has been read. */
export function useAccount() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    let live = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!live) return;
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { session, ready };
}
