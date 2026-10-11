import { Chat } from "@/components/Chat";

export default function Home() {
  return (
    <div className="flex h-dvh">
      {/* Onyx-style dark sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-[var(--sidebar)] p-3 text-[var(--sidebar-fg)] md:flex">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
            G
          </div>
          <span className="text-lg font-semibold">Gabay</span>
        </div>
        <button className="mt-2 w-full rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-[var(--sidebar-fg)] transition hover:bg-[var(--sidebar-hover)]">
          + New chat
        </button>
        <div className="mt-6 px-2 text-xs uppercase tracking-wide text-[var(--sidebar-muted)]">
          Knowledge base
        </div>
        <ul className="mt-2 space-y-1 px-2 text-sm text-[var(--sidebar-muted)]">
          <li>DOLE — Statutory Benefits</li>
          <li>SSS — Member Guide</li>
          <li>PhilHealth — Member Guide</li>
          <li>Pag-IBIG — Member Guide</li>
        </ul>
        <div className="mt-auto px-2 pb-2 text-xs text-[var(--sidebar-muted)]">
          Philippine worker benefits · RAG
        </div>
      </aside>

      <Chat />
    </div>
  );
}
