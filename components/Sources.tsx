import type { Source } from "@/lib/rag/retrieval";

export function Sources({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null;
  // Several chunks often hit the same page; show each document page once.
  const unique = sources.filter(
    (s, i) => sources.findIndex((o) => o.document_title === s.document_title && o.page === s.page) === i,
  );
  return (
    <div className="mt-4 border-t border-[var(--border)] pt-3">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--fg-faint)]">
        Sources
      </p>
      <ol className="flex flex-wrap gap-2">
        {unique.map((s, i) => (
          <li key={`${s.document_title}-${s.page}`}>
            <a
              href={s.source_url ? `${s.source_url}#page=${s.page}` : undefined}
              target="_blank"
              rel="noreferrer"
              title={s.document_title}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--sidebar)] px-2.5 py-1.5 text-xs text-[var(--fg-muted)] transition hover:bg-[var(--panel)] hover:text-[var(--fg)]"
            >
              <span className="font-semibold text-[var(--fg)]">[{i + 1}]</span>
              <span>{s.agency || s.document_title}{s.page ? ` · p.${s.page}` : ""}</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
