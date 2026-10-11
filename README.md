# Gabay

**A public RAG assistant for Philippine statutory worker benefits — DOLE, SSS, PhilHealth, and
Pag-IBIG — with streaming answers and cited sources.**

[![CI](https://github.com/jacobvillar/gabay/actions/workflows/ci.yml/badge.svg)](https://github.com/jacobvillar/gabay/actions/workflows/ci.yml)
[![Live](https://img.shields.io/badge/live-gabay-fint.vercel.app-111)](https://gabay-fint.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-v5-black)](https://sdk.vercel.ai)

> Week 14.3 "Ship Your Own RAG" graded mini-project — turning a workshop RAG bot into a public,
> domain-specific product. **Live:** [gabay-fint.vercel.app](https://gabay-fint.vercel.app)

## Overview

Filipino workers have specific, high-stakes questions about statutory benefits — 13th-month pay,
leave, SSS/PhilHealth/Pag-IBIG contributions and claims. General chatbots get the figures subtly
wrong and cite nothing. **Gabay answers only from official government handbooks and shows the exact
source passages**, so retrieval with citations visibly beats a raw LLM.

```text
  CORPUS (data/)          INDEX (Upstash Vector)        CHAT (Next.js / Vercel)
 ┌──────────────────┐   ┌──────────────────────┐   ┌──────────────────────────────┐
 │ DOLE · SSS ·     │ ▶ │ per-page chunks,     │ ▶ │ streaming chat; the model     │
 │ PhilHealth ·     │   │ embedded server-side │   │ calls searchKnowledgeBase,    │
 │ Pag-IBIG  PDFs   │   │ + {doc,agency,page}  │   │ then answers with its sources │
 └──────────────────┘   └──────────────────────┘   └──────────────────────────────┘
      scripts/seed.ts        lib/rag/retrieval.ts         app/api/chat/route.ts
```

Retrieval is a **tool call** (`searchKnowledgeBase`), not context prepended to every turn — the
model reaches for the handbooks only when a benefit question warrants it, and every factual answer
renders the documents and pages it used.

## What's Inside

| Path | What it holds |
| --- | --- |
| [`app/`](app) | Next.js App Router — the chat UI (`page.tsx`) and the streaming RAG API (`api/chat/route.ts`) |
| [`lib/`](lib) | `config` (secrets), `ai/` (model boundary + retrieval tool), `rag/` (chunking + retrieval), `prompts/`, `observability/` |
| [`components/`](components) | `Chat`, `Message`, `Sources`, `EmptyState`, `Logo` |
| [`scripts/seed.ts`](scripts/seed.ts) | Parse `data/*.pdf` per page → chunk → upsert to Upstash (which embeds server-side) |
| [`data/`](data) | The corpus PDFs (DOLE / SSS / PhilHealth / Pag-IBIG) |
| [`evals/`](evals) | Demo questions for local iteration |
| [`docs/`](docs/index.md) | Architecture, ADRs, setup, and security notes |
| [`deliverables/`](deliverables) | Reflection (md + 1-page PDF), submission map, demo questions |

## Quick start

```bash
npm install
cp .env.example .env.local          # fill in the 3 keys (see below)
# add the DOLE/SSS/PhilHealth/Pag-IBIG PDFs to data/
npm run seed                        # index the corpus (prints chunk counts)
npm run dev                         # http://localhost:3000
```

**Environment** (server-only — never shipped to the client):

| Variable | Where |
| --- | --- |
| `GROQ_API_KEY` | Free key from [console.groq.com](https://console.groq.com) (chat) |
| `UPSTASH_VECTOR_REST_URL` | [Upstash Vector](https://console.upstash.com) index, created **with a built-in embedding model** |
| `UPSTASH_VECTOR_REST_TOKEN` | Same index (read-write token) |

Full walkthrough: [`docs/development/setup.md`](docs/development/setup.md).

## Deploy (Vercel)

Push to GitHub → import the repo in Vercel → add the three env vars → deploy. The app is already
live at [gabay-fint.vercel.app](https://gabay-fint.vercel.app). See
[`docs/development/setup.md`](docs/development/setup.md) for details.

## Tech stack

Next.js 15 (App Router) · Vercel AI SDK v5 (streaming + tool calling) · **Groq** open-weight
GPT-OSS 120B · **Upstash Vector** (built-in embeddings) · TypeScript · Tailwind CSS v4.
No OpenAI key required.

## Verify

```bash
npm run typecheck && npm test && npm run build   # build passes with no env set — secrets are runtime-only
```

## Requirements covered

Public Vercel deploy · streaming (AI SDK) · retrieval as a **tool call** · cited sources ·
server-only secrets · meaningful empty state · a real, chosen corpus. See
[`deliverables/submission.md`](deliverables/submission.md) for the full criteria map.
