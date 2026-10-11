# HANDOFF — Gabay (Week 14.3 "Ship Your Own RAG")

> For a fresh session with no prior context. Read this first, then execute the **Goal** below.

## Goal for this session

1. Run **`/agent-skills:review`** on the repo (code quality / correctness / security).
2. Apply any warranted fixes (use **`/agent-skills:build`** for planned fixes if needed).
3. Run **`/agent-skills:ship`** (pre-launch checklist).
4. **Full rubric audit** — verify *every* grading criterion below is met, fix gaps, and report a
   pass/fail table. Do not assume; verify with commands + the live URL.

Keep changes minimal and correct (ponytail mode). This is a finished, deployed project — the job is
to verify and harden for a 100/100, not to rebuild.

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
| UI | `app/page.tsx`, `components/{Chat,Message,Sources,EmptyState,Logo}.tsx` |
| Corpus (PDFs) | `data/*.pdf` |
| Docs | `docs/`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, `PRODUCT.md` |
| Deliverables | `deliverables/` (reflection md+pdf, submission.md, demo-questions.md, zip) |

## Secrets / env

Three server-only vars, set in `.env.local` (local, gitignored) **and** Vercel Production:
`GROQ_API_KEY`, `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`.
⚠️ The Groq key was pasted in a prior chat — **rotate it** at console.groq.com after grading.

## Corpus / index state (already seeded)

Upstash index holds **1,313 chunks**: DOLE 203 · PhilHealth 35 · Pag-IBIG 15 · **SSS 1060** (structure-aware).
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

## Rubric to audit (target: 100/100)

Final checklist — verify each:
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
  Deeper fix (per-agency filter / rerank) is a documented "next week" item, out of scope for shipping.
- **Citation tokens:** `gpt-oss` emits `【n†…】` markers; `components/Message.tsx` strips them and
  renders Markdown (sources show in the panel). Don't re-introduce raw LaTeX/markers.
- **Model name:** `openai/gpt-oss-120b` is an *open-weight* model on Groq (not the OpenAI API).
  `llama-3.3-70b-versatile` was retired — don't revert to it.

## Cost note

The prior session ran long on paid browser automation. Prefer **`curl` + code inspection** over
browser-driving for verification. Only open a browser for the incognito live-URL check, and do it
once.
