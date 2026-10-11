# AGENTS.md — working guidance for Gabay

## What this is
A one-week RAG mini-project: a public chatbot over Philippine worker-benefit handbooks.
Next.js (App Router) + Vercel AI SDK v5 (chat) + Groq (open-weight GPT-OSS) + Upstash Vector embeddings.

## Principles
- **Lazy but correct.** Smallest change that works. No speculative abstractions. Mark deliberate
  shortcuts with `// ponytail:` and name the upgrade path.
- **Secrets are server-only.** Access env via `lib/config.ts` getters inside functions, never at
  module top-level. Never add `NEXT_PUBLIC_*` secrets. `next build` must pass with no env set.
- **RAG is a tool call.** The model decides when to call `searchKnowledgeBase`. Do not prepend
  retrieved context to every message.
- **Citations are the point.** Every factual answer renders its sources (doc · agency · page).

## Layout (map to the production blueprint)
`app/api/chat` = request boundary · `lib/config` = secret resolution · `lib/ai/provider` = model
boundary · `lib/ai/tools` = tool registry · `lib/rag/*` = ingestion + retrieval ·
`lib/prompts` = prompt manifest · `lib/observability` = telemetry.

## Verify before committing
`npm run typecheck` · `npm test` · `npm run build` (all must pass, build without keys).

## Not now (blueprint `[+]`, add when the product needs it)
workers/queues, agents, DB migrations, persistence, caching, auth/rate-limiting.
