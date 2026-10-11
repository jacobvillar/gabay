# Gabay

**A RAG assistant for Philippine statutory worker benefits — DOLE, SSS, PhilHealth, and Pag-IBIG —
with streaming answers and cited sources.**

> Week 14.3 "Ship Your Own RAG" mini-project. Built with Next.js + Vercel AI SDK + Upstash Vector.

## Overview

Gabay answers questions about Filipino workers' statutory benefits (13th-month pay, leave,
contributions, loans, claims) **only** from official government handbooks, and shows the passages
it used. The base LLM is weak and often wrong on PH-specific figures — retrieval with citations is
what makes the answers trustworthy.

```text
  CORPUS (data/)          INDEX (Upstash)          CHAT (Next.js / Vercel)
 ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────────┐
 │ DOLE / SSS /     │ ▶ │ per-page chunks  │ ▶ │ streaming chat; the model │
 │ PhilHealth /     │   │ + Upstash embeds │   │ calls searchKnowledgeBase │
 │ Pag-IBIG  PDFs   │   │ + metadata       │   │ then answers w/ sources   │
 └──────────────────┘   └──────────────────┘   └──────────────────────────┘
        seed.ts              retrieval.ts              app/api/chat
```

## What's Inside

| Path | What it holds |
| --- | --- |
| `app/` | Next.js App Router: the Onyx-style chat UI (`page.tsx`) and the streaming RAG API (`api/chat/route.ts`) |
| `lib/` | `config` (secrets), `ai/` (model boundary + the retrieval tool), `rag/` (chunking + retrieval), `prompts/`, `observability/` |
| `components/` | `Chat`, `Message`, `Sources`, `EmptyState` |
| `scripts/seed.ts` | Parse `data/*.pdf` per page → chunk → embed → upsert to Upstash |
| `data/` | The corpus PDFs (you add these) |
| `evals/` | Demo questions for local iteration |
| `docs/` | Architecture, ADRs, setup, security |

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the 3 keys
# drop the DOLE/SSS/PhilHealth/Pag-IBIG PDFs into data/
npm run seed                 # index the corpus
npm run dev                  # http://localhost:3000
```

See [docs/development/setup.md](docs/development/setup.md) for the full setup and Vercel deploy.

## Requirements covered

Public Vercel deploy · streaming (AI SDK) · retrieval as a **tool call** · cited sources ·
server-only secrets · meaningful empty state · real, chosen corpus.
