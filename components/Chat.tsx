"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect, useState } from "react";
import { Message } from "./Message";
import { EmptyState } from "./EmptyState";
import { Logo } from "./Logo";

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
    </svg>
  );
}

type ChatProps = {
  id: string;
  initialMessages: UIMessage[];
  onSave: (messages: UIMessage[]) => void;
};

export function Chat({ id, initialMessages, onSave }: ChatProps) {
  const { messages, sendMessage, status, error, regenerate } = useChat({ id, messages: initialMessages });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  // Save once each answer finishes streaming (not on every token).
  useEffect(() => {
    if (status === "ready" && messages.length > initialMessages.length) onSave(messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  const composer = (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(input); }}
      className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 transition focus-within:border-[#4a4a55]"
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
        rows={1}
        aria-label="Ask a question"
        placeholder="Ask about pay, leave, SSS, PhilHealth, Pag-IBIG…"
        className="max-h-44 flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-[var(--fg)] outline-none placeholder:text-[var(--fg-muted)]"
      />
      <button
        type="submit"
        disabled={busy || !input.trim()}
        aria-label="Send"
        className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] transition disabled:bg-[var(--panel-hover)] disabled:text-[var(--fg-faint)]"
      >
        <SendIcon />
      </button>
    </form>
  );

  if (messages.length === 0) {
    return (
      <main className="flex h-dvh flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="w-full max-w-2xl">
            <div className="mb-6 flex flex-col items-center text-center">
              <Logo size={40} />
              <h1 className="mt-4 text-2xl font-semibold">Alamin ang benepisyo mo.</h1>
              <p className="mt-1.5 text-sm text-[var(--fg-muted)]">
                Answers from official DOLE, SSS, PhilHealth &amp; Pag-IBIG handbooks — with sources.
              </p>
            </div>
            {composer}
            <EmptyState onPick={submit} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-7 px-4 py-8">
          {messages.map((m, i) => (
            <Message key={m.id} message={m} pending={busy && i === messages.length - 1} />
          ))}
          {error && (
            <p role="alert" className="text-sm text-[var(--fg-muted)]">
              Something went wrong reaching the model.{" "}
              <button onClick={() => regenerate()} className="underline">Try again</button>
            </p>
          )}
        </div>
      </div>
      <div className="px-4 pb-5">
        <div className="mx-auto max-w-3xl">
          {composer}
        </div>
      </div>
    </main>
  );
}
