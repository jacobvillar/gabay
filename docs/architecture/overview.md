# Architecture

```text
 Browser (Chat.tsx, useChat)
    │  POST /api/chat  (UIMessage[])
    ▼
 app/api/chat/route.ts   ── server only, holds no secret in the client bundle
    │  sanitizeHistory (lib/ai/history.ts) → user/assistant text only
    │  allowRequest (lib/ratelimit.ts) → 429 past 20 questions/hour per IP
    │  streamText(model, system, tools:{searchKnowledgeBase})
    │
    ├─ model decides to call the tool ─▶ lib/ai/tools.ts
    │                                      └▶ lib/rag/retrieval.ts
    │                                           ├ Upstash embeds query (server-side)
    │                                           ├ query Upstash (topK, agency boost)
    │                                           ├ BM25 over lib/rag/chunks.json (same filter)
    │                                           └ reciprocal rank fusion → top K
    │  tool returns { sources }
    ▼
 streamed answer + tool output ─▶ Message.tsx renders text + Sources.tsx
```

## Pieces
- **Request boundary** — `app/api/chat/route.ts`: request validation (400 on a malformed body or
  when the last message isn't the user's), streaming, tool wiring, `stepCountIs(4)`, server-side
  error logging. `lib/ai/history.ts` treats the browser's history as untrusted: user/assistant
  text only, 20 messages, 4,000 chars each, 16,000 total. `lib/ratelimit.ts` limits each IP to 20 questions an
  hour (in-memory sliding window, per server instance).
- **Model boundary** — `lib/ai/provider.ts`: lazy Groq (open-weight gpt-oss-120b) chat model that retries on gpt-oss-20b when rate-limited;
  embeddings handled by Upstash.
- **Tool** — `lib/ai/tools.ts`: `searchKnowledgeBase`, the only way facts enter an answer. It enforces a two-search budget
  per question, counted since the latest user message (Groq rejects `toolChoice: "none"` for gpt-oss, so the loop is bounded in the tool, not the prompt).
- **Retrieval** — `lib/rag/retrieval.ts`: hybrid: Upstash dense query (embedded server-side) and BM25
  keyword search (`lib/rag/keyword.ts`) run in parallel, optionally boosting one agency, fused
  with reciprocal rank fusion into a typed `Source[]`. Either side may be empty.
- **Ingestion** — `lib/rag/ingestion.ts` owns extraction, metadata and chunking (unit-tested);
  `scripts/seed.ts` is the I/O CLI: sorted files, batch retry, `--dry-run`, and post-seed
  verification (count + known-answer probe). Pipeline: per-page parse (repairs PDF ligature breaks
  like "bene fi t") → chunk → write `lib/rag/chunks.json` → upsert with
  `{ document_title, agency, page, source_url }`, where `source_url` is `/docs/<file>`.

## RAG as a tool call
Context is not prepended to every turn. The model calls the tool only when a benefit question
warrants it, which keeps chit-chat cheap and makes retrieval observable.
