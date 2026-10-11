# Architecture

```text
 Browser (Chat.tsx, useChat)
    │  POST /api/chat  (UIMessage[])
    ▼
 app/api/chat/route.ts   ── server only, holds no secret in the client bundle
    │  streamText(model, system, tools:{searchKnowledgeBase})
    │
    ├─ model decides to call the tool ─▶ lib/ai/tools.ts
    │                                      └▶ lib/rag/retrieval.ts
    │                                           ├ Upstash embeds query (server-side)
    │                                           └ query Upstash (topK, metadata)
    │  tool returns { sources }
    ▼
 streamed answer + tool output ─▶ Message.tsx renders text + Sources.tsx
```

## Pieces
- **Request boundary** — `app/api/chat/route.ts`: streaming, tool wiring, `stepCountIs(3)`.
- **Model boundary** — `lib/ai/provider.ts`: lazy Groq (Llama) chat model; embeddings handled by Upstash.
- **Tool** — `lib/ai/tools.ts`: `searchKnowledgeBase`, the only way facts enter an answer.
- **Retrieval** — `lib/rag/retrieval.ts`: embed → Upstash query → typed `Source[]`.
- **Ingestion** — `scripts/seed.ts` + `lib/rag/ingestion.ts`: per-page parse → chunk → embed →
  upsert with `{ document_title, agency, page, source_url }`.

## RAG as a tool call
Context is not prepended to every turn. The model calls the tool only when a benefit question
warrants it, which keeps chit-chat cheap and makes retrieval observable.
