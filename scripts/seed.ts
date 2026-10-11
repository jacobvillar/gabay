/**
 * Seed the Upstash Vector index from the PDFs in data/.
 * Per-page text extraction (so citations carry real page numbers), then chunk,
 * then upsert the raw text — Upstash embeds it server-side with the index's model.
 *
 * Run: npm run seed   (reads .env.local)
 */
import fs from "node:fs";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { Index } from "@upstash/vector";
import { config } from "@/lib/config";
import { chunkText, type ChunkMetadata } from "@/lib/rag/ingestion";

// Load .env.local for the script (Next.js does this for the app, not for tsx).
try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  // ponytail: fall back to ambient env (e.g. CI secrets) if no .env.local.
}

const DATA_DIR = path.join(process.cwd(), "data");

// Map a filename to its citation metadata. Edit when you add/rename a PDF.
type DocMeta = { document_title: string; agency: string; source_url: string };
const DOC_META: Record<string, DocMeta> = {
  dole: {
    document_title: "Handbook on Workers' Statutory Monetary Benefits (2023)",
    agency: "DOLE",
    source_url: "https://www.dole.gov.ph/",
  },
  sss: {
    document_title: "SSS Citizens Charter (2025)",
    agency: "SSS",
    source_url: "https://www.sss.gov.ph/",
  },
  philhealth: {
    document_title: "PhilHealth Konsulta Circular 2022-0032",
    agency: "PhilHealth",
    source_url: "https://www.philhealth.gov.ph/",
  },
  pagibig: {
    document_title: "Pag-IBIG Fund Programs and Services (2019)",
    agency: "Pag-IBIG",
    source_url: "https://www.pagibigfund.gov.ph/",
  },
};

function metaFor(file: string): DocMeta {
  const key = Object.keys(DOC_META).find((k) => file.toLowerCase().includes(k));
  if (key) return DOC_META[key];
  // ponytail: unknown file — derive a title from the filename, leave agency blank.
  return { document_title: file.replace(/\.pdf$/i, ""), agency: "", source_url: "" };
}

async function pagesOf(filePath: string): Promise<string[]> {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str?: string; hasEOL?: boolean }>;
    let pageText = "";
    for (const it of items) pageText += (it.str ?? "") + (it.hasEOL ? "\n" : " ");
    pages.push(pageText);
  }
  return pages;
}

async function main() {
  const files = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"))
    : [];

  if (files.length === 0) {
    console.error("No PDFs in data/. Drop the DOLE/SSS/PhilHealth/Pag-IBIG PDFs there first.");
    process.exit(1);
  }

  const index = new Index({ url: config.upstashUrl(), token: config.upstashToken() });
  await index.reset();
  console.log("  (index reset)");
  let id = 0;
  let total = 0;

  for (const file of files) {
    const meta = metaFor(file);
    const pages = await pagesOf(path.join(DATA_DIR, file));

    const records: ChunkMetadata[] = [];
    pages.forEach((text, i) => {
      for (const c of chunkText(text)) {
        records.push({ text: c, page: i + 1, ...meta });
      }
    });

    // Upsert in batches; Upstash embeds `data` server-side with the index's model.
    const BATCH = 100;
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      await index.upsert(
        batch.map((r) => ({ id: ++id, data: r.text, metadata: r })),
      );
    }

    console.log(`  ${file} -> ${records.length} chunks (${pages.length} pages) [${meta.agency}]`);
    total += records.length;
  }

  console.log(`Done. Upserted ${total} chunks from ${files.length} document(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
