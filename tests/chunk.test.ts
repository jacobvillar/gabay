import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkText } from "../lib/rag/ingestion.ts";

test("short text stays a single chunk", () => {
  assert.deepEqual(chunkText("Hello world.", 1000, 150), ["Hello world."]);
});

test("packs sentences without cutting mid-sentence, with overlap", () => {
  const sentences = Array.from(
    { length: 30 },
    (_, i) => `Sentence ${i + 1} explains a Philippine worker benefit rule.`,
  );
  const chunks = chunkText(sentences.join(" "), 300, 60);
  assert.ok(chunks.length > 1, "splits into multiple chunks");
  for (let i = 0; i < chunks.length - 1; i++) {
    assert.match(chunks[i], /[.!?]$/, "non-final chunk ends on a sentence boundary");
  }
  for (const c of chunks) assert.ok(c.length <= 300 + 60, `chunk too long: ${c.length}`);
  for (const s of sentences) assert.ok(chunks.some((c) => c.includes(s)), `missing: ${s}`);
});

test("over-long unbroken run hard-splits within the size bound", () => {
  const chunks = chunkText("a".repeat(2500), 1000, 150);
  assert.ok(chunks.length >= 3);
  for (const c of chunks) assert.ok(c.length <= 1000);
});

test("empty / whitespace yields no chunks", () => {
  assert.deepEqual(chunkText("   \n\n  "), []);
});
