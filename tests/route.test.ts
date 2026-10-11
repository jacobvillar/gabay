import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/chat/route.ts";

test("POST rejects malformed bodies with 400 before reaching the model", async () => {
  const systemOnly = JSON.stringify({ messages: [{ id: "1", role: "system", parts: [{ type: "text", text: "x" }] }] });
  for (const body of ["not json", "null", "{}", '{"messages":"nope"}', '{"messages":[]}', systemOnly]) {
    const res = await POST(new Request("http://x/api/chat", { method: "POST", body }));
    assert.equal(res.status, 400, `body: ${body}`);
  }
});
