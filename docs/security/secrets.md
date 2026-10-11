# Secrets

## Rules
- All three keys (`GROQ_API_KEY`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`) are
  **server-only**. They are read through `lib/config.ts` getters, **inside** functions/handlers,
  never at module top-level.
- No `NEXT_PUBLIC_*` secret exists. Only server code (`app/api/chat/route.ts`, `lib/*`,
  `scripts/seed.ts`) touches keys, so nothing secret enters the client bundle.
- `next build` succeeds with **no** env set — proof that keys are runtime-only.

## Handling
- `.env*` is gitignored except `.env.example` (placeholders only).
- In production, set env vars in Vercel, not in the repo.
- The Upstash token is read-write (needed for seeding). If you want the deployed app to be
  read-only, create a read-only token for production and keep the read-write one for seeding.
- No OpenAI key is used: chat runs on Groq (open-weight gpt-oss-120b), embeddings run inside Upstash.
