/**
 * Model boundary — all LLM access goes through here.
 * Chat uses Groq (open-weight gpt-oss-120b). Embeddings are handled by Upstash, not here.
 */
import { createGroq } from "@ai-sdk/groq";
import { config } from "@/lib/config";

let _groq: ReturnType<typeof createGroq> | null = null;

function groq() {
  // ponytail: lazy singleton so a missing key only errors at request time, not build.
  if (!_groq) _groq = createGroq({ apiKey: config.groqKey() });
  return _groq;
}

export const chatModel = () => groq()(config.chatModel);
