/** The retrieval tool. The model decides when to call it (RAG as a tool call). */
import { tool } from "ai";
import { z } from "zod";
import { retrieve, type Source } from "@/lib/rag/retrieval";
import { logger } from "@/lib/observability/logger";

export const searchKnowledgeBase = tool({
  description:
    "Search the official Philippine worker-benefits handbooks (DOLE, SSS, PhilHealth, " +
    "Pag-IBIG) for passages relevant to the user's question. Call this for ANY question " +
    "about pay, leave, 13th-month pay, contributions, loans, claims, or member benefits. " +
    "Do not answer such questions from general knowledge — use this tool.",
  inputSchema: z.object({
    query: z.string().describe("A focused search query derived from the user's question."),
  }),
  execute: async ({ query }, { messages }): Promise<{ sources: Source[]; note?: string }> => {
    // Search budget, enforced here because Groq rejects toolChoice "none" for gpt-oss.
    // Without it, a model unhappy with the passages searches until the step cap and never answers.
    const prior = messages
      .flatMap((m) => (m.role === "assistant" && Array.isArray(m.content) ? m.content : []))
      .filter((p) => p.type === "tool-call").length;
    if (prior >= 2) {
      return { sources: [], note: "Search limit reached. Do not search again. Answer now from the passages already returned; say plainly what they do not cover." };
    }
    const sources = await retrieve(query);
    logger.info("retrieval", { query, hits: sources.length, call: prior + 1 });
    return prior === 1
      ? { sources, note: "This was your last search. Answer now from all passages returned so far." }
      : { sources };
  },
});
