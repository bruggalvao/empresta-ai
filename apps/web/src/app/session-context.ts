import { createContext, useContext } from "react";
import type { Api } from "../lib/api/types";
import type { AuthClient, Session, SignInResult } from "../lib/auth/types";

// The Supabase client and the API call are injected, so tests run against
// in-memory fakes.
export type Services = { auth: AuthClient; api: Api };

export type SessionState = {
  status: "loading" | "ready";
  session: Session | null;
  signIn(email: string, password: string): Promise<SignInResult>;
  /** Ends the session; an optional notice is shown on the login screen. */
  signOut(notice?: string): Promise<void>;
  notice: string | null;
  api: Api;
};

export const SessionContext = createContext<SessionState | null>(null);

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession outside SessionProvider");
  return value;
}
