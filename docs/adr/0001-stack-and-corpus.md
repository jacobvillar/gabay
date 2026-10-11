# ADR 0001 — Stack and corpus

## Status
Accepted.

## Decision
- **Stack:** Next.js (App Router) + Vercel AI SDK v5 for streaming + tool-call chat; **Groq**
  (open-weight Llama 3.3 70B) as the chat model; **Upstash Vector** with a built-in embedding
  model for retrieval. No OpenAI / no paid API key.
- **Corpus:** public PH government worker-benefit handbooks (DOLE/SSS/PhilHealth/Pag-IBIG).
- **Chunking:** per-page extraction, then ~1000-char windows with 150-char overlap.

## Why
- PH government works are not copyrighted → safe to serve publicly (unlike commercial ebooks).
- The domain is high-value and the base model is unreliable on it → retrieval earns its keep.
- Per-page extraction gives real page numbers for citations (the brief's minimum metadata).
- Groq + Upstash embeddings = free tiers, no credit card, still deploys publicly on Vercel.

## Trade-offs
- Open-weight (GPT-OSS) tool-calling is slightly less reliable than frontier models; acceptable for a POC,
  and the tool description is written to steer it. Swap `config.chatModel` to change models.
- Char-based chunking can split sentences; fine for prose handbooks. Upgrade to a token/heading
  splitter if retrieval quality demands it.
- Multiple agencies in one index can blur retrieval; `document_title`/`agency` metadata enables
  per-agency filtering later if needed.
