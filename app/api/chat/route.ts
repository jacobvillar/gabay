import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { searchKnowledgeBase } from "@/lib/ai/tools";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

// This route runs server-side only. Secrets never reach the client.
export const maxDuration = 30;
// ponytail: cap history to bound token spend on a public endpoint; add rate limiting if abused.
const MAX_MESSAGES = 20;

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
    stopWhen: stepCountIs(3), // allow: tool call -> answer
  });

  return result.toUIMessageStreamResponse();
}
