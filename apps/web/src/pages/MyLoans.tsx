import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router";
import { useMe } from "../app/me-context";
import { useSession } from "../app/session-context";
import { StatusPill } from "../components/StatusPill";
import { formatDate, saoPauloDate } from "../lib/dates";

// LAYOUT §5.3 without "Devolver": returning is out of this spec
// (spec solicitar-emprestimo, CA-12). Only a Colaborador borrows.
export default function MyLoans() {
  const me = useMe();
  const { session, api } = useSession();
  const token = session?.accessToken ?? "";
  const isEmployee = me.role === "EMPLOYEE";
  const query = useQuery({ queryKey: ["loans", token], queryFn: () => api.myLoans(token), enabled: isEmployee });

  if (!isEmployee) return <Navigate to="/catalogo" replace />;
  if (query.isPending) return <p className="px-10 pt-9 text-text/55">Carregando…</p>;
  if (query.isError) {
    return (
      <p role="alert" className="px-10 pt-9 text-status-late-fg">
        Não foi possível carregar seus empréstimos. Tente de novo em instantes.
      </p>
    );
  }

  const { loans, loanLimit, loanPeriodDays } = query.data;
  const slots = Array.from({ length: loanLimit }, (_, i) => loans[i]);

  return (
    <main className="mx-auto flex max-w-[1000px] flex-col gap-6 px-10 pb-16 pt-9">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px]">Meus empréstimos</h1>
        <p className="text-[14px] text-text/55">
          {loans.length} de {loanLimit} itens em seu nome · prazo padrão de {loanPeriodDays} dias
        </p>
      </div>

      <div role="img" aria-label={`${loans.length} de ${loanLimit} itens em uso`} className="flex gap-1.5">
        {slots.map((loan, i) => (
          <span
            key={i}
            className={`h-[5px] flex-1 rounded-full ${loan ? (loan.overdue ? "bg-status-late-fg" : "bg-accent") : "bg-text/12"}`}
          />
        ))}
      </div>

      {loans.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-divider p-12 text-center">
          <p className="text-text/55">Você não está com nenhum equipamento.</p>
          <Link
            to="/catalogo"
            className="inline-flex h-9 items-center rounded-md border border-accent px-4 text-[14px] font-medium text-accent-300 hover:bg-accent/12"
          >
            Ir ao catálogo
          </Link>
        </div>
      ) : (
        <ul aria-label="Empréstimos em aberto" className="flex flex-col gap-2.5">
          {loans.map((loan) => (
            <li
              key={loan.id}
              className={`flex items-center gap-5 rounded-md border border-l-[3px] border-divider bg-surface px-5 py-[18px] ${
                loan.overdue ? "border-l-status-late-fg" : "border-l-accent"
              }`}
            >
              <div className="flex flex-[1.4] flex-col gap-0.5">
                <span className="text-[16px]">{loan.equipment.name}</span>
                <span className="text-xs text-text/45">{loan.equipment.assetTag ?? "TI-—"}</span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 text-[13.5px]">
                <span className="text-[11px] uppercase tracking-[0.08em] text-text/45">Retirada</span>
                <span>{formatDate(saoPauloDate(loan.loanedAt))}</span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 text-[13.5px]">
                <span className="text-[11px] uppercase tracking-[0.08em] text-text/45">Devolver até</span>
                <span className={loan.overdue ? "text-status-late-fg" : "text-accent-300"}>{formatDate(loan.dueDate)}</span>
              </div>
              <div className="flex flex-[0.9] justify-end">
                <StatusPill status={loan.overdue ? "late" : "loaned"} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <ul className="flex flex-wrap gap-x-8 gap-y-2 text-[12.5px] text-text/55">
        <li>Até {loanLimit} itens ao mesmo tempo</li>
        <li>Prazo padrão de {loanPeriodDays} dias</li>
        <li>Item em atraso bloqueia novos empréstimos</li>
      </ul>
    </main>
  );
}
