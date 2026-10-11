/** Retrieval — search Upstash by text; Upstash embeds the query server-side. */
import { Index } from "@upstash/vector";
import { config } from "@/lib/config";
import type { ChunkMetadata } from "@/lib/rag/ingestion";

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

export async function retrieve(query: string, topK = config.topK): Promise<Source[]> {
  // `data` = raw text; the index's built-in embedding model vectorizes it server-side.
  const results = await index().query({ data: query, topK, includeMetadata: true });

  return results.map((r, i) => {
    const m = (r.metadata ?? {}) as Partial<ChunkMetadata>;
    return {
      id: i + 1,
      score: r.score,
      text: m.text ?? "",
      document_title: m.document_title ?? "Unknown document",
      agency: m.agency ?? "",
      page: m.page ?? 0,
      source_url: m.source_url ?? "",
    };
  });
}
