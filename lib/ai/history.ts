/**
 * The chat history comes from the browser, so treat it as untrusted. Keep only user and assistant
 * text: a client-sent system message could replace the prompt, and a forged tool output could
 * plant fake "handbook" passages. Dropping old tool outputs also keeps the payload small; the
 * model searches again for a follow-up.
 * ponytail: caps bound token spend per request; rate limiting is a Vercel firewall rule, not code.
 */
import type { UIMessage } from "ai";

export const MAX_MESSAGES = 20;
export const MAX_TEXT_CHARS = 4000; // fits a long answer; a question is far shorter

export function sanitizeHistory(messages: unknown[]): UIMessage[] {
  const out: UIMessage[] = [];
  for (const m of messages) {
    const msg = m as Partial<UIMessage> | null;
    if ((msg?.role !== "user" && msg?.role !== "assistant") || !Array.isArray(msg.parts)) continue;
    const parts = msg.parts
      .filter((p) => p?.type === "text" && typeof p.text === "string")
      .map((p) => ({ type: "text" as const, text: (p as { text: string }).text.slice(0, MAX_TEXT_CHARS) }));
    if (parts.length) out.push({ id: String(msg.id ?? out.length), role: msg.role, parts });
  }
  return out.slice(-MAX_MESSAGES);
}
