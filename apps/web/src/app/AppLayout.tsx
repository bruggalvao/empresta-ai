import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";
import { ApiError } from "../lib/api/types";
import { NO_ACCESS_MESSAGE, SESSION_EXPIRED_MESSAGE } from "../pages/messages";
import { useSession } from "./session-context";

// Every signed-in screen: who the person is (/v1/me), the navbar, and the
// screen. 403 and 401 end the session as in spec login (CA-7).
export default function AppLayout() {
  const { session, api, signOut } = useSession();
  const token = session?.accessToken ?? "";
  const me = useQuery({ queryKey: ["me", token], queryFn: () => api.me(token), enabled: Boolean(token), retry: false });

  const status = me.error instanceof ApiError ? me.error.status : null;
  useEffect(() => {
    if (status === 403) void signOut(NO_ACCESS_MESSAGE);
    else if (status === 401) void signOut(SESSION_EXPIRED_MESSAGE);
  }, [status, signOut]);

  if (me.isPending || status === 401 || status === 403) {
    return <p className="p-10 text-text/55">Carregando…</p>;
  }
  if (me.isError) {
    return (
      <main className="flex flex-col items-start gap-3 p-10">
        <p role="alert" className="text-status-late-fg">
          Não foi possível carregar seus dados. Tente de novo em instantes.
        </p>
        <button type="button" className="text-accent-300 hover:text-accent-200" onClick={() => void signOut()}>
          Sair
        </button>
      </main>
    );
  }

  return (
    <div className="min-h-svh">
      <Navbar fullName={me.data.fullName} role={me.data.role} onSignOut={() => void signOut()} />
      <Outlet context={me.data} />
    </div>
  );
}
