/**
 * The chat history comes from the browser, so treat it as untrusted. Keep only user and assistant
 * text: a client-sent system message could replace the prompt, and a forged tool output could
 * plant fake "handbook" passages. Dropping old tool outputs also keeps the payload small; the
 * model searches again for a follow-up. The caps bound token spend per request; the per-visitor
 * request limit is lib/ratelimit.ts.
 */
import type { UIMessage } from "ai";

export const MAX_MESSAGES = 20;
export const MAX_TEXT_CHARS = 4000; // per message, all its text parts together; fits a long answer
export const MAX_HISTORY_CHARS = 16_000; // whole history (~4k tokens); oldest messages drop first

export function sanitizeHistory(messages: unknown[]): UIMessage[] {
  const clean: UIMessage[] = [];
  for (const m of messages) {
    const msg = m as Partial<UIMessage> | null;
    if ((msg?.role !== "user" && msg?.role !== "assistant") || !Array.isArray(msg.parts)) continue;
    const text = msg.parts
      .filter((p) => p?.type === "text" && typeof p.text === "string")
      .map((p) => (p as { text: string }).text)
      .join("")
      .slice(0, MAX_TEXT_CHARS);
    if (text) clean.push({ id: String(msg.id ?? clean.length), role: msg.role, parts: [{ type: "text", text }] });
  }
  // Keep the newest messages that fit the total budget.
  const out: UIMessage[] = [];
  let total = 0;
  for (const m of clean.slice(-MAX_MESSAGES).reverse()) {
    total += (m.parts[0] as { text: string }).text.length;
    if (total > MAX_HISTORY_CHARS) break;
    out.unshift(m);
  }
  return out;
}
