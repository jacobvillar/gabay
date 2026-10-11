"use client";

const CHIPS = [
  "How is 13th-month pay computed?",
  "How many service incentive leave days am I entitled to?",
  "How do I claim my SSS maternity benefit?",
  "Can I avail a Pag-IBIG multi-purpose loan?",
];

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {CHIPS.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className="rounded-xl border border-[var(--border)] bg-[var(--sidebar)] px-3.5 py-3 text-left text-sm text-[var(--fg-muted)] transition hover:bg-[var(--panel)] hover:text-[var(--fg)]"
        >
          {c}
        </button>
      ))}
    </div>
  );
}
