"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Chat } from "./Chat";
import { Logo } from "./Logo";

const DOCS = [
  { name: "DOLE — Statutory Benefits", url: "/docs/dole-handbook-2023.pdf" },
  { name: "SSS — Citizens Charter", url: "/docs/sss-citizens-charter-2025.pdf" },
  { name: "PhilHealth — Konsulta", url: "/docs/philhealth-konsulta-circular-2022.pdf" },
  { name: "Pag-IBIG — Programs", url: "/docs/pagibig-programs-2019.pdf" },
];

type SavedChat = { id: string; title: string; messages: UIMessage[] };

// Recents and the collapsed state live in this browser's localStorage — no accounts, no server
// storage. Chats are capped so answers (which carry source passages) never fill the quota.
const CHATS_KEY = "gabay:chats";
const COLLAPSED_KEY = "gabay:sidebar-collapsed";
const MAX_CHATS = 20;

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): the app still works, it just isn't remembered.
  }
}

function titleOf(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  const part = first?.parts.find((p) => p.type === "text");
  return (part && "text" in part ? part.text : "New chat").slice(0, 80);
}

const newId = () => crypto.randomUUID();

/* One icon family: 24px grid, 2px stroke, round caps (Lucide geometry, inlined — no dependency). */
function Icon({ d, size = 16 }: { d: string[]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      {d.map((p) => <path key={p} d={p} />)}
    </svg>
  );
}
const ICONS = {
  newChat: ["M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"],
  search: ["m21 21-4.3-4.3", "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"],
  docs: ["M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"],
  file: ["M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", "M14 2v4a2 2 0 0 0 2 2h4"],
  panel: ["M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M9 3v18"],
  chevron: ["m9 18 6-6-6-6"],
  more: ["M12 12h.01", "M19 12h.01", "M5 12h.01"],
  rename: ["M12 20h9", "M16.4 3.6a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"],
  trash: ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
};

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg-muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar)]";

/** A rail item: icon + label when expanded; icon-only with tooltip + aria-label when collapsed. */
function NavButton({
  icon, label, collapsed, onClick, active = false, expanded,
}: {
  icon: ReactNode; label: string; collapsed: boolean; onClick: () => void; active?: boolean; expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      aria-expanded={expanded}
      className={`flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-xl text-sm transition-colors duration-150 ${focusRing} ${
        collapsed ? "justify-center px-0" : "px-3"
      } ${active ? "bg-[var(--panel)] font-medium text-[var(--fg)] hover:bg-[var(--panel-hover)]" : "text-[var(--fg-muted)] hover:bg-[var(--panel)] hover:text-[var(--fg)]"}`}
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

export function App() {
  const [chats, setChats] = useState<SavedChat[]>([]);
  const [activeId, setActiveId] = useState(newId);
  const [collapsed, setCollapsed] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [animate, setAnimate] = useState(false);
  // Per-chat "…" menu (Rename / Delete). Fixed-positioned so the scrolling list can't clip it.
  const [menu, setMenu] = useState<{ id: string; top: number; left: number; confirm: boolean } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load after mount so server and client render the same HTML.
  useEffect(() => {
    setChats(read<SavedChat[]>(CHATS_KEY, []));
    setCollapsed(read(COLLAPSED_KEY, false));
    // Enable the width transition only after the restored state has painted, so a collapsed
    // sidebar doesn't animate shut on every page load.
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching, collapsed]);

  function toggleCollapsed(next = !collapsed) {
    setCollapsed(next);
    write(COLLAPSED_KEY, next);
  }

  function save(id: string, messages: UIMessage[]) {
    setChats((prev) => {
      const next = [
        { id, title: prev.find((c) => c.id === id)?.title ?? titleOf(messages), messages },
        ...prev.filter((c) => c.id !== id),
      ].slice(0, MAX_CHATS);
      write(CHATS_KEY, next);
      return next;
    });
  }

  // Close the chat menu on outside click, Escape, or list scroll.
  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      const target = e.target as Element;
      // Clicks inside the menu or on a "…" toggle are handled by their own onClick.
      if (e.type === "mousedown" && (menuRef.current?.contains(target) || target.closest?.('[aria-haspopup="menu"]'))) return;
      setMenu(null);
    };
    const events = ["mousedown", "keydown", "scroll"] as const;
    for (const ev of events) document.addEventListener(ev, close, true);
    return () => {
      for (const ev of events) document.removeEventListener(ev, close, true);
    };
  }, [menu]);

  function updateChats(fn: (prev: SavedChat[]) => SavedChat[]) {
    setChats((prev) => {
      const next = fn(prev);
      write(CHATS_KEY, next);
      return next;
    });
  }

  function renameChat(id: string, title: string) {
    const t = title.trim();
    if (t) updateChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: t.slice(0, 80) } : c)));
    setRenaming(null);
  }

  function removeChat(id: string) {
    updateChats((prev) => prev.filter((c) => c.id !== id));
    if (id === activeId) setActiveId(newId());
    setMenu(null);
  }

  // Rail icons for sections expand the sidebar first, then open that section.
  function openSection(section: "search" | "docs") {
    if (collapsed) toggleCollapsed(false);
    if (section === "search") setSearching((s) => (collapsed ? true : !s));
    else setDocsOpen((o) => (collapsed ? true : !o));
  }

  const active = chats.find((c) => c.id === activeId);
  const q = query.trim().toLowerCase();
  const visible = q ? chats.filter((c) => c.title.toLowerCase().includes(q)) : chats;

  return (
    <div className="flex h-dvh bg-[var(--bg)] text-[var(--fg)]">
      <aside
        aria-label="Sidebar"
        className={`hidden shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] py-3 md:flex ${
          animate ? "transition-[width] duration-200 ease-out motion-reduce:transition-none" : ""
        } ${
          collapsed ? "w-16 px-2" : "w-[260px] px-3"
        }`}
      >
        {/* Brand row: logo + wordmark + collapse toggle; collapsed, the logo itself expands. */}
        <div className={`flex h-10 items-center ${collapsed ? "justify-center" : "justify-between pl-2"}`}>
          {collapsed ? (
            <button
              type="button"
              onClick={() => toggleCollapsed(false)}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              aria-expanded={false}
              className={`grid h-9 w-9 cursor-pointer place-items-center rounded-xl transition-colors duration-150 hover:bg-[var(--panel)] ${focusRing}`}
            >
              <Logo size={26} />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Logo size={26} />
                <span className="text-[17px] font-semibold tracking-tight">Gabay</span>
              </div>
              <button
                type="button"
                onClick={() => toggleCollapsed(true)}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                aria-expanded={true}
                className={`grid h-9 w-9 cursor-pointer place-items-center rounded-xl text-[var(--fg-muted)] transition-colors duration-150 hover:bg-[var(--panel)] hover:text-[var(--fg)] ${focusRing}`}
              >
                <Icon d={ICONS.panel} size={18} />
              </button>
            </>
          )}
        </div>

        <nav className="mt-4 space-y-1">
          <NavButton
            icon={<Icon d={ICONS.newChat} />}
            label="New chat"
            collapsed={collapsed}
            active={!active}
            onClick={() => { setActiveId(newId()); setSearching(false); setQuery(""); }}
          />
          <NavButton
            icon={<Icon d={ICONS.search} />}
            label="Search chats"
            collapsed={collapsed}
            expanded={collapsed ? undefined : searching}
            onClick={() => openSection("search")}
          />
          <NavButton
            icon={<Icon d={ICONS.docs} />}
            label="Documents"
            collapsed={collapsed}
            expanded={collapsed ? undefined : docsOpen}
            onClick={() => openSection("docs")}
          />
          {!collapsed && docsOpen && (
            <ul className="space-y-0.5 pb-1 pl-4 text-sm">
              {DOCS.map((d) => (
                <li key={d.name}>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[var(--fg-muted)] transition-colors duration-150 hover:bg-[var(--panel)] hover:text-[var(--fg)] ${focusRing}`}
                  >
                    <Icon d={ICONS.file} size={14} />
                    <span className="truncate">{d.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {!collapsed && (
          <>
            {searching && (
              <div className="mt-3 px-1">
                <label htmlFor="chat-search" className="sr-only">Search chats</label>
                <input
                  id="chat-search"
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { setSearching(false); setQuery(""); } }}
                  placeholder="Search chats…"
                  className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 text-sm text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--fg-muted)] focus:border-[var(--fg-faint)]"
                />
              </div>
            )}

            <h2 className="mt-6 px-3 text-xs font-medium text-[var(--fg-muted)]">Recents</h2>
            <div className="mt-1 min-h-0 flex-1 overflow-y-auto">
              {visible.length === 0 ? (
                <p className="px-3 py-1.5 text-sm text-[var(--fg-muted)]">
                  {q ? "No chats match your search." : "Try asking a question — your chats will appear here."}
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {visible.map((c) => (
                    <li key={c.id} className="group relative">
                      {renaming === c.id ? (
                        <input
                          autoFocus
                          defaultValue={c.title}
                          aria-label="Chat name"
                          onFocus={(e) => e.currentTarget.select()}
                          onBlur={(e) => renameChat(c.id, e.currentTarget.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renameChat(c.id, e.currentTarget.value);
                            if (e.key === "Escape") setRenaming(null);
                          }}
                          className="h-8 w-full rounded-lg border border-[var(--fg-faint)] bg-[var(--panel)] px-3 text-sm text-[var(--fg)] outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveId(c.id)}
                          aria-current={c.id === activeId ? "page" : undefined}
                          title={c.title}
                          className={`block w-full cursor-pointer truncate rounded-lg py-1.5 pl-3 pr-9 text-left text-sm transition-colors duration-150 hover:bg-[var(--panel)] hover:text-[var(--fg)] ${focusRing} ${
                            c.id === activeId ? "bg-[var(--panel)] text-[var(--fg)]" : "text-[var(--fg-muted)]"
                          }`}
                        >
                          {c.title}
                        </button>
                      )}
                      {renaming !== c.id && (
                        <button
                          type="button"
                          aria-label={`Options for ${c.title}`}
                          aria-haspopup="menu"
                          aria-expanded={menu?.id === c.id}
                          onClick={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            setMenu(menu?.id === c.id ? null : { id: c.id, top: r.bottom + 4, left: r.left, confirm: false });
                          }}
                          className={`absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-[var(--fg-muted)] transition-opacity duration-150 hover:bg-[var(--panel-hover)] hover:text-[var(--fg)] focus-visible:opacity-100 group-hover:opacity-100 ${focusRing} ${
                            menu?.id === c.id || c.id === activeId ? "opacity-100" : "opacity-0"
                          }`}
                        >
                          <Icon d={ICONS.more} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <div className={`mt-auto flex items-center gap-2 border-t border-[var(--border)] pt-3 ${collapsed ? "justify-center" : "px-2"}`}>
          <div
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--fg)] text-[11px] font-semibold text-[var(--bg)]"
            title={collapsed ? "Gabay · Worker benefits RAG" : undefined}
            aria-hidden
          >
            PH
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-xs font-medium text-[var(--fg)]">Gabay</div>
              <div className="text-[11px] text-[var(--fg-muted)]">Worker benefits · RAG</div>
            </div>
          )}
        </div>
        {menu && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Chat options"
            style={{ top: menu.top, left: menu.left }}
            className="fixed z-50 w-44 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-1 shadow-xl shadow-black/40"
          >
            <button
              type="button"
              role="menuitem"
              autoFocus
              onClick={() => { setRenaming(menu.id); setMenu(null); }}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--fg)] hover:bg-[var(--panel-hover)] ${focusRing}`}
            >
              <Icon d={ICONS.rename} /> Rename
            </button>
            <div className="my-1 h-px bg-[var(--border)]" />
            <button
              type="button"
              role="menuitem"
              onClick={() => (menu.confirm ? removeChat(menu.id) : setMenu({ ...menu, confirm: true }))}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#f87171] hover:bg-[var(--panel-hover)] ${focusRing}`}
            >
              <Icon d={ICONS.trash} /> {menu.confirm ? "Click again to delete" : "Delete"}
            </button>
          </div>
        )}
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
