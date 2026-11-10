import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "../lib/auth/types";
import { type Services, SessionContext } from "./session-context";

// Session state for the whole app (spec login, CA-2 to CA-5, CA-7).
export function SessionProvider({ services, children }: { services: Services; children: ReactNode }) {
  const { auth, fetchMe } = services;
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    auth
      .getSession()
      .catch(() => null)
      .then((s) => {
        if (!active) return;
        setSession(s);
        setStatus("ready");
      });
    const unsubscribe = auth.onChange((s) => setSession(s));
    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await auth.signIn(email, password);
      if (result.ok) {
        setNotice(null);
        setSession(result.session);
      }
      return result;
    },
    [auth],
  );

  const signOut = useCallback(
    async (message?: string) => {
      setNotice(message ?? null);
      try {
        await auth.signOut();
      } finally {
        setSession(null);
      }
    },
    [auth],
  );

  const value = useMemo(
    () => ({ status, session, signIn, signOut, notice, fetchMe }),
    [status, session, signIn, signOut, notice, fetchMe],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
