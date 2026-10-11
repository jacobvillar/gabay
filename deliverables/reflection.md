---
type: Reflection
title: "Gabay — Shipping a Public RAG Product"
timestamp: 2026-10-11
tags: [rag, nextjs, vercel-ai-sdk, groq, upstash, retrieval, philippines, worker-benefits]
description: "One-page reflection on building and deploying Gabay, a public RAG assistant over Philippine statutory worker-benefit handbooks."
live: https://gabay.vercel.app
repo: https://github.com/jacobvillar/gabay
---

# Gabay — Shipping a Public RAG Product

## Overview

Gabay is a public, domain-specific RAG assistant that answers questions about **Philippine
statutory worker benefits** — 13th-month pay, leave, SSS, PhilHealth, and Pag-IBIG — strictly from
official government handbooks, with the source passages shown under every answer. It is built with
**Next.js + the Vercel AI SDK** (streaming chat, retrieval exposed as a tool call), **Groq**
(open-weight GPT-OSS 120B) for generation, and **Upstash Vector** (built-in embedding model) for
retrieval. It runs publicly on Vercel at [gabay.vercel.app](https://gabay.vercel.app).

## Corpus and why

| Decision | Choice | Why |
| --- | --- | --- |
| Corpus | DOLE Handbook, SSS Citizens Charter, PhilHealth Konsulta circular, Pag-IBIG briefer | Public-domain PH government works — legal to serve publicly; a high-value domain where base LLMs are unreliable, so retrieval + citations visibly add value |
| Generation | Groq, open-weight GPT-OSS 120B | Free tier, no OpenAI key, supports tool calling, deploys on Vercel |
| Embeddings | Upstash built-in model (text in, vectors server-side) | Removes the embedding API key entirely; one fewer secret |
| Chunking | Per-page extraction → ~1000-char windows, 150 overlap | Per-page parsing preserves real **page numbers** for citations |
| Metadata | `document_title`, `agency`, `page`, `source_url` | Makes citations readable and disambiguates across four agencies |

## The trickiest decision

Making retrieval **trustworthy on high-stakes questions**. A wrong peso figure or rule is worse than no answer, so retrieval had to be a deliberate **tool call** (not always-prepended context), with a tool description tuned so the model reaches for it on benefit questions but skips small talk, and a system prompt kept strict: answer only from retrieved passages, and say plainly when the handbooks do not cover something. Balancing that faithfulness against still being genuinely helpful was the hardest part to get right.

## What it does well

Grounded, cited answers on PH-specific rules. "How is 13th-month pay computed?" triggers the
retrieval tool, answers from the DOLE handbook (1/12 of basic salary, with the correct exclusions),
and renders the exact source pages — something a raw model gets subtly wrong with no citations.

## What it does badly

Retrieval balance and chunking. Because the SSS charter dominates the index, some non-SSS queries
can surface less-relevant SSS chunks; character-based chunking occasionally splits a rule
mid-sentence. These are quality, not correctness, issues — but they are real.

## What I'd do with another week

1. **Rebalance the corpus** — trim the SSS charter to its benefits sections or add per-agency
   retrieval filters.
2. **Hybrid retrieval + reranking** — combine dense search with keyword matching and a reranker.
3. **Eval harness** — score faithfulness and context-relevance on the demo-question set.
4. **Inline citation mapping** — true `[1]`/`[2]` markers tied to the sources panel.

## References

- Live app: <https://gabay.vercel.app> · Repository: <https://github.com/jacobvillar/gabay>
- Corpus: DOLE, SSS, PhilHealth, Pag-IBIG official handbooks
- Design language inspired by [Onyx](https://github.com/onyx-dot-app/onyx)
