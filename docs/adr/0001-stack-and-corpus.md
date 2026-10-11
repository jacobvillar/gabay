# ADR 0001 — Stack and corpus

## Status
Accepted. *Amended:* chat model switched to `openai/gpt-oss-120b` on Groq after Llama 3.3 70B was retired.

## Decision
- **Stack:** Next.js (App Router) + Vercel AI SDK v5 for streaming + tool-call chat; **Groq**
  (open-weight GPT-OSS 120B) as the chat model; **Upstash Vector** with its built-in
  `text-embedding-3-small` model for retrieval. No OpenAI key and no paid API.
- **Corpus:** public PH government worker-benefit handbooks (DOLE/SSS/PhilHealth/Pag-IBIG).
- **Chunking:** per-page extraction, then sentence/paragraph-aware packing to ~1000 chars with 150 overlap (boundaries fall on sentence ends).

## Why
- PH government works are not copyrighted → safe to serve publicly (unlike commercial ebooks).
- The domain is high-value and the base model is unreliable on it → retrieval earns its keep.
- Per-page extraction gives real page numbers for citations (the brief's minimum metadata).
- Groq + Upstash embeddings = free tiers, no credit card, still deploys publicly on Vercel.

## Trade-offs
- Open-weight (GPT-OSS) tool-calling is slightly less reliable than frontier models; acceptable for a POC,
  and the tool description is written to steer it. Swap `config.chatModel` to change models.
- Chunking is sentence/paragraph-aware, so passages stay coherent; a heading/token-aware splitter could further help dense tables.
- Multiple agencies in one index can blur retrieval; `agency` metadata now drives a per-agency
  boost (a boost, not a filter, so a wrong guess can't hide the right handbook).
