import { Link } from "react-router";
import { useMe } from "../app/me-context";
import { ROLE_LABEL } from "../lib/roles";

// Entry after login (spec login). The navbar comes from AppLayout.
export default function Home() {
  const { fullName, role, tenant } = useMe();
  const firstName = fullName.trim().split(/\s+/)[0];
  return (
    <main className="mx-auto flex max-w-[1240px] flex-col items-start gap-3 px-10 pb-16 pt-9">
      <h1 className="text-[30px]">Olá, {firstName}</h1>
      <p className="text-[15px] text-text/55">
        Você entrou como {ROLE_LABEL[role]} em {tenant.name}.
      </p>
      <Link to="/catalogo" className="text-[14px] font-medium text-accent-300 hover:text-accent-200">
        Ver o catálogo de equipamentos
      </Link>
    </main>
  );
}
