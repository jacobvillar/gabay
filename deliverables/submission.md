# Gabay — Submission Package

**Graded Mini Project 14.3 — Ship Your Own RAG**

## Deliverables

| Item | Link / File |
| --- | --- |
| Public app URL | https://gabay-fint.vercel.app |
| GitHub repository | https://github.com/jacobvillar/gabay |
| One-page reflection | [reflection.pdf](reflection.pdf) (source: [reflection.md](reflection.md)) |
| Upload package | `gabay-submission.zip` (reflection.pdf + this file + demo questions) |
| Demo questions | [demo-questions.md](demo-questions.md) |

## How Gabay meets each requirement

| Requirement (final checklist) | Where / How |
| --- | --- |
| Deployed publicly on Vercel | https://gabay-fint.vercel.app |
| Streams answers via the Vercel AI SDK | `app/api/chat/route.ts` → `streamText(...).toUIMessageStreamResponse()` |
| RAG implemented as a tool call | `lib/ai/tools.ts` `searchKnowledgeBase`; model calls it (not always-prepended) |
| Sources visible and readable under answers | `components/Sources.tsx` — numbered agency · page chips, one per document page, full title on hover, linked |
| Non-trivial, well-chosen corpus | DOLE/SSS/PhilHealth/Pag-IBIG official handbooks (`public/docs/`, linked from every citation) |
| Repo includes README + correct setup info | `README.md`, `docs/development/setup.md`, `.env.example` |
| Secrets not exposed in client bundle | Keys read server-side only via `lib/config.ts`; build passes with no env |
| Meaningful empty state | Centered greeting + suggested-prompt chips (`components/EmptyState.tsx`) |
| Reflection specific and honest | [reflection.pdf](reflection.pdf) (one page) |

## Beyond the checklist

- **Onyx-style sidebar** (`components/App.tsx`): New chat, collapsible Documents, and Recents
  saved in the visitor's browser (no accounts, no server storage).
- **No public admin upload, on purpose:** it would let anyone poison the index. New documents go
  through `npm run seed`.
- **Citations open the source:** each chip opens the PDF at the cited page.
- **Hybrid retrieval:** dense + BM25 keyword search fused with reciprocal rank fusion, with an
  optional per-agency boost to counter the SSS-heavy corpus. Keyword search keeps answering if the
  vector index is unavailable.
- **Graceful degradation:** a fallback chat model on rate limits, and a two-search budget so every
  reply ends with a written answer.
- **Chat management:** Search chats, plus Rename and Delete on each recent chat.
- **Hardened API:** `/api/chat` rejects malformed requests with 400 and caps history at 20 messages;
  the UI shows model errors with a retry.
- **Verified ingestion:** `npm run seed` checks the stored count and a known-answer probe
  (13th-month pay → DOLE pp. 50-54) and fails loudly otherwise; `-- --dry-run` skips Upstash.
- **Checks:** `npm run typecheck && npm test && npm run build` pass (19 tests: chunking, PDF
  ligature repair, citation metadata, the 400 path, keyword search, rank fusion, the agency
  filter); the build passes with no env vars.

## Weekly outcomes addressed

1. Real document corpus → usable RAG knowledge base ✓ (`scripts/seed.ts`)
2. Chunking, metadata, and embedding decisions for a live use case ✓ (see reflection table)
3. Next.js + Vercel AI SDK streaming chat ✓
4. Retrieval as a tool call, not prepended context ✓
5. Public Vercel deploy with correct env configuration ✓
6. Honest reflection on strengths, weaknesses, trade-offs ✓

## Stack

Next.js (App Router) · Vercel AI SDK v5 · Groq (open-weight GPT-OSS 120B) · Upstash Vector
(built-in embeddings) · TypeScript · Tailwind CSS v4.
