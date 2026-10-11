import { test } from "node:test";
import assert from "node:assert/strict";
import { fuseRanked } from "../lib/rag/retrieval.ts";
import { keywordSearch } from "../lib/rag/keyword.ts";

const doc = (title: string, page: number) => ({
  text: `${title} p${page}`, document_title: title, agency: title, page, source_url: "",
});

test("RRF fusion ranks a chunk found by both searches above single-list hits", () => {
  const both = doc("DOLE", 50);
  const fused = fuseRanked([[doc("SSS", 1), both], [doc("SSS", 2), both]], 3);
  assert.equal(fused[0].page, 50);
  assert.equal(fused.length, 3);
});

test("RRF fusion tolerates an empty list (vector search down)", () => {
  const fused = fuseRanked([[], [doc("DOLE", 51), doc("DOLE", 52)]], 8);
  assert.deepEqual(fused.map((d) => d.page), [51, 52]);
});

test("keyword search honors the agency filter", () => {
  const sss = keywordSearch("13th month pay", 8, "SSS");
  assert.ok(sss.every((h) => h.agency === "SSS"));
  const dole = keywordSearch("13th month pay", 8, "DOLE");
  assert.ok(dole.length > 0 && dole.every((h) => h.agency === "DOLE"));
});

test("a wrong agency guess cannot hide the right handbook (agency boosts, never excludes)", async () => {
  const { retrieve } = await import("../lib/rag/retrieval.ts");
  // No env in tests: the vector side fails and is skipped, so this exercises keyword + fusion.
  const hits = await retrieve("How many service incentive leave days am I entitled to?", 8, "SSS");
  assert.ok(hits.some((h) => h.agency === "DOLE" && [37, 38].includes(h.page)), JSON.stringify(hits.map((h) => `${h.agency} p.${h.page}`)));
});
