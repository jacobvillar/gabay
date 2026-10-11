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

// ---------------------------------------------------------------------------
// PDF → pages → chunk metadata. Used by scripts/seed.ts; kept here so it's testable.
// ---------------------------------------------------------------------------

/** Filename keyword → citation metadata. Edit when you add or rename a PDF in public/docs/. */
const DOC_META: Record<string, { document_title: string; agency: string }> = {
  dole: { document_title: "Handbook on Workers' Statutory Monetary Benefits (2023)", agency: "DOLE" },
  sss: { document_title: "SSS Citizens Charter (2025)", agency: "SSS" },
  philhealth: { document_title: "PhilHealth Konsulta Circular 2022-0032", agency: "PhilHealth" },
  pagibig: { document_title: "Pag-IBIG Fund Programs and Services (2019)", agency: "Pag-IBIG" },
};

/** Citation metadata for a corpus file; `source_url` is where the app serves it (public/docs). */
export function metaFor(file: string): Omit<ChunkMetadata, "text" | "page"> {
  const key = Object.keys(DOC_META).find((k) => file.toLowerCase().includes(k));
  const meta = key ? DOC_META[key] : { document_title: file.replace(/\.pdf$/i, ""), agency: "" };
  return { ...meta, source_url: `/docs/${file}` };
}

type TextItem = { str?: string; hasEOL?: boolean; transform?: number[]; width?: number };
const LIGATURE = /^(fi|fl|ff|ffi|ffl)$/;

/**
 * Join pdfjs text items into page text. pdfjs emits ligature glyphs ("fi", "fl", …) as their own
 * items that touch their neighbours, so a blind space join yields "bene fi t" (2,316 times in the
 * SSS charter). Glue only ligature items that touch (gap < 1pt); everything else is space-joined.
 */
export function joinTextItems(items: TextItem[]): string {
  let text = "";
  let prev: TextItem | undefined;
  for (const it of items) {
    const str = it.str ?? "";
    const touching =
      prev?.transform && it.transform && prev.width !== undefined &&
      Math.abs(it.transform[4] - (prev.transform[4] + prev.width)) < 1;
    const glue = touching && (LIGATURE.test(str) || LIGATURE.test(prev?.str ?? ""));
    if (text && !text.endsWith("\n") && !glue) text += " ";
    text += str;
    if (it.hasEOL) text += "\n";
    prev = it;
  }
  return text;
}

/** Text of each page (index 0 = page 1). pdfjs is loaded lazily so app code never bundles it. */
export async function extractPages(data: Uint8Array): Promise<string[]> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    pages.push(joinTextItems(content.items as TextItem[]));
  }
  return pages;
}
