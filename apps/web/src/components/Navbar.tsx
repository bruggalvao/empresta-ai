import type { Role } from "../lib/api/me";
import { initials, ROLE_LABEL, ROLE_TABS } from "../lib/roles";
import { Brand } from "./Brand";
import { SectionRule } from "./SectionRule";

// LAYOUT §6. None of the tab screens exist yet (spec login, decisões), so
// the tabs show what is coming and stay disabled.
type NavbarProps = { fullName: string; role: Role; onSignOut(): void };

export function Navbar({ fullName, role, onSignOut }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 bg-bg">
      <nav aria-label="Principal" className="flex h-[60px] items-center gap-8 px-10">
        <Brand />
        <ul className="flex h-full items-stretch">
          {ROLE_TABS[role].map((tab) => (
            <li key={tab} className="flex">
              <button
                type="button"
                disabled
                title="Em breve"
                className="h-full cursor-not-allowed border-b-2 border-transparent px-3.5 text-[13.5px] text-text/55"
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-3 text-[13.5px]">
          <span className="rounded-sm border border-divider px-2 py-0.5 text-[11.5px] uppercase tracking-[0.08em] text-text/70">
            {ROLE_LABEL[role]}
          </span>
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-full border border-accent-700 bg-accent-900 text-[11.5px] font-semibold text-accent-300"
          >
            {initials(fullName)}
          </span>
          <span>{fullName}</span>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-md px-2 py-1 text-accent-300 hover:text-accent-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Sair
          </button>
        </div>
      </nav>
      <SectionRule />
    </header>
  );
}
