# Gabay: Submission

**Graded Mini Project 14.3 · Ship Your Own RAG**

| | |
| --- | --- |
| **Live app** | <https://gabay-fint.vercel.app> |
| **Repository** | <https://github.com/jacobvillar/gabay> |
| **Reflection** | [reflection.pdf](reflection.pdf) (one page) |
| **Demo questions** | [demo-questions.md](demo-questions.md) |

Upload package `gabay-submission.zip` contains the reflection, this file, and the demo questions.

**Change from the starter:** the PDFs live in `public/docs/` instead of `data/`. Next.js serves that
folder publicly, so every source chip opens the cited PDF at its exact page; the seed script reads
from the same folder.

## Requirements

| Requirement | How Gabay meets it | Where |
| --- | --- | --- |
| Deployed publicly on Vercel | Live, auto-deploys from `main` | [gabay-fint.vercel.app](https://gabay-fint.vercel.app) |
| Streams answers via the Vercel AI SDK | `streamText` → UI message stream | `app/api/chat/route.ts` |
| RAG as a tool call | The model calls `searchKnowledgeBase` only when a question needs the handbooks | `lib/ai/tools.ts` |
| Sources visible under answers | Agency · page chips, one per page, each opening the PDF at that page | `components/Sources.tsx` |
| Non-trivial corpus | Official DOLE, SSS, PhilHealth and Pag-IBIG documents (1,305 chunks) | `public/docs/` |
| README and setup info | Setup, env vars, seeding, deploy | `README.md`, `docs/development/setup.md` |
| Secrets not in the client bundle | Keys read server-side only; the build passes with no env set | `lib/config.ts` |
| Meaningful empty state | Greeting plus four suggested questions | `components/EmptyState.tsx` |
| Specific, honest reflection | Corpus, trickiest decision, one strength, one weakness, next week | [reflection.pdf](reflection.pdf) |

## Beyond the checklist

**Answer quality**
- Hybrid retrieval: dense + BM25 keyword search, fused with reciprocal rank fusion, plus an optional per-agency boost.
- Every figure must come from a retrieved passage; off-topic questions are declined.
- At most two searches per question, so every reply ends in a written answer.

**Reliability**
- Keyword search keeps answering if the vector index is unavailable.
- A smaller fallback model takes over when the main model is rate-limited.
- The seed verifies itself: stored count plus a known-answer probe (13th-month pay → DOLE pp. 50–54).

**Security**
- No public upload, so nobody can poison the index; documents go in only through `npm run seed`.
- Chat history from the browser is untrusted: user and assistant text only, size-capped.
- 20 questions an hour per visitor; security headers; no question text in logs.

**Interface**
- Sidebar with New chat, Search chats, Documents, and Recents (Rename, Delete) saved in the browser. No accounts.

## Weekly outcomes

| Outcome | Evidence |
| --- | --- |
| Real corpus → usable knowledge base | `scripts/seed.ts`, 1,305 chunks with page metadata |
| Chunking, metadata, embedding decisions | Reflection §1 |
| Next.js + Vercel AI SDK streaming chat | `app/api/chat/route.ts` |
| Retrieval as a tool call | `lib/ai/tools.ts` |
| Public deploy with correct env | Live app; env set in Vercel |
| Honest reflection | Reflection §2–§5 |

## Stack

Next.js 15 · Vercel AI SDK v5 · Groq GPT-OSS 120B · Upstash Vector (`text-embedding-3-small`) · TypeScript · Tailwind CSS v4
