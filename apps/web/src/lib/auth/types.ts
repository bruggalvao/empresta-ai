// What the app needs from Supabase Auth. The real implementation wraps
// supabase-js; tests pass an in-memory one.
export type Session = { accessToken: string; email: string };

export type SignInResult =
  | { ok: true; session: Session }
  | { ok: false; reason: "invalid_credentials" | "unavailable" };

export interface AuthClient {
  getSession(): Promise<Session | null>;
  signIn(email: string, password: string): Promise<SignInResult>;
  signOut(): Promise<void>;
  /** Called when the session changes elsewhere (token refresh, other tab). Returns an unsubscribe. */
  onChange(listener: (session: Session | null) => void): () => void;
}
