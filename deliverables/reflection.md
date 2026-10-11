---
type: Reflection
title: "Gabay: Shipping a Public RAG Product"
timestamp: 2026-10-11
tags: [rag, nextjs, vercel-ai-sdk, groq, upstash-vector, hybrid-retrieval, philippines, worker-benefits]
description: "One-page reflection on Gabay, a public RAG assistant over Philippine statutory worker-benefit handbooks."
live: https://gabay-fint.vercel.app
repo: https://github.com/jacobvillar/gabay
---

# Gabay: Shipping a Public RAG Product

*Gabay sa bawat tanong. Cited answers on Philippine worker benefits, from official handbooks.*

## 1. Corpus and why

Four official Philippine government documents: the DOLE Handbook on Workers' Statutory Monetary Benefits, the SSS Citizens Charter, a PhilHealth Konsulta circular, and a Pag-IBIG programs briefer (1,305 chunks). Workers ask high-stakes questions here (13th-month pay, leave, contributions, loans), general chatbots get the figures subtly wrong, and the documents are public, so every answer can link to the exact page it came from. Pages are extracted one at a time with PDF ligature repair, packed on sentence boundaries into ~1,000-character chunks with 150 overlap, and tagged with title, agency, page and source URL. Retrieval is hybrid (dense + BM25 keyword, top 8), exposed to Groq's GPT-OSS 120B as a tool call.

## 2. The trickiest decision

How far to trust the model. Making retrieval a tool lets the model skip it for small talk, but also lets it skip or misdirect a search when it shouldn't. So the prompt is strict (benefit questions must search, every figure must come from a passage, say what is missing) and retrieval forgives the model's mistakes. When the model guessed the wrong agency for a service-incentive-leave question, a hard agency filter hid the DOLE answer entirely, so the agency became a ranking boost instead of a filter.

## 3. What it does well

It answers a benefit question with the rule, the computation, and a page citation the user can open. "How is 13th-month pay computed?" returns total basic salary ÷ 12, with the handbook's exclusions, cited to DOLE pp. 50–54. When the handbooks are silent, it says so instead of guessing a figure.

## 4. What it does badly

The corpus is lopsided. The SSS charter is 1,052 of the 1,305 chunks and mostly procedure, so questions that don't name an agency surface SSS pages first. Scoring retrieval on six benefit questions, five had a relevant passage in the top 8, four at rank 1; but the holiday-pay question ranked an SSS page above the DOLE answer, and a PhilHealth claim question found nothing useful because the circular covers Konsulta packages, not claims. The agency boost softens the ranking; the real fix is curating the corpus.

## 5. What I'd do with another week

1. **Automated evals:** turn my 10 test questions, plus multi-turn cases, into a scored golden set that runs on every prompt or retrieval change.
2. **Rebalance the corpus:** trim the SSS charter to its benefit sections and add PhilHealth's claims guide.
3. **Reranking:** a cross-encoder over the fused results.
4. **Cache the suggested questions** to stretch Groq's free daily quota (about 10–15 full answers).
