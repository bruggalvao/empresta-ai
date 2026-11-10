import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";
import { useMe } from "../app/me-context";
import { useSession } from "../app/session-context";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EquipmentCard } from "../components/EquipmentCard";
import { Toast } from "../components/Toast";
import { ApiError, type CatalogItem } from "../lib/api/types";
import { addDays, formatDate, saoPauloDate } from "../lib/dates";
import { EquipmentPhotoArea } from "../lib/equipment-photo";
import { cardState, type Filter, FILTERS, filterCatalog } from "../lib/loanRules";

// LAYOUT §5.2 (spec solicitar-emprestimo, CA-7 to CA-11).
export default function Catalog() {
  const me = useMe();
  const { session, api } = useSession();
  const token = session?.accessToken ?? "";
  const isEmployee = me.role === "EMPLOYEE";
  const queryClient = useQueryClient();

  const equipment = useQuery({ queryKey: ["equipment", token], queryFn: () => api.equipment(token) });
  const myLoans = useQuery({ queryKey: ["loans", token], queryFn: () => api.myLoans(token), enabled: isEmployee });

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [asking, setAsking] = useState<CatalogItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const request = useMutation({
    mutationFn: (item: CatalogItem) => api.requestLoan(token, item.id),
    onSuccess: (loan, item) => {
      setAsking(null);
      setToast(`Empréstimo registrado: devolver ${item.name} até ${formatDate(loan.dueDate)}.`);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["equipment"] });
      void queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });

  const items = useMemo(() => equipment.data?.items ?? [], [equipment.data]);
  const loans = myLoans.data;
  const borrower = {
    role: me.role,
    openLoans: loans?.loans.length ?? 0,
    loanLimit: loans?.loanLimit ?? 3,
    hasOverdue: loans?.loans.some((l) => l.overdue) ?? false,
  };
  const visible = filterCatalog(items, query, filter);
  const available = items.filter((i) => i.situation === "AVAILABLE").length;

  const open = (item: CatalogItem) => {
    request.reset();
    setAsking(item);
  };
  const close = useCallback(() => setAsking(null), []);

  if (equipment.isPending || (isEmployee && myLoans.isPending)) {
    return <p className="px-10 pt-9 text-text/55">Carregando catálogo…</p>;
  }
  if (equipment.isError || myLoans.isError) {
    return (
      <p role="alert" className="px-10 pt-9 text-status-late-fg">
        Não foi possível carregar o catálogo. Tente de novo em instantes.
      </p>
    );
  }

  const dueIfAsked = addDays(saoPauloDate(), loans?.loanPeriodDays ?? 14);
  const refusal = request.error instanceof ApiError ? request.error.message : request.error ? "Não foi possível registrar o empréstimo." : null;

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col gap-6 px-10 pb-16 pt-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px]">Catálogo</h1>
          <p className="text-[14px] text-text/55">
            {available} de {items.length} equipamentos disponíveis agora
          </p>
        </div>
        <input
          type="search"
          aria-label="Buscar por nome ou patrimônio"
          placeholder="Buscar por nome ou patrimônio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-[260px] rounded-md border border-divider bg-surface px-2.5 text-[14px] placeholder:text-text/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
      </div>

      {isEmployee && borrower.hasOverdue ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#7a3b3b] bg-[rgb(122_59_59/0.14)] px-4 py-3 text-[13.5px] text-status-late-fg">
          <span>Você está com item em atraso e não pode pegar outro emprestado até devolvê-lo.</span>
          <Link to="/meus-emprestimos" className="font-medium underline-offset-2 hover:underline">
            Ver meus empréstimos
          </Link>
        </div>
      ) : null}

      <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`h-8 rounded-full border px-3.5 text-[12.5px] ${
              filter === f.id ? "border-accent bg-accent/10 text-accent-300" : "border-divider text-text/70 hover:text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-divider p-10 text-center text-text/55">Nenhum equipamento encontrado.</p>
      ) : (
        <EquipmentPhotoArea>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(292px,1fr))] gap-4">
            {visible.map((item) => (
              <EquipmentCard key={item.id} item={item} state={cardState(item, borrower)} onRequest={() => open(item)} />
            ))}
          </div>
        </EquipmentPhotoArea>
      )}

      {asking ? (
        <ConfirmDialog
          title="Solicitar empréstimo"
          confirmLabel="Confirmar"
          summary={[
            { label: "Equipamento", value: asking.assetTag ? `${asking.name} · ${asking.assetTag}` : asking.name },
            { label: "Devolver até", value: formatDate(dueIfAsked) },
          ]}
          pending={request.isPending}
          error={refusal}
          onConfirm={() => request.mutate(asking)}
          onCancel={close}
        >
          O empréstimo é registrado na hora, no seu nome. Retire o equipamento no balcão de Operações.
        </ConfirmDialog>
      ) : null}

      {toast ? <Toast message={toast} onDone={clearToast} /> : null}
    </main>
  );
}
