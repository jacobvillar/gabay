---
type: Reflection
title: "Gabay: Shipping a Public RAG Product"
timestamp: 2026-10-11
tags: [rag, nextjs, vercel-ai-sdk, groq, upstash, hybrid-retrieval, evals, philippines, worker-benefits]
description: "Reflection on building and testing Gabay, a public RAG assistant over Philippine statutory worker-benefit handbooks."
live: https://gabay-fint.vercel.app
repo: https://github.com/jacobvillar/gabay
---

# Gabay: Shipping a Public RAG Product

*Gabay sa bawat tanong. Cited answers on Philippine worker benefits, from official handbooks.*

## 1. Overview

Gabay answers questions about **Philippine statutory worker benefits** (13th-month pay, leave, SSS, PhilHealth, Pag-IBIG) strictly from official government handbooks, and shows the exact source pages under every answer. It runs on **Next.js + the Vercel AI SDK** with retrieval exposed as a tool call, **Groq** (open-weight GPT-OSS 120B) for generation, and **Upstash Vector** for dense search, deployed publicly on Vercel.

## 2. Key decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Corpus | DOLE handbook, SSS Citizens Charter, PhilHealth Konsulta circular, Pag-IBIG briefer (1,305 chunks) | Public-domain government works, legal to serve; base models get these figures subtly wrong, so citations add real value |
| Chunking | Per-page extraction with PDF ligature repair, then sentence/paragraph-aware packing to ~1,000 chars, 150 overlap | Real **page numbers** for citations; boundaries fall on sentence ends so rules stay intact |
| Metadata | `document_title`, `agency`, `page`, `source_url` | Citations open the PDF at the cited page; `agency` also drives retrieval |
| Retrieval | Hybrid: dense + BM25 keyword, reciprocal rank fusion, optional per-agency boost; topK 8 | Keyword catches exact terms dense misses; the boost counters the SSS-heavy corpus without hiding other handbooks |
| Generation | Groq GPT-OSS 120B; falls back to 20B on rate limits; two-search budget per question | Free tier with tool calling; the budget guarantees every reply ends in a written answer |
| Guardrails | Figures must appear in retrieved passages; decline off-topic; request validation; UI strips leaked LaTeX/HTML | A wrong peso figure is worse than no answer; the prompt alone proved insufficient |
| Interface | Onyx-style sidebar: New chat, Search, Documents, Recents with Rename/Delete (browser-local) | No accounts or server storage; deliberately no admin upload, which would let anyone poison a public index |

## 3. What it does well

Grounded, cited answers on PH-specific rules. "How is 13th-month pay computed?" triggers retrieval, answers from the DOLE handbook (1/12 of basic salary, with the correct exclusions), and each source chip opens the PDF at that page. When a figure is not in the handbooks, it says so instead of inventing one.

## 4. What it does badly

Retrieval balance: the SSS charter is 80% of the index and mostly procedure, so unscoped searches still lean SSS. The free tiers are the other weak spot: about 10–15 full answers a day before the smaller fallback model takes over, and it is noticeably less faithful.

## 5. The trickiest decision

Making retrieval **trustworthy on high-stakes questions**. Retrieval had to be a deliberate tool call rather than always-prepended context, with a tool description that makes the model reach for the handbooks on benefit questions but skip small talk, and a strict system prompt: answer only from retrieved passages and say plainly when they do not cover something. Balancing faithfulness against helpfulness was the hardest part, and it surfaced again in the agency boost: a hard filter looked cleaner but let one wrong model guess hide the right handbook.

## 6. How I tested it

An end-to-end eval of 10 questions against production (all four agencies, Taglish, and an off-topic probe), reading every answer. It caught real defects: replies that ended empty because the model kept searching, PDF text broken 2,316 times ("bene fi t"), figures taken from model memory, an off-topic question answered, raw HTML and LaTeX in answers, an unanswerable suggested question, and a filter that hid the right handbook. Each fix was re-run against the same questions, and the seed now verifies itself with a known-answer probe (13th-month pay must return DOLE pp. 50–54).

## 7. What I'd do with another week

1. **Automate the eval:** golden set, faithfulness and context-relevance scorers, an LLM judge calibrated on hand labels, run in CI on every prompt or retrieval change.
2. **Cross-encoder reranking** over the fused dense + keyword results.
3. **Exact-match response cache** for first-turn questions, keyed by normalized question + corpus and prompt version so a re-seed invalidates it. No semantic cache.
4. **Rebalance the corpus** by trimming the SSS charter to its benefit sections.
5. **Inline citations:** real [1]/[2] markers tied to the sources panel.

## 8. References

- Live app: <https://gabay-fint.vercel.app> · Repository: <https://github.com/jacobvillar/gabay>
- Interface design language inspired by [Onyx](https://github.com/onyx-dot-app/onyx).
