import { useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { usePlayerStore } from '@/store/playerStore';

export function useAuthInit() {
  const isLoading = usePlayerStore((s) => s.isLoading);
  const isAuthenticated = usePlayerStore((s) => s.isAuthenticated);
  const setSession = usePlayerStore((s) => s.setSession);
  const hydrateProfile = usePlayerStore((s) => s.hydrateProfile);
  const setLoading = usePlayerStore((s) => s.setLoading);
  const logout = usePlayerStore((s) => s.logout);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        hydrateProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setSession(session);
          hydrateProfile(session.user.id);
        } else {
          logout();
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return { isLoading, isAuthenticated };
}
