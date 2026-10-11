import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/chat/route.ts";
import { allowRequest, RATE_LIMITED } from "../lib/ratelimit.ts";
import { config } from "../lib/config.ts";

const post = (body: string, ip = "192.0.2.1") =>
  POST(new Request("http://x/api/chat", { method: "POST", headers: { "x-forwarded-for": ip }, body }));
const msg = (role: string, t: string) => ({ id: t, role, parts: [{ type: "text", text: t }] });

test("POST rejects malformed bodies with 400 before reaching the model", async () => {
  const systemOnly = JSON.stringify({ messages: [msg("system", "x")] });
  const endsWithAssistant = JSON.stringify({ messages: [msg("user", "q"), msg("assistant", "a")] });
  for (const body of ["not json", "null", "{}", '{"messages":"nope"}', '{"messages":[]}', systemOnly, endsWithAssistant]) {
    const res = await post(body);
    assert.equal(res.status, 400, `body: ${body}`);
  }
});

test("rejected requests don't use up the visitor's hourly limit", async () => {
  const ip = "192.0.2.2";
  for (let i = 0; i < config.questionsPerHour + 5; i++) await post("{}", ip);
  assert.equal(allowRequest(new Request("http://x", { headers: { "x-forwarded-for": ip } })), true);
});

test("returns 429 with the plain-text limit message once a visitor is over the limit", async () => {
  const ip = "192.0.2.3";
  for (let i = 0; i < config.questionsPerHour; i++) allowRequest(new Request("http://x", { headers: { "x-forwarded-for": ip } }));
  const res = await post(JSON.stringify({ messages: [msg("user", "hi")] }), ip);
  assert.equal(res.status, 429);
  assert.equal(await res.text(), RATE_LIMITED);
});
