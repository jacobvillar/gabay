import { test } from "node:test";
import assert from "node:assert/strict";
import { joinTextItems, metaFor } from "../lib/rag/ingestion.ts";

// pdfjs-style text items: x = transform[4]; touching means next.x ≈ prev.x + prev.width.
const item = (str: string, x: number, width: number, hasEOL = false) => ({ str, transform: [1, 0, 0, 1, x, 0], width, hasEOL });

test("glues ligature glyphs that touch their neighbours ('bene fi t' -> 'benefit')", () => {
  const text = joinTextItems([item("Maternity Bene", 0, 100), item("fi", 100, 7), item("t claims", 107, 50)]);
  assert.equal(text, "Maternity Benefit claims");
});

test("keeps a space between ordinary items, even when they touch", () => {
  assert.equal(joinTextItems([item("the", 0, 20), item("first", 20, 30)]), "the first");
});

test("does not glue a ligature-looking item that has a gap", () => {
  assert.equal(joinTextItems([item("word", 0, 30), item("fi", 40, 7)]), "word fi");
});

test("ends lines on hasEOL without a trailing space", () => {
  assert.equal(joinTextItems([item("line one", 0, 50, true), item("line two", 0, 50)]), "line one\nline two");
});

test("maps files to citation metadata served from /docs", () => {
  assert.deepEqual(metaFor("sss-citizens-charter-2025.pdf"), {
    document_title: "SSS Citizens Charter (2025)",
    agency: "SSS",
    source_url: "/docs/sss-citizens-charter-2025.pdf",
  });
  assert.deepEqual(metaFor("new-circular.pdf"), {
    document_title: "new-circular",
    agency: "",
    source_url: "/docs/new-circular.pdf",
  });
});
