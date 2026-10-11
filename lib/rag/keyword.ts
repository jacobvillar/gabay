/**
 * Keyword (BM25) search over the local chunk copy written by `npm run seed`.
 * Runs on every search and is fused with dense results (lib/rag/retrieval.ts); if the vector
 * index is empty, unreachable, or over quota, it alone keeps the app answering.
 */
import chunks from "./chunks.json";
import type { ChunkMetadata } from "./ingestion";

const docs = chunks as ChunkMetadata[];
const tokenize = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

// Built once per server instance (~1.3k chunks, a few ms).
let _stats: { tf: Map<string, number>[]; len: number[]; df: Map<string, number>; avg: number } | null = null;
function stats() {
  if (_stats) return _stats;
  const df = new Map<string, number>();
  const tf = docs.map((d) => {
    const m = new Map<string, number>();
    for (const t of tokenize(d.text)) m.set(t, (m.get(t) ?? 0) + 1);
    for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return m;
  });
  const len = tf.map((m) => [...m.values()].reduce((a, b) => a + b, 0));
  _stats = { tf, len, df, avg: len.reduce((a, b) => a + b, 0) / Math.max(len.length, 1) };
  return _stats;
}

/** Top-k chunks by BM25 (k1 = 1.2, b = 0.75), optionally limited to one agency. [] when nothing matches. */
export function keywordSearch(
  query: string,
  topK: number,
  agency?: string,
): Array<ChunkMetadata & { score: number }> {
  const { tf, len, df, avg } = stats();
  const terms = [...new Set(tokenize(query))];
  const N = docs.length;
  return docs
    .map((d, i) => {
      if (agency && d.agency !== agency) return { ...d, score: 0 };
      let score = 0;
      for (const t of terms) {
        const f = tf[i].get(t);
        if (!f) continue;
        const n = df.get(t) ?? 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        score += idf * ((f * 2.2) / (f + 1.2 * (1 - 0.75 + (0.75 * len[i]) / avg)));
      }
      return { ...d, score };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
