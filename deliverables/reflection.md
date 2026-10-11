---
type: Reflection
title: "Gabay: Shipping a Public RAG Product"
timestamp: 2026-10-11
tags: [rag, nextjs, vercel-ai-sdk, groq, upstash, hybrid-retrieval, philippines, worker-benefits]
description: "Reflection on building and testing Gabay, a public RAG assistant over Philippine statutory worker-benefit handbooks."
live: https://gabay-fint.vercel.app
repo: https://github.com/jacobvillar/gabay
---

# Gabay: Shipping a Public RAG Product

*Gabay sa bawat tanong. Cited answers on Philippine worker benefits, from official handbooks.*

## 1. Overview

Gabay answers questions about **Philippine statutory worker benefits** (13th-month pay, leave, SSS, PhilHealth, Pag-IBIG) only from official government handbooks, and every answer links to the exact page it came from. Built with **Next.js and the Vercel AI SDK**, retrieval as a **tool call**, **Groq** GPT-OSS 120B, and **Upstash Vector**.

## 2. Key decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Corpus | Four official handbooks: DOLE, SSS, PhilHealth, Pag-IBIG (1,305 chunks) | Public documents I can serve and link to, in exactly the domain where general chatbots get figures subtly wrong |
| Chunking | Per page, packed on sentence boundaries to ~1,000 chars with 150 overlap; PDF ligature repair | Citations carry real page numbers, and no rule is cut mid-sentence |
| Metadata | `document_title`, `agency`, `page`, `source_url` | Every citation opens the PDF at its page; `agency` steers retrieval |
| Retrieval | Hybrid dense + BM25 keyword, reciprocal rank fusion, optional agency boost, top 8 | Keyword search catches exact terms that embeddings blur; the boost favors one handbook without hiding the others |
| Generation | GPT-OSS 120B on Groq, 20B fallback; at most two searches per question | Free tool calling; the cap forces a written answer instead of endless searching |
| Guardrails | Every figure must appear in a retrieved passage; off-topic questions declined | A wrong peso amount is worse than "the handbook doesn't say" |
| Interface | No accounts and no upload; chats stay in the visitor's browser | An open upload would let anyone poison a public index |

## 3. What it does well

It answers a benefit question with the rule, the computation, and a page citation the user can open. "How is 13th-month pay computed?" returns total basic salary ÷ 12, with the handbook's exclusions, cited to DOLE pp. 50–54. When the handbooks are silent, it says so instead of guessing a figure.

## 4. What it does badly

**The corpus is lopsided.** The SSS charter is 1,052 of the 1,305 chunks and mostly procedure, so a question that doesn't name an agency surfaces SSS passages first. The agency boost softens this; trimming the charter to its benefit sections is the real fix.

**Quality drops silently under load.** Groq's free tier covers roughly 10–15 full answers a day. After that the smaller 20B model answers, it is less faithful, and the user cannot tell which model they got.

## 5. The trickiest decision

How far to trust the model. Making retrieval a tool lets the model skip it for small talk, but also lets it skip or misdirect a search when it shouldn't. So the prompt is strict (benefit questions must search, answers come only from passages, say what is missing) and retrieval forgives the model's mistakes. When the model guessed the wrong agency for a service-incentive-leave question, a hard filter hid the DOLE answer entirely; the agency became a boost instead.

## 6. How I tested it

I ran 10 questions against production, covering all four agencies, Taglish, and an off-topic probe, and read every answer. That surfaced failures only visible end to end: answers that ended empty because the model kept searching, PDF text broken 2,316 times ("bene fi t"), figures from the model's memory, an off-topic question answered, and the agency filter above. A code review before submission found one more that every fresh-chat test missed: in a multi-turn chat, follow-up questions could not search at all, because the search cap counted the whole conversation. Each fix was re-run on the same questions, and the seed verifies itself with a known-answer probe.

## 7. What I'd do with another week

1. **Automated evals:** turn the 10 questions, plus multi-turn cases, into a scored golden set (faithfulness, context relevance) that runs on every prompt or retrieval change.
2. **Rebalance the corpus:** trim the SSS charter to its benefit sections.
3. **Reranking:** a cross-encoder over the fused results.
4. **Cache the suggested questions:** exact-match only, cleared on re-seed, to stretch the scarce daily quota.
5. **Inline citations:** [1]/[2] markers tied to the sources panel.

## 8. References

- Live app: <https://gabay-fint.vercel.app> · Repository: <https://github.com/jacobvillar/gabay>
- Corpus: DOLE, SSS, PhilHealth and Pag-IBIG official handbooks.
