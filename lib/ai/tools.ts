/** The retrieval tool. The model decides when to call it (RAG as a tool call). */
import { tool, type ModelMessage } from "ai";
import { z } from "zod";
import { retrieve, type Source } from "@/lib/rag/retrieval";
import { logger } from "@/lib/observability/logger";

/**
 * Searches already made since the user's latest message. `messages` holds the whole chat, so
 * counting all of it would spend the budget on earlier questions and block every follow-up.
 */
export function searchesThisTurn(messages: ModelMessage[]): number {
  let n = 0;
  for (let i = messages.length - 1; i >= 0 && messages[i].role !== "user"; i--) {
    const m = messages[i];
    if (m.role === "assistant" && Array.isArray(m.content)) n += m.content.filter((p) => p.type === "tool-call").length;
  }
  return n;
}

export const searchKnowledgeBase = tool({
  description:
    "Search the official Philippine worker-benefits handbooks (DOLE, SSS, PhilHealth, " +
    "Pag-IBIG) for passages relevant to the user's question. Call this for ANY question " +
    "about pay, leave, 13th-month pay, contributions, loans, claims, or member benefits. " +
    "Do not answer such questions from general knowledge — use this tool.",
  inputSchema: z.object({
    query: z.string().describe("A focused search query derived from the user's question."),
    agency: z
      .enum(["DOLE", "SSS", "PhilHealth", "Pag-IBIG"])
      .optional()
      .describe(
        "Prefer one agency's handbook when the question clearly belongs to it (results from it rank higher; others still appear) " +
          "(13th-month pay, leave, holiday pay, wages → DOLE; SSS loans, contributions, maternity, " +
          "retirement claims → SSS; Konsulta → PhilHealth; Pag-IBIG loans → Pag-IBIG). Omit if unsure.",
      ),
  }),
  execute: async ({ query, agency }, { messages }): Promise<{ sources: Source[]; note?: string }> => {
    // Search budget, enforced here because Groq rejects toolChoice "none" for gpt-oss.
    // Without it, a model unhappy with the passages searches until the step cap and never answers.
    const prior = searchesThisTurn(messages);
    if (prior >= 2) {
      return { sources: [], note: "Search limit reached. Do not search again. Answer now from the passages already returned; say plainly what they do not cover." };
    }
    const sources = await retrieve(query, undefined, agency);
    logger.info("retrieval", { query, agency, hits: sources.length, call: prior + 1 });
    return prior === 1
      ? { sources, note: "This was your last search. Answer now from all passages returned so far." }
      : { sources };
  },
});
