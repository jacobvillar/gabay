import type { Source } from "@/lib/rag/retrieval";

export function Sources({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-4 border-t border-[var(--border)] pt-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--fg-faint)]">
        Sources
      </p>
      <ol className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <li key={s.id}>
            <a
              href={s.source_url || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--sidebar)] px-2.5 py-1.5 text-xs text-[var(--fg-muted)] transition hover:bg-[var(--panel)] hover:text-[var(--fg)]"
            >
              <span className="font-semibold text-[var(--fg)]">[{s.id}]</span>
              <span>{s.agency || s.document_title}{s.page ? ` · p.${s.page}` : ""}</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
