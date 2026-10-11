import { test } from "node:test";
import assert from "node:assert/strict";
import { keywordSearch } from "../lib/rag/keyword.ts";

test("keyword fallback finds the DOLE 13th-month section", () => {
  const hits = keywordSearch("How is 13th-month pay computed?", 8);
  assert.equal(hits[0]?.agency, "DOLE");
  assert.ok(hits.slice(0, 4).every((h) => h.page >= 50 && h.page <= 54), JSON.stringify(hits.map((h) => h.page)));
});

test("keyword fallback returns nothing for an unrelated query", () => {
  assert.deepEqual(keywordSearch("zzqx", 8), []);
});
