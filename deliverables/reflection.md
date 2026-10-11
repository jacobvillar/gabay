---
type: Reflection
title: "Gabay — Shipping a Public RAG Product"
timestamp: 2026-10-11
tags: [rag, nextjs, vercel-ai-sdk, groq, upstash, retrieval, philippines, worker-benefits]
description: "One-page reflection on building and deploying Gabay, a public RAG assistant over Philippine statutory worker-benefit handbooks."
live: https://gabay-fint.vercel.app
repo: https://github.com/jacobvillar/gabay
---

# Gabay — Shipping a Public RAG Product

## Overview

Gabay is a public, domain-specific RAG assistant that answers questions about **Philippine
statutory worker benefits** — 13th-month pay, leave, SSS, PhilHealth, and Pag-IBIG — strictly from
official government handbooks, with the source passages shown under every answer. It is built with
**Next.js + the Vercel AI SDK** (streaming chat, retrieval exposed as a tool call), **Groq**
(open-weight GPT-OSS 120B) for generation, and **Upstash Vector** (built-in embedding model) for
retrieval. It runs publicly on Vercel at [gabay-fint.vercel.app](https://gabay-fint.vercel.app).

## Corpus and why

| Decision | Choice | Why |
| --- | --- | --- |
| Corpus | DOLE Handbook, SSS Citizens Charter, PhilHealth Konsulta circular, Pag-IBIG briefer | Public-domain PH government works — legal to serve publicly; a high-value domain where base LLMs are unreliable, so retrieval + citations visibly add value |
| Generation | Groq, open-weight GPT-OSS 120B | Free tier, no OpenAI key, supports tool calling, deploys on Vercel |
| Embeddings | Upstash built-in model (text in, vectors server-side) | Removes the embedding API key entirely; one fewer secret |
| Chunking | Per-page extraction (PDF ligature repair) → sentence/paragraph-aware packing to ~1000 chars, 150 overlap | Per-page parsing preserves real **page numbers**; sentence-aware packing keeps rules intact |
| Metadata | `document_title`, `agency`, `page`, `source_url` | Makes citations readable and disambiguates across four agencies |
| Retrieval | Hybrid: dense + BM25 keyword, reciprocal rank fusion, optional per-agency filter; fallback chat model; two-search cap | Keyword catches exact terms dense misses; the agency filter counters the SSS skew; free-tier limits (10k writes, 200k tokens/day) degrade answers instead of breaking them |
| Interface | Onyx-style sidebar: New chat, collapsible Documents, Recents saved in the browser (localStorage) | No accounts or server storage — history stays on the visitor's device. Deliberately no admin upload: on a public app it would let anyone poison the index; new docs go through `npm run seed` |

## The trickiest decision

Making retrieval **trustworthy on high-stakes questions**. A wrong peso figure or rule is worse than no answer, so retrieval had to be a deliberate **tool call** (not always-prepended context), with a tool description tuned so the model reaches for it on benefit questions but skips small talk, and a system prompt kept strict: answer only from retrieved passages, and say plainly when the handbooks do not cover something. Balancing that faithfulness against still being genuinely helpful was the hardest part to get right.

## What it does well

Grounded, cited answers on PH-specific rules. "How is 13th-month pay computed?" triggers the
retrieval tool, answers from the DOLE handbook (1/12 of basic salary, with the correct exclusions),
and renders the exact source pages — something a raw model gets subtly wrong with no citations.

## What it does badly

Retrieval balance. Because the SSS charter dominates the index, some non-SSS queries can surface less-relevant SSS passages; structure-aware chunking keeps each passage coherent, and the per-agency filter helps when the model uses it, but unscoped searches still lean SSS. These are quality, not correctness, issues — but they are real. The free tiers are the other weak spot: about 10-15 full answers a day before the smaller fallback model takes over, and it is noticeably less faithful.

## What I'd do with another week

1. **Rebalance the corpus** — trim the SSS charter to its benefits sections (the per-agency filter is in place).
2. **Cross-encoder reranking** — rerank the fused dense + keyword results before they reach the model.
3. **Eval harness** — score faithfulness and context-relevance on the demo-question set.
4. **Inline citation mapping** — true `[1]`/`[2]` markers tied to the sources panel.

## References

- Live app: <https://gabay-fint.vercel.app> · Repository: <https://github.com/jacobvillar/gabay>
- Corpus: DOLE, SSS, PhilHealth, Pag-IBIG official handbooks
- Design language inspired by [Onyx](https://github.com/onyx-dot-app/onyx)
