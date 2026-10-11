/**
 * Hybrid retrieval: dense search in Upstash (which embeds the query server-side) plus BM25 keyword
 * search over the local chunk copy, fused with reciprocal rank fusion. Either side can be empty
 * (index being re-seeded, quota hit) and the other still answers.
 */
import { Index } from "@upstash/vector";
import { config } from "@/lib/config";
import type { ChunkMetadata } from "@/lib/rag/ingestion";
import { keywordSearch } from "@/lib/rag/keyword";
import { logger } from "@/lib/observability/logger";

export type Source = {
  id: number;
  score: number;
  text: string;
  document_title: string;
  agency: string;
  page: number;
  source_url: string;
};

let _index: Index | null = null;
function index() {
  if (!_index) {
    _index = new Index({ url: config.upstashUrl(), token: config.upstashToken() });
  }
  return _index;
}

/**
 * Reciprocal rank fusion: score = Σ 1 / (k + rank) across lists. Rank-based, so dense cosine
 * scores and BM25 scores never need to be on the same scale. k = 60 is the standard constant.
 */
export function fuseRanked(lists: ChunkMetadata[][], topK: number, k = 60): Array<ChunkMetadata & { score: number }> {
  const fused = new Map<string, ChunkMetadata & { score: number }>();
  for (const list of lists) {
    list.forEach((d, rank) => {
      const key = `${d.document_title}|${d.page}|${d.text.slice(0, 80)}`;
      const hit = fused.get(key) ?? { ...d, score: 0 };
      hit.score += 1 / (k + rank + 1);
      fused.set(key, hit);
    });
  }
  return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, topK);
}

async function denseSearch(query: string, topK: number, agency?: string): Promise<ChunkMetadata[]> {
  try {
    const results = await index().query({
      data: query, // raw text; the index's embedding model vectorizes it server-side
      topK,
      includeMetadata: true,
      ...(agency ? { filter: `agency = '${agency}'` } : {}),
    });
    return results.map((r) => r.metadata as ChunkMetadata).filter((m) => m?.text);
  } catch (e) {
    logger.warn("vector search failed", { error: (e as Error).message });
    return [];
  }
}

/**
 * `agency` (optional) BOOSTS one handbook, it never excludes the others: scoped and unscoped
 * searches are fused together, so scoped hits rank higher (they appear in more lists) but a wrong
 * agency guess by the model can't hide the right answer (seen live: SIL scoped to SSS).
 */
export async function retrieve(query: string, topK = config.topK, agency?: string): Promise<Source[]> {
  const searches: Promise<ChunkMetadata[]>[] = [
    denseSearch(query, topK),
    Promise.resolve(keywordSearch(query, topK)),
  ];
  if (agency) {
    searches.push(denseSearch(query, topK, agency), Promise.resolve(keywordSearch(query, topK, agency)));
  }
  const lists = await Promise.all(searches);
  if (lists[0].length === 0) logger.warn("vector search empty; keyword results only", { agency });

  return fuseRanked(lists, topK).map((m, i) => ({
    id: i + 1,
    score: m.score,
    text: m.text ?? "",
    document_title: m.document_title ?? "Unknown document",
    agency: m.agency ?? "",
    page: m.page ?? 0,
    source_url: m.source_url ?? "",
  }));
}
