import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { searchKnowledgeBase } from "@/lib/ai/tools";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

// This route runs server-side only. Secrets never reach the client.
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: chatModel(),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools: { searchKnowledgeBase },
    stopWhen: stepCountIs(3), // allow: tool call -> answer
  });

  return result.toUIMessageStreamResponse();
}
