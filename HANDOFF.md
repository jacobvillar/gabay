# HANDOFF — Gabay (Week 14.3 "Ship Your Own RAG")

> Context for a fresh session on this repo. Read this first.

## Current state (2026-10-11)

Deployed and working at https://gabay-fint.vercel.app. Recent work: a self-verifying seed (ingestion logic in
`lib/rag/ingestion.ts`), request validation and error
surfacing, PDF-page citations, hybrid dense + keyword (BM25) retrieval with a per-agency boost, a fallback chat model, a
two-search tool budget, PDF ligature repair, and an Onyx-style sidebar (collapsible rail, Search
chats, Documents, Recents with Rename/Delete).

**Before relying on the live app:** confirm the Upstash index holds 1,305 vectors (`npm run seed`
once if it is empty; it verifies the count and a 13th-month probe and exits non-zero on failure;
`-- --dry-run` extracts and writes `chunks.json` without touching Upstash) and that Groq's daily quota is not exhausted (see Reliability notes).

## What Gabay is

A public, domain-specific RAG assistant answering **Philippine statutory worker-benefit** questions
(DOLE / SSS / PhilHealth / Pag-IBIG) strictly from official handbooks, with cited sources.

- **Live:** https://gabay-fint.vercel.app  (NOT gabay.vercel.app — that subdomain is an unrelated 2023 app we do not own)
- **Repo:** https://github.com/jacobvillar/gabay  (GitHub account: `jacobvillar`; a `jacob-villar`
  duplicate was created then removed — ignore it)
- **Vercel:** project `gabay`, team `jacob-villar1`, auto-deploys on push to `main`
- **Local:** `/Users/jacobvillar/Developer/jacobvillar/gabay` (single repo, branch `main`)
- **Start from the latest `main`** (`git log -1`)

## Stack

Next.js 15 (App Router) · Vercel AI SDK v5 (streaming + tool-call RAG) · **Groq** chat model
`openai/gpt-oss-120b` (open-weight, free tier) · **Upstash Vector** with a built-in embedding model
(text in, vectors server-side — no embedding key) · TypeScript · Tailwind v4 · Hanken Grotesk.
**No OpenAI key. No LangChain** (intentional — brief mandates the Vercel AI SDK).

## Key files

| Area | Path |
| --- | --- |
| Streaming + tool wiring | `app/api/chat/route.ts` |
| Retrieval tool | `lib/ai/tools.ts` (`searchKnowledgeBase`) |
| Retrieval (Upstash query) | `lib/rag/retrieval.ts` |
| Chunking | `lib/rag/ingestion.ts` + `scripts/seed.ts` |
| Model boundary | `lib/ai/provider.ts` (Groq) |
| Secrets (lazy getters) | `lib/config.ts` (`topK: 8`, `chatModel`) |
| System prompt | `lib/prompts/system.ts` |
| UI shell + sidebar | `components/App.tsx` (New chat · Documents toggle · Recents in localStorage); `app/page.tsx` just renders it |
| Chat UI | `components/{Chat,Message,Sources,EmptyState,Logo}.tsx` |
| Corpus (PDFs) | `public/docs/*.pdf` (served at `/docs/…`, so citations open the exact page) |
| Docs | `docs/`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `PRODUCT.md` |
| Deliverables | `deliverables/` (reflection md+pdf, submission.md, demo-questions.md, zip) |

## Sidebar (Onyx-style, shipped 2026-10-11)

- **New chat** → fresh conversation (`key={activeId}` remounts `useChat`).
- **Collapse** → toggle collapses to a 64px icon rail (logo expands it); state persists.
- **Search chats** → filters Recents; Esc closes.
- **Documents** → collapsed by default; rows open each PDF from `public/docs/`.
- **Recents** → "…" menu per chat (Rename, Delete with confirm); last 20 chats in `localStorage` (`gabay:chats`), saved when each answer finishes;
  try/catch so private mode still works (just unsaved). No accounts, no server storage.
- **Intentionally omitted:** Agents, Projects, Search, **Admin panel / upload**. A public, no-auth
  upload would let anyone poison the index. Add docs via `public/docs/` + `scripts/seed.ts` + `npm run seed`.

## Reliability notes

- **Upstash free tier: 10k writes/day.** One seed is about 1,300 writes. On 2026-10-11 repeated
  re-seeds hit the cap and a reset-first seed left the index empty; the seed now writes in place
  and prunes leftovers, and writes `lib/rag/chunks.json` first.
- **Hybrid retrieval.** `retrieve()` fuses Upstash dense results with BM25 over `chunks.json`
  (reciprocal rank fusion), optionally boosting one `agency`. If the vector side is empty or fails,
  keyword results alone keep answers grounded. Logged as `vector search empty`.
- **Groq free tier: 200k tokens/day for gpt-oss-120b** (about 10-15 answers). On 429 the provider
  retries on gpt-oss-20b, which is noticeably less faithful. Dev Tier removes the limit.
- **Tool loop.** `searchKnowledgeBase` allows two searches, then returns "answer now"; `MAX_STEPS`
  is 4. `toolChoice: "none"` and `activeTools: []` both fail on Groq for gpt-oss.

## Secrets / env

Three server-only vars, set in `.env.local` (local, gitignored) **and** Vercel Production:
`GROQ_API_KEY`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`.
⚠️ The Groq key was pasted in a prior chat — **rotate it** at console.groq.com.

## Corpus / index state (already seeded)

Upstash index holds **1,305 chunks**: DOLE 203 · PhilHealth 35 · Pag-IBIG 15 · **SSS 1052** (structure-aware; ligature-fixed 2026-10-11 — SSS text used to read "bene fi t").
Re-seed only if PDFs change: `npm run seed` (reads `.env.local`; resets the index first).

## Verify commands

```bash
cd ~/Developer/jacobvillar/gabay
npm run typecheck && npm test && npm run build     # all must pass (build works with NO env)
# Production smoke test (streaming + tool call + no error):
curl -s -N https://gabay-fint.vercel.app/api/chat -H 'content-type: application/json' \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"How is 13th month pay computed?"}]}]}'
```
Expect `data:` events including `tool-output-available` and streamed `text-delta`, no `error`.

## Requirements checklist
- [ ] Deployed publicly on Vercel (gabay-fint.vercel.app reachable in incognito)
- [ ] Streams answers via Vercel AI SDK
- [ ] RAG implemented as a **tool call** (not always-prepended)
- [ ] Sources visible + readable under answers
- [ ] Non-trivial, well-chosen corpus
- [ ] Repo has README + correct setup info
- [ ] Reflection specific + honest (`deliverables/reflection.pdf`, 1 page)
- [ ] Secrets not in client bundle (keys server-only; `next build` passes with no env)
- [ ] Meaningful empty state

Weekly outcomes: corpus→KB · chunking/metadata/embedding decisions · Next.js+AI SDK streaming ·
retrieval as tool call · public Vercel deploy w/ correct env · honest reflection.

Submission accepts a URL **or** a pdf/zip upload. Mapping lives in `deliverables/submission.md`.

## Known caveats (not bugs — document, don't over-fix)

- **SSS skew:** SSS charter is ~80% of chunks; can bias retrieval. `topK` is 8 to help recall.
  Deeper fix (per-agency boost / rerank) is a documented "next week" item, out of scope for shipping.
- **Citation tokens:** `gpt-oss` emits `【n†…】` markers; `components/Message.tsx` strips them and
  renders Markdown (sources show in the panel). Don't re-introduce raw LaTeX/markers.
- **Model name:** `openai/gpt-oss-120b` is an *open-weight* model on Groq (not the OpenAI API).
  `llama-3.3-70b-versatile` was retired — don't revert to it.

## Cost note

The prior session ran long on paid browser automation. Prefer **`curl` + code inspection** over
browser-driving for verification. Only open a browser for the incognito live-URL check, and do it
once.
