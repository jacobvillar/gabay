/** Chunking — shared by the seed script. Kept tiny and testable. */

// Product decisions, not defaults. Tune these if retrieval looks wrong.
export const CHUNK_SIZE = 1000; // chars
export const CHUNK_OVERLAP = 150; // chars

/**
 * Split text into overlapping fixed-size chunks.
 * ponytail: char-based windowing, not token-aware. Good enough for prose PDFs;
 * switch to a token splitter if chunks straddle sentences badly.
 */
export function chunkText(
  text: string,
  size = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP,
): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];

  const step = Math.max(1, size - overlap);
  const chunks: string[] = [];
  for (let start = 0; start < clean.length; start += step) {
    chunks.push(clean.slice(start, start + size));
    if (start + size >= clean.length) break;
  }
  return chunks;
}

export type ChunkMetadata = {
  text: string;
  document_title: string;
  agency: string;
  page: number;
  source_url: string;
};
