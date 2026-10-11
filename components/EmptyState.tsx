"use client";

const CHIPS = [
  "How is 13th-month pay computed?",
  "How many service incentive leave days am I entitled to?",
  "What are the current SSS contribution rates?",
  "Can I claim Pag-IBIG benefits as a voluntary member?",
];

export function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] text-xl font-bold text-white">
        G
      </div>
      <h1 className="text-2xl font-semibold text-[var(--fg)]">
        Ask about your worker benefits
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--fg-muted)]">
        Gabay answers from the official DOLE, SSS, PhilHealth, and Pag-IBIG handbooks —
        with sources you can check.
      </p>
      <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => onPick(c)}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-left text-sm text-[var(--fg)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
