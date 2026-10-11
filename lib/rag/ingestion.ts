/** Structure-aware chunking — shared by the seed script. Kept small and testable. */

// Product decisions, not defaults. Tune if retrieval looks wrong.
export const CHUNK_SIZE = 1000; // chars (target upper bound per chunk)
export const CHUNK_OVERLAP = 150; // chars of continuity carried between chunks

/** Split a block into sentences, keeping terminal punctuation. */
function splitSentences(s: string): string[] {
  const m = s.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g);
  return (m ?? [s]).map((x) => x.trim()).filter(Boolean);
}

/**
 * Chunk text along its structure: split into paragraphs (blank lines), then sentences,
 * and pack those units up to CHUNK_SIZE so **chunk boundaries fall on sentence ends** — no
 * rule or sentence is cut mid-way. Overlap carries a word-aligned tail into the next chunk.
 * Over-long runs with no punctuation (e.g. dense table rows) hard-split as a fallback.
 */
export function chunkText(
  text: string,
  size = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP,
): string[] {
  const clean = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];

  // Semantic units: sentences within paragraphs; hard-split anything longer than a chunk.
  const units: string[] = [];
  for (const para of clean.split(/\n\s*\n/)) {
    const t = para.trim();
    if (!t) continue;
    for (const sent of splitSentences(t)) {
      if (sent.length <= size) units.push(sent);
      else for (let i = 0; i < sent.length; i += size) units.push(sent.slice(i, i + size).trim());
    }
  }

  const chunks: string[] = [];
  let buf = "";
  for (const u of units) {
    if (u.length >= size) {
      // An over-long unit stands alone (no overlap) to respect the size bound.
      if (buf) { chunks.push(buf); buf = ""; }
      chunks.push(u);
      continue;
    }
    const next = buf ? `${buf} ${u}` : u;
    if (buf && next.length > size) {
      chunks.push(buf);
      let ov = buf.slice(-overlap);
      const sp = ov.indexOf(" ");
      ov = sp >= 0 ? ov.slice(sp + 1) : ov; // word-align the overlap tail
      buf = ov ? `${ov} ${u}` : u;
    } else {
      buf = next;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

export type ChunkMetadata = {
  text: string;
  document_title: string;
  agency: string;
  page: number;
  source_url: string;
};
