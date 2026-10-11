import { test } from "node:test";
import assert from "node:assert/strict";
import { convertToModelMessages, type UIMessage } from "ai";
import { searchesThisTurn } from "../lib/ai/tools.ts";

const search = (id: string) =>
  ({ type: "tool-searchKnowledgeBase", toolCallId: id, state: "output-available", input: { query: id }, output: { sources: [] } }) as UIMessage["parts"][number];

test("search budget counts only the current turn, so follow-up questions can still search", () => {
  const history: UIMessage[] = [
    { id: "1", role: "user", parts: [{ type: "text", text: "13th-month pay?" }] },
    { id: "2", role: "assistant", parts: [search("a"), search("b"), { type: "text", text: "answer" }] },
    { id: "3", role: "user", parts: [{ type: "text", text: "and service incentive leave?" }] },
  ];
  assert.equal(searchesThisTurn(convertToModelMessages(history)), 0);
});

test("search budget counts searches already made in this turn", () => {
  const history: UIMessage[] = [
    { id: "1", role: "user", parts: [{ type: "text", text: "13th-month pay?" }] },
    { id: "2", role: "assistant", parts: [search("a")] },
  ];
  assert.equal(searchesThisTurn(convertToModelMessages(history)), 1);
});
