# Gabay — Submission Package

**Graded Mini Project 14.3 — Ship Your Own RAG**

## Deliverables

| Item | Link / File |
| --- | --- |
| Public app URL | https://gabay.vercel.app |
| GitHub repository | https://github.com/jacobvillar/gabay |
| One-page reflection | [reflection.md](reflection.md) (export to PDF for upload) |
| Demo questions | [demo-questions.md](demo-questions.md) |

## How Gabay meets each requirement

| Requirement (final checklist) | Where / How |
| --- | --- |
| Deployed publicly on Vercel | https://gabay.vercel.app |
| Streams answers via the Vercel AI SDK | `app/api/chat/route.ts` → `streamText(...).toUIMessageStreamResponse()` |
| RAG implemented as a tool call | `lib/ai/tools.ts` `searchKnowledgeBase`; model calls it (not always-prepended) |
| Sources visible and readable under answers | `components/Sources.tsx` (doc · agency · page, linked) |
| Non-trivial, well-chosen corpus | DOLE/SSS/PhilHealth/Pag-IBIG official handbooks (`data/`) |
| Repo includes README + correct setup info | `README.md`, `docs/development/setup.md`, `.env.example` |
| Secrets not exposed in client bundle | Keys read server-side only via `lib/config.ts`; build passes with no env |
| Meaningful empty state | Centered greeting + suggested-prompt chips (`components/EmptyState.tsx`) |
| Reflection specific and honest | [reflection.md](reflection.md) |

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
