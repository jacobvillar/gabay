import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { searchKnowledgeBase } from "@/lib/ai/tools";
import { sanitizeHistory } from "@/lib/ai/history";
import { allowRequest, RATE_LIMITED } from "@/lib/ratelimit";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { logger } from "@/lib/observability/logger";

// This route runs server-side only. Secrets never reach the client.
export const maxDuration = 120; // reasoning + 2 searches + Groq free-tier retry backoff can exceed 60s
const MAX_STEPS = 4; // tool budget (lib/ai/tools.ts) leaves the last step for the answer

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const messages = Array.isArray(body?.messages) ? sanitizeHistory(body.messages) : [];
  if (messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Expected { messages: UIMessage[] } ending with a user message" }, { status: 400 });
  }
  if (!allowRequest(req)) {
    // Plain text: the chat UI shows this message as is.
    return new Response(RATE_LIMITED, { status: 429 });
  }

  const result = streamText({
    model: chatModel(),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools: { searchKnowledgeBase },
    stopWhen: stepCountIs(MAX_STEPS),
    // Parallel calls in one step would all see the same search count and slip past the budget.
    providerOptions: { groq: { parallelToolCalls: false } },
    maxOutputTokens: 4096, // per step, reasoning included; bounds spend on the shared daily quota
    // The client only sees a generic message; keep the real cause in the server logs.
    onError: ({ error }) => logger.error("chat stream failed", {
        error: error instanceof Error ? error.message : JSON.stringify(error),
      }),
  });

  return result.toUIMessageStreamResponse();
}
