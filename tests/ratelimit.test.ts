import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, allowRequest } from "../lib/ratelimit.ts";
import { config } from "../lib/config.ts";

const req = (headers: Record<string, string>) => new Request("http://x/api/chat", { headers });
const HOUR = 60 * 60 * 1000;

test("uses the first (client) address Vercel puts in x-forwarded-for", () => {
  assert.equal(clientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })), "203.0.113.7");
});

test("falls back to one shared bucket when no IP header is present", () => {
  assert.equal(clientIp(req({})), "unknown");
});

test("blocks a visitor after the hourly limit, without affecting other visitors", () => {
  const a = req({ "x-forwarded-for": "198.51.100.1" });
  const t = 1_000_000;
  for (let i = 0; i < config.questionsPerHour; i++) assert.equal(allowRequest(a, t + i), true, `question ${i + 1}`);
  assert.equal(allowRequest(a, t + 100), false);
  assert.equal(allowRequest(req({ "x-forwarded-for": "198.51.100.2" }), t + 100), true);
});

test("the window slides: questions free up an hour after they were asked", () => {
  const a = req({ "x-forwarded-for": "198.51.100.3" });
  const t = 5_000_000;
  for (let i = 0; i < config.questionsPerHour; i++) allowRequest(a, t);
  assert.equal(allowRequest(a, t + HOUR - 1), false);
  assert.equal(allowRequest(a, t + HOUR), true);
});

test("groups IPv6 visitors by /64, so rotating addresses in one network doesn't reset the limit", () => {
  assert.equal(clientIp(req({ "x-forwarded-for": "2001:db8:1:2:aaaa::1" })), clientIp(req({ "x-forwarded-for": "2001:db8:1:2:bbbb::9" })));
});
