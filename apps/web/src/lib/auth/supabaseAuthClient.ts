import type { Session as SupabaseSession, SupabaseClient } from "@supabase/supabase-js";
import type { AuthClient, Session } from "./types";

const toSession = (s: SupabaseSession | null): Session | null =>
  s ? { accessToken: s.access_token, email: s.user.email ?? "" } : null;

// ADR 001 §2.7: e-mail and password through supabase-js, which keeps the
// session in the browser and refreshes the access token.
export function createSupabaseAuthClient(getClient: () => SupabaseClient): AuthClient {
  return {
    async getSession() {
      const { data } = await getClient().auth.getSession();
      return toSession(data.session);
    },

    async signIn(email, password) {
      try {
        const { data, error } = await getClient().auth.signInWithPassword({ email, password });
        if (error) {
          // Supabase answers 400 "invalid_credentials" for both an unknown
          // e-mail and a wrong password; anything else is not the user's fault.
          const invalid = error.code === "invalid_credentials" || error.status === 400;
          return { ok: false, reason: invalid ? "invalid_credentials" : "unavailable" };
        }
        const session = toSession(data.session);
        return session ? { ok: true, session } : { ok: false, reason: "unavailable" };
      } catch {
        return { ok: false, reason: "unavailable" };
      }
    },

    async signOut() {
      await getClient().auth.signOut();
    },

    onChange(listener) {
      const { data } = getClient().auth.onAuthStateChange((_event, session) => listener(toSession(session)));
      return () => data.subscription.unsubscribe();
    },
  };
}
