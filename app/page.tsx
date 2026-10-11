import { Chat } from "@/components/Chat";
import { Logo } from "@/components/Logo";

const DOCS = [
  "DOLE — Statutory Benefits",
  "SSS — Citizens Charter",
  "PhilHealth — Konsulta",
  "Pag-IBIG — Programs",
];

export default function Home() {
  return (
    <div className="flex h-dvh bg-[var(--bg)] text-[var(--fg)]">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] px-3 py-3 md:flex">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Logo size={26} />
          <span className="text-[17px] font-semibold tracking-tight">Gabay</span>
        </div>

        <a
          href="/"
          className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--panel)] px-3 py-2 text-sm font-medium transition hover:bg-[var(--panel-hover)]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          New chat
        </a>

        <div className="mt-6 px-2 text-[11px] font-medium uppercase tracking-wider text-[var(--fg-faint)]">
          Knowledge base
        </div>
        <ul className="mt-2 space-y-0.5 text-sm text-[var(--fg-muted)]">
          {DOCS.map((d) => (
            <li key={d} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-[var(--panel)]">
              <svg className="shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
              <span className="truncate">{d}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center gap-2 border-t border-[var(--border)] px-2 pt-3">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--panel)] text-xs font-semibold text-[var(--fg-muted)]">PH</div>
          <div className="leading-tight">
            <div className="text-xs font-medium text-[var(--fg)]">Gabay</div>
            <div className="text-[11px] text-[var(--fg-faint)]">Worker benefits · RAG</div>
          </div>
        </div>
      </aside>

      <Chat />
    </div>
  );
}
