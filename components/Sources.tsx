import type { Source } from "@/lib/rag/retrieval";

export function Sources({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-4 border-t border-[var(--border)] pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
        Sources
      </p>
      <ol className="space-y-1.5">
        {sources.map((s) => (
          <li key={s.id} className="flex gap-2 text-xs text-[var(--fg-muted)]">
            <span className="font-semibold text-[var(--accent)]">[{s.id}]</span>
            <span>
              {s.source_url ? (
                <a
                  href={s.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[var(--fg)] underline-offset-2 hover:underline"
                >
                  {s.document_title}
                </a>
              ) : (
                <span className="font-medium text-[var(--fg)]">{s.document_title}</span>
              )}
              {s.agency ? ` · ${s.agency}` : ""}
              {s.page ? ` · p.${s.page}` : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
