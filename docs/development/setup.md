# Setup

## 1. Install
```bash
npm install
```

## 2. Environment
Copy `.env.example` to `.env.local` and fill in:
- `GROQ_API_KEY` — free key from https://console.groq.com (open-weight gpt-oss-120b chat).
- `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN` — create an Upstash Vector index
  **with a built-in embedding model** (e.g. `mixedbread-ai/mxbai-embed-large-v1` or
  `BAAI/bge-base-en-v1.5`). Upstash embeds text server-side, so no embedding API key is needed.

## 3. Add the corpus
Drop the PDFs into `public/docs/` (e.g. `dole-handbook.pdf`, `sss-guide.pdf`, `philhealth-guide.pdf`,
`pagibig-guide.pdf`). Filenames containing `dole`/`sss`/`philhealth`/`pagibig` get the right
citation metadata automatically; edit `DOC_META` in `scripts/seed.ts` for others.

## 4. Seed the index
```bash
npm run seed   # chunks per document, writes lib/rag/chunks.json, upserts, then verifies
npm run seed -- --dry-run   # extract + chunks.json only, no Upstash writes
```

## 5. Run
```bash
npm run dev    # http://localhost:3000
```

## 6. Deploy (Vercel)
1. Push to GitHub, import the repo in Vercel.
2. Add the 3 env vars in **Project → Settings → Environment Variables** (Production).
3. Deploy, then test the live URL in an incognito window.

## Verify
```bash
npm run typecheck && npm test && npm run build
```
