/**
 * Typed, lazy access to server-side secrets.
 * ponytail: read at call time, never at module top-level, so `next build`
 * succeeds without env vars and nothing secret can reach the client bundle.
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return v;
}

export const config = {
  groqKey: () => required("GROQ_API_KEY"),
  upstashUrl: () => required("UPSTASH_VECTOR_REST_URL"),
  upstashToken: () => required("UPSTASH_VECTOR_REST_TOKEN"),
  // Tunables (product decisions, not defaults to ignore).
  // Open-weight GPT-OSS on Groq; supports tool calling, free tier.
  chatModel: "openai/gpt-oss-120b",
  // Separate daily token quota on Groq's free tier; used only when the primary is rate-limited.
  fallbackChatModel: "openai/gpt-oss-20b",
  topK: 8,
  // Embeddings are done server-side by Upstash (index created with a built-in model),
  // so there is no embedding model or key here.
} as const;
