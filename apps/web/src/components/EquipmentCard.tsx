import type { CatalogItem } from "../lib/api/types";
import { EquipmentPhoto } from "../lib/equipment-photo";
import { CATEGORY_LABEL, type CardState } from "../lib/loanRules";
import { Button } from "./Button";
import { StatusPill } from "./StatusPill";

// LAYOUT §5.2 card. Must be rendered inside an EquipmentPhotoArea (the
// photo library refuses to show a photo without the Pixabay credit).
export function EquipmentCard({ item, state, onRequest }: { item: CatalogItem; state: CardState; onRequest(): void }) {
  const { action } = state;
  return (
    <article aria-label={item.name} className="flex animate-fade-up flex-col gap-3 rounded-lg border border-divider bg-surface p-[18px] shadow-sm">
      <EquipmentPhoto path={item.imagePath} name={item.name} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.08em] text-text/45">{CATEGORY_LABEL[item.category]}</span>
          <h3 className="text-[16.5px]">{item.name}</h3>
          <span className="text-xs text-text/45">{item.assetTag ?? "TI-—"}</span>
        </div>
        <StatusPill status={state.pill} />
      </div>
      <p className="min-h-[18px] text-[12.5px] text-text/55">{state.detail}</p>
      {action.kind === "request" ? (
        <Button block onClick={onRequest}>
          {action.label}
        </Button>
      ) : action.kind === "disabled" ? (
        <Button block disabled variant={action.variant}>
          {action.label}
        </Button>
      ) : null}
    </article>
  );
}
