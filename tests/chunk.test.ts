import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkText } from "../lib/rag/ingestion.ts";

test("short text stays a single chunk", () => {
  assert.deepEqual(chunkText("hello world", 1000, 150), ["hello world"]);
});

test("long text splits with overlap and loses nothing", () => {
  const text = "a".repeat(2500);
  const chunks = chunkText(text, 1000, 150);
  assert.ok(chunks.length >= 3, "should produce multiple chunks");
  // Each chunk is at most `size`.
  for (const c of chunks) assert.ok(c.length <= 1000);
  // Overlap: end of chunk 0 reappears at start of chunk 1.
  const step = 1000 - 150;
  assert.equal(chunks[1][0], text[step]);
});

test("empty / whitespace text yields no chunks", () => {
  assert.deepEqual(chunkText("   \n  "), []);
});
