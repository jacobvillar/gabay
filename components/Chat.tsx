"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Message } from "./Message";
import { EmptyState } from "./EmptyState";

export function Chat() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <main className="flex h-dvh flex-1 flex-col bg-[var(--canvas)]">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onPick={submit} />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--canvas)] px-4 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-sm focus-within:border-[var(--accent)]"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            placeholder="Ask about pay, leave, SSS, PhilHealth, Pag-IBIG…"
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-[var(--fg)] outline-none placeholder:text-[var(--fg-muted)]"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40"
          >
            {busy ? "…" : "Send"}
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-[var(--fg-muted)]">
          General info, not legal advice. Verify with DOLE/SSS/PhilHealth/Pag-IBIG.
        </p>
      </div>
    </main>
  );
}
