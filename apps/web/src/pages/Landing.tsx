import { Brand } from "../components/Brand";
import { SectionRule } from "../components/SectionRule";
import { StatusPill, type EquipmentStatus } from "../components/StatusPill";

// Sample rows taken from docs/LAYOUT.md section 9, only to illustrate the catalog.
const PREVIEW_ITEMS: {
  category: string;
  name: string;
  tag: string;
  status: EquipmentStatus;
  detail: string;
}[] = [
  {
    category: "Notebook",
    name: "Notebook Dell Latitude 5450",
    tag: "TI-0142",
    status: "available",
    detail: "Pronto para retirada no balcão",
  },
  {
    category: "Notebook",
    name: "MacBook Pro 14 M3",
    tag: "TI-0088",
    status: "loaned",
    detail: "Com Marcos Lemos · devolver até 07/09/2026",
  },
  {
    category: "Monitor",
    name: "Monitor Dell 24\" FHD",
    tag: "TI-0233",
    status: "maintenance",
    detail: "Painel com falha, retorna em 05/09/2026",
  },
];

const STATS = [
  { value: "3", label: "itens por pessoa" },
  { value: "14", label: "dias de prazo" },
  { value: "0", label: "linhas para preencher" },
];

const STEPS = [
  {
    title: "Veja o catálogo",
    body: "Cada equipamento mostra se está disponível, emprestado, em atraso ou em manutenção. Nada de perguntar no chat quem está com o quê.",
  },
  {
    title: "Peça emprestado",
    body: "Escolha um item disponível e confirme. O prazo de devolução é calculado na hora e o item sai do catálogo.",
  },
  {
    title: "Devolva",
    body: "Devolva pelo app ou no balcão com a Operações. O registro é feito no ato, sem depender de alguém lembrar de atualizar a planilha.",
  },
];

const ROLES = [
  {
    kicker: "Colaborador",
    title: "Pegue e devolva sem intermediário",
    items: [
      "Consulta o catálogo com a situação de cada equipamento",
      "Solicita um item disponível",
      "Devolve o que está em seu nome",
      "Vê apenas os próprios empréstimos",
    ],
  },
  {
    kicker: "Operações",
    title: "Saiba onde cada equipamento está",
    items: [
      "Cadastra equipamentos e define a situação inicial",
      "Acompanha todos os empréstimos em aberto",
      "Identifica o que está em atraso",
      "Registra devolução no balcão",
    ],
  },
];

const RULES = [
  { value: "3", text: "itens por pessoa ao mesmo tempo" },
  { value: "14", text: "dias de prazo padrão de devolução" },
  { value: "0", text: "novos empréstimos para quem tem item em atraso" },
  { value: "—", text: "equipamento em manutenção nunca aparece como disponível" },
];

const kicker =
  "text-[11.5px] font-semibold uppercase tracking-[0.09em] text-text/45";

export default function Landing() {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 bg-bg">
        <nav
          aria-label="Principal"
          className="mx-auto flex h-[60px] max-w-[1240px] items-center justify-between gap-8 px-6 md:px-10"
        >
          <a href="#topo" aria-label="empresta.ai, início">
            <Brand />
          </a>
          <div className="flex items-center gap-6 text-[13.5px]">
            <a
              href="#como-funciona"
              className="hidden text-text/55 hover:text-text sm:inline"
            >
              Como funciona
            </a>
            <a
              href="#regras"
              className="hidden text-text/55 hover:text-text sm:inline"
            >
              Regras
            </a>
            <button
              type="button"
              disabled
              title="Login em breve"
              className="h-9 cursor-not-allowed rounded-md border border-divider px-4 font-medium opacity-45"
            >
              Entrar
            </button>
          </div>
        </nav>
        <SectionRule />
      </header>

      <main id="topo">
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-40 top-16 size-[520px] rounded-full bg-[radial-gradient(closest-side,rgb(47_184_172/0.16),transparent)]"
          />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col gap-6">
              <p className={kicker}>Empréstimo de equipamentos de TI</p>
              <h1 className="text-[44px] max-sm:text-[34px]">
                Saiba o que está disponível e quem está com o quê.
              </h1>
              <p className="max-w-[56ch] text-base text-text/60">
                O empresta.ai substitui a planilha compartilhada da TI. Cada
                equipamento tem uma situação sempre atual, e retirada e
                devolução são registradas no momento em que acontecem.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#como-funciona"
                  className="inline-flex h-10 items-center rounded-md border border-accent px-5 text-[14px] font-medium text-accent-300 hover:bg-accent/12 active:bg-accent/22"
                >
                  Ver como funciona
                </a>
                <a
                  href="#regras"
                  className="inline-flex h-10 items-center px-2 text-[14px] font-medium text-accent-300 hover:text-accent-200"
                >
                  Regras de empréstimo
                </a>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-divider pt-6">
                {STATS.map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1">
                    <dt className="order-2 text-[12.5px] text-text/55">
                      {stat.label}
                    </dt>
                    <dd className="order-1 text-[30px] font-semibold leading-none text-accent">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div
              role="img"
              aria-label="Exemplo do catálogo: um equipamento disponível, um emprestado e um em manutenção"
              className="flex flex-col gap-4"
            >
              {PREVIEW_ITEMS.map((item) => (
                <article
                  key={item.tag}
                  aria-hidden="true"
                  className="flex animate-fade-up flex-col gap-3 rounded-lg border border-divider bg-surface p-[18px] shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className={kicker}>{item.category}</span>
                      <h2 className="text-[16.5px]">{item.name}</h2>
                      <span className="text-xs text-text/45">{item.tag}</span>
                    </div>
                    <StatusPill status={item.status} />
                  </div>
                  <p className="min-h-[18px] text-[12.5px] text-text/55">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <SectionRule />

        <section
          id="como-funciona"
          className="mx-auto flex max-w-[1240px] scroll-mt-[60px] flex-col gap-10 px-6 py-16 md:px-10 md:py-20"
        >
          <div className="flex flex-col gap-3">
            <p className={kicker}>Como funciona</p>
            <h2 className="text-[30px] max-sm:text-[26px]">
              Do catálogo à devolução, em três passos
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-lg border border-divider bg-surface p-[18px]"
              >
                <span className="text-[30px] font-semibold leading-none text-accent">
                  {index + 1}
                </span>
                <h3 className="text-[16.5px]">{step.title}</h3>
                <p className="text-[13.5px] text-text/72">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <SectionRule />

        <section className="mx-auto flex max-w-[1240px] flex-col gap-10 px-6 py-16 md:px-10 md:py-20">
          <div className="flex flex-col gap-3">
            <p className={kicker}>Para quem</p>
            <h2 className="text-[30px] max-sm:text-[26px]">
              Dois perfis, cada um com a sua visão
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {ROLES.map((role) => (
              <article
                key={role.kicker}
                className="flex flex-col gap-4 rounded-lg border border-divider bg-surface p-[18px]"
              >
                <div className="flex flex-col gap-1">
                  <span className={kicker}>{role.kicker}</span>
                  <h3 className="text-[17px]">{role.title}</h3>
                </div>
                <ul className="flex flex-col gap-2 text-[13.5px] text-text/72">
                  {role.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden="true" className="text-accent">
                        —
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <SectionRule />

        <section
          id="regras"
          className="mx-auto flex max-w-[1240px] scroll-mt-[60px] flex-col gap-10 px-6 py-16 md:px-10 md:py-20"
        >
          <div className="flex flex-col gap-3">
            <p className={kicker}>Regras de empréstimo</p>
            <h2 className="text-[30px] max-sm:text-[26px]">
              Definidas pela Operações, aplicadas pelo sistema
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RULES.map((rule) => (
              <li
                key={rule.text}
                className="flex flex-col gap-2 rounded-lg border border-divider bg-surface px-[18px] py-4"
              >
                <span className="text-[30px] font-semibold leading-none text-accent">
                  {rule.value}
                </span>
                <span className="text-[13.5px] text-text/72">{rule.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SectionRule />
      <footer className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-8 md:px-10">
        <Brand />
        <p className="text-xs text-text/40">Operações · TI interno</p>
      </footer>
    </div>
  );
}
