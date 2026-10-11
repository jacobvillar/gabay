/**
 * Model boundary — all LLM access goes through here.
 * Chat uses Groq (open-weight gpt-oss-120b). Embeddings are handled by Upstash, not here.
 */
import { createGroq } from "@ai-sdk/groq";
import { wrapLanguageModel } from "ai";
import { config } from "@/lib/config";
import { logger } from "@/lib/observability/logger";

let _groq: ReturnType<typeof createGroq> | null = null;

function groq() {
  // Lazy singleton so a missing key only errors at request time, not build.
  if (!_groq) _groq = createGroq({ apiKey: config.groqKey() });
  return _groq;
}

const isRateLimit = (e: unknown) =>
  (e as { statusCode?: number })?.statusCode === 429 || /rate limit/i.test(String((e as Error)?.message));

/**
 * Groq's free tier caps tokens per model per day. Each model has its own quota, so when the
 * primary is rate-limited we retry the same request once on the smaller fallback model.
 */
export const chatModel = () => {
  const fallback = groq()(config.fallbackChatModel);
  return wrapLanguageModel({
    model: groq()(config.chatModel),
    middleware: {
      wrapGenerate: async ({ doGenerate, params }) => {
        try {
          return await doGenerate();
        } catch (e) {
          if (!isRateLimit(e)) throw e;
          logger.warn("primary model rate-limited; using fallback", { model: config.fallbackChatModel });
          return fallback.doGenerate(params);
        }
      },
      wrapStream: async ({ doStream, params }) => {
        try {
          return await doStream();
        } catch (e) {
          if (!isRateLimit(e)) throw e;
          logger.warn("primary model rate-limited; using fallback", { model: config.fallbackChatModel });
          return fallback.doStream(params);
        }
      },
    },
  });
};
