import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/chat/route.ts";

test("POST rejects malformed bodies with 400 before reaching the model", async () => {
  for (const body of ["not json", "null", "{}", '{"messages":"nope"}', '{"messages":[]}']) {
    const res = await POST(new Request("http://x/api/chat", { method: "POST", body }));
    assert.equal(res.status, 400, `body: ${body}`);
  }
});
