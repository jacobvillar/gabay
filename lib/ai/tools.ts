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
  execute: async ({ query }): Promise<{ sources: Source[] }> => {
    const sources = await retrieve(query);
    logger.info("retrieval", { query, hits: sources.length });
    return { sources };
  },
});
