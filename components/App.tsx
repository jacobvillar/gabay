"use client";

import type { UIMessage } from "ai";
import { useEffect, useState } from "react";
import { Chat } from "./Chat";
import { Logo } from "./Logo";

const DOCS = [
  { name: "DOLE — Statutory Benefits", url: "https://www.dole.gov.ph/" },
  { name: "SSS — Citizens Charter", url: "https://www.sss.gov.ph/" },
  { name: "PhilHealth — Konsulta", url: "https://www.philhealth.gov.ph/" },
  { name: "Pag-IBIG — Programs", url: "https://www.pagibigfund.gov.ph/" },
];

type SavedChat = { id: string; title: string; messages: UIMessage[] };

// ponytail: recents live in this browser's localStorage — no accounts, no server storage.
// Capped so answers (which carry source passages) never fill the quota.
const KEY = "gabay:chats";
const MAX_CHATS = 20;

function load(): SavedChat[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function titleOf(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  const part = first?.parts.find((p) => p.type === "text");
  return (part && "text" in part ? part.text : "New chat").slice(0, 80);
}

const newId = () => crypto.randomUUID();

export function App() {
  const [chats, setChats] = useState<SavedChat[]>([]);
  const [activeId, setActiveId] = useState(newId);

  // Load after mount so server and client render the same HTML.
  useEffect(() => setChats(load()), []);

  function save(id: string, messages: UIMessage[]) {
    setChats((prev) => {
      const next = [
        { id, title: titleOf(messages), messages },
        ...prev.filter((c) => c.id !== id),
      ].slice(0, MAX_CHATS);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Storage full or blocked (private mode): the chat still works, it just isn't saved.
      }
      return next;
    });
  }

  const active = chats.find((c) => c.id === activeId);

  return (
    <div className="flex h-dvh bg-[var(--bg)] text-[var(--fg)]">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] px-3 py-3 md:flex">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Logo size={26} />
          <span className="text-[17px] font-semibold tracking-tight">Gabay</span>
        </div>

        <button
          onClick={() => setActiveId(newId())}
          className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--panel)] px-3 py-2 text-left text-sm font-medium transition hover:bg-[var(--panel-hover)]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          New chat
        </button>

        {/* ponytail: native <details> = collapsible with zero JS. */}
        <details className="group mt-2">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--fg-muted)] transition hover:bg-[var(--panel)] hover:text-[var(--fg)]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
            Documents
            <svg className="ml-auto transition group-open:rotate-90" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </summary>
          <ul className="mt-1 space-y-0.5 pl-3 text-sm text-[var(--fg-muted)]">
            {DOCS.map((d) => (
              <li key={d.name}>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate rounded-lg px-3 py-1.5 transition hover:bg-[var(--panel)] hover:text-[var(--fg)]"
                >
                  {d.name}
                </a>
              </li>
            ))}
          </ul>
        </details>

        <div className="mt-6 px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--fg-faint)]">
          Recents
        </div>
        <div className="mt-1 min-h-0 flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <p className="px-3 py-1.5 text-sm text-[var(--fg-faint)]">
              Your chats will appear here.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {chats.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveId(c.id)}
                    aria-current={c.id === activeId ? "page" : undefined}
                    className={`block w-full truncate rounded-lg px-3 py-1.5 text-left text-sm transition hover:bg-[var(--panel)] hover:text-[var(--fg)] ${
                      c.id === activeId ? "bg-[var(--panel)] text-[var(--fg)]" : "text-[var(--fg-muted)]"
                    }`}
                  >
                    {c.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] px-2 pt-3">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--panel)] text-xs font-semibold text-[var(--fg-muted)]">PH</div>
          <div className="leading-tight">
            <div className="text-xs font-medium text-[var(--fg)]">Gabay</div>
            <div className="text-[11px] text-[var(--fg-faint)]">Worker benefits · RAG</div>
          </div>
        </div>
      </aside>

      {/* key remounts useChat per conversation, so switching chats can't leak streams. */}
      <Chat
        key={activeId}
        id={activeId}
        initialMessages={active?.messages ?? []}
        onSave={(messages) => save(activeId, messages)}
      />
    </div>
  );
}
