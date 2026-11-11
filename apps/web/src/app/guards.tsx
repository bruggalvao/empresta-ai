import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useSession } from "./session-context";

// ADR 001 §2.2: routes protected by session (spec login, CA-4).
export function RequireSession({ children }: { children: ReactNode }) {
  const { status, session } = useSession();
  if (status === "loading") return null;
  return session ? children : <Navigate to="/entrar" replace />;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { status, session } = useSession();
  if (status === "loading") return null;
  return session ? <Navigate to="/inicio" replace /> : children;
}
