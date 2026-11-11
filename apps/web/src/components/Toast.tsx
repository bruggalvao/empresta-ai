import { useEffect } from "react";

export const TOAST_MS = 2600;

// LAYOUT §5.6: pill fixed at the bottom, accent 900/700/200, gone after 2600ms.
export function Toast({ message, onDone }: { message: string; onDone(): void }) {
  useEffect(() => {
    const id = setTimeout(onDone, TOAST_MS);
    return () => clearTimeout(id);
  }, [message, onDone]);

  return (
    <div
      role="status"
      className="fixed bottom-7 left-1/2 z-40 -translate-x-1/2 animate-fade-up rounded-full border border-accent-700 bg-accent-900 px-5 py-3 text-[13.5px] text-accent-200"
    >
      {message}
    </div>
  );
}
