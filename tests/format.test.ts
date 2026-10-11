import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanAnswer } from "../lib/format.ts";

test("rewrites leaked LaTeX math as plain text", () => {
  const raw = "[ \\text{13th-month pay} = \\frac{\\text{Total basic salary}}{12} ]";
  assert.equal(cleanAnswer(raw), "13th-month pay = Total basic salary ÷ 12");
});

test("strips citation tokens and stray HTML list tags", () => {
  assert.equal(cleanAnswer("Five days【2†L1-L4】.<br>Paid leave"), "Five days. Paid leave");
});

test("keeps leading indentation so nested lists stay nested", () => {
  const md = "1. Compute the total:\n   - basic salary only\n   - exclude  overtime";
  assert.equal(cleanAnswer(md), "1. Compute the total:\n   - basic salary only\n   - exclude overtime");
});

test("leaves Markdown links and [n] markers alone", () => {
  const md = "See [DOLE](https://www.dole.gov.ph) and [1].";
  assert.equal(cleanAnswer(md), md);
});

test("keeps Markdown hard line breaks (two trailing spaces)", () => {
  assert.equal(cleanAnswer("Step one  \nStep two"), "Step one  \nStep two");
});
