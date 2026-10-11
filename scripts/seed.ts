/**
 * Seed the corpus: PDFs in public/docs/ → per-page text → chunks → lib/rag/chunks.json (keyword
 * search) → Upstash Vector (dense search; Upstash embeds the raw text with the index's model).
 * Extraction and chunking live in lib/rag/ingestion.ts; this file is only the I/O.
 *
 * Run: npm run seed              (reads .env.local)
 *      npm run seed -- --dry-run (extract + write chunks.json only; no Upstash writes)
 */
import fs from "node:fs";
import path from "node:path";
import { Index } from "@upstash/vector";
import { config } from "@/lib/config";
import { chunkText, extractPages, metaFor, type ChunkMetadata } from "@/lib/rag/ingestion";

// Load .env.local for the script (Next.js does this for the app, not for tsx).
try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  // ponytail: fall back to ambient env (e.g. CI secrets) if no .env.local.
}

const DATA_DIR = path.join(process.cwd(), "public", "docs");
const CHUNKS_FILE = path.join(process.cwd(), "lib", "rag", "chunks.json");
const DRY_RUN = process.argv.includes("--dry-run");
const BATCH = 100;

// Known-answer probe run after every seed: if this fails, the index is not fit to serve.
const PROBE = { query: "How is 13th-month pay computed?", agency: "DOLE", pages: [50, 54] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= attempts) throw e;
      console.warn(`  ${label} failed (${(e as Error).message}); retry ${i}/${attempts - 1}`);
      await sleep(1000 * 2 ** i);
    }
  }
}

async function buildRecords(): Promise<ChunkMetadata[]> {
  // Sorted so chunk ids (1..N) are stable across machines and runs.
  const files = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter((f) => f.toLowerCase().endsWith(".pdf")).sort()
    : [];
  if (files.length === 0) throw new Error("No PDFs in public/docs/. Add the corpus PDFs first.");

  const records: ChunkMetadata[] = [];
  for (const file of files) {
    const meta = metaFor(file);
    const pages = await extractPages(new Uint8Array(fs.readFileSync(path.join(DATA_DIR, file))));
    const empty = pages.filter((t) => !t.trim()).length;
    const before = records.length;
    pages.forEach((text, i) => {
      for (const c of chunkText(text)) records.push({ text: c, page: i + 1, ...meta });
    });
    const warn = empty ? `  ⚠ ${empty} page(s) with no text (scanned?)` : "";
    console.log(`  ${file} -> ${records.length - before} chunks (${pages.length} pages) [${meta.agency || "no agency"}]${warn}`);
  }
  return records;
}

async function upsert(index: Index, records: ChunkMetadata[]) {
  // Overwrite ids 1..N in place, then delete leftovers. Never reset first: a failed run would
  // otherwise leave the live index empty (happened once on the free tier's write cap).
  const before = (await index.info()).vectorCount;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH).map((r, j) => ({ id: i + j + 1, data: r.text, metadata: r }));
    await withRetry(`batch ${i / BATCH + 1}`, () => index.upsert(batch));
  }
  if (before > records.length) {
    const stale = Array.from({ length: before - records.length }, (_, i) => records.length + 1 + i);
    for (let i = 0; i < stale.length; i += 1000) {
      await withRetry("prune", () => index.delete(stale.slice(i, i + 1000)));
    }
  }
}

async function verify(index: Index, expected: number) {
  // Upstash embeds asynchronously; wait until nothing is pending before trusting counts/queries.
  for (let i = 0; i < 30; i++) {
    const info = await index.info();
    if (info.pendingVectorCount === 0) {
      if (info.vectorCount !== expected) throw new Error(`index holds ${info.vectorCount} vectors, expected ${expected}`);
      break;
    }
    await sleep(2000);
  }
  const hits = await index.query({
    data: PROBE.query, topK: 4, includeMetadata: true, filter: `agency = '${PROBE.agency}'`,
  });
  const pages = hits.map((h) => (h.metadata as ChunkMetadata | undefined)?.page ?? 0);
  const ok = pages.length > 0 && pages.every((p) => p >= PROBE.pages[0] && p <= PROBE.pages[1]);
  if (!ok) throw new Error(`probe "${PROBE.query}" returned pages [${pages}], expected ${PROBE.pages.join("-")}`);
  console.log(`  verified: ${expected} vectors; probe → ${PROBE.agency} pages [${pages}]`);
}

async function main() {
  const records = await buildRecords();

  // Written before any network call, so keyword search works even if the upsert fails.
  fs.writeFileSync(CHUNKS_FILE, JSON.stringify(records));
  console.log(`  wrote ${path.relative(process.cwd(), CHUNKS_FILE)} (${records.length} chunks)`);
  if (DRY_RUN) return console.log("Dry run: Upstash not touched.");

  const index = new Index({ url: config.upstashUrl(), token: config.upstashToken() });
  await upsert(index, records);
  await verify(index, records.length);
  console.log(`Done. Upserted ${records.length} chunks.`);
}

main().catch((e) => {
  console.error(`Seed failed: ${(e as Error).message}`);
  process.exit(1);
});
