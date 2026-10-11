import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { searchKnowledgeBase } from "@/lib/ai/tools";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { logger } from "@/lib/observability/logger";

// This route runs server-side only. Secrets never reach the client.
export const maxDuration = 120; // reasoning + 2 searches + Groq free-tier retry backoff can exceed 60s
// ponytail: cap history to bound token spend on a public endpoint; add rate limiting if abused.
const MAX_MESSAGES = 20;
const MAX_STEPS = 4; // tool budget (lib/ai/tools.ts) leaves the last step for the answer

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const messages = body?.messages as UIMessage[] | undefined;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Expected { messages: UIMessage[] }" }, { status: 400 });
  }

  const result = streamText({
    model: chatModel(),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages.slice(-MAX_MESSAGES)),
    tools: { searchKnowledgeBase },
    stopWhen: stepCountIs(MAX_STEPS),
    // The client only sees a generic message; keep the real cause in the server logs.
    onError: ({ error }) => logger.error("chat stream failed", {
        error: error instanceof Error ? error.message : JSON.stringify(error),
      }),
  });

  return result.toUIMessageStreamResponse();
}
