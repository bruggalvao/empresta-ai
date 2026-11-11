import { NavLink } from "react-router";
import type { Role } from "../lib/api/types";
import { initials, ROLE_LABEL, ROLE_TABS } from "../lib/roles";
import { Brand } from "./Brand";
import { SectionRule } from "./SectionRule";

const TAB = "flex h-full items-center border-b-2 px-3.5 text-[13.5px]";

// LAYOUT §6: sticky 60px bar; active tab with the accent underline.
type NavbarProps = { fullName: string; role: Role; onSignOut(): void };

export function Navbar({ fullName, role, onSignOut }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 bg-bg">
      <nav aria-label="Principal" className="flex h-[60px] items-center gap-8 px-10">
        <Brand />
        <ul className="flex h-full items-stretch">
          {ROLE_TABS[role].map((tab) => (
            <li key={tab.label} className="flex">
              {tab.to ? (
                <NavLink
                  to={tab.to}
                  className={({ isActive }) =>
                    `${TAB} ${isActive ? "border-accent text-text" : "border-transparent text-text/55 hover:text-text"}`
                  }
                >
                  {tab.label}
                </NavLink>
              ) : (
                <button type="button" disabled title="Em breve" className={`${TAB} cursor-not-allowed border-transparent text-text/55`}>
                  {tab.label}
                </button>
              )}
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
