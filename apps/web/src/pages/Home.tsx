import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSession } from "../app/session-context";
import { Navbar } from "../components/Navbar";
import { ApiError } from "../lib/api/me";
import { ROLE_LABEL } from "../lib/roles";
import { NO_ACCESS_MESSAGE, SESSION_EXPIRED_MESSAGE } from "./messages";

// Placeholder home (spec login, decisões): the full navbar plus a short
// welcome. Entrega 4 replaces the content with the catalog.
export default function Home() {
  const { session, fetchMe, signOut } = useSession();
  const token = session?.accessToken ?? "";
  const me = useQuery({
    queryKey: ["me", token],
    queryFn: () => fetchMe(token),
    enabled: Boolean(token),
    retry: false,
  });

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

  const { fullName, role, tenant } = me.data;
  const firstName = fullName.trim().split(/\s+/)[0];
  return (
    <div className="min-h-svh">
      <Navbar fullName={fullName} role={role} onSignOut={() => void signOut()} />
      <main className="mx-auto flex max-w-[1240px] flex-col gap-3 px-10 pb-16 pt-9">
        <h1 className="text-[30px]">Olá, {firstName}</h1>
        <p className="text-[15px] text-text/55">
          Você entrou como {ROLE_LABEL[role]} em {tenant.name}. O catálogo de equipamentos ainda não está disponível
          nesta versão.
        </p>
      </main>
    </div>
  );
}
