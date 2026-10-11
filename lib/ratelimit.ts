/**
 * Per-visitor limit on /api/chat, so one person or script can't spend the shared Groq daily quota.
 * ponytail: in-memory, so each server instance counts on its own and a restart resets it. Stops a
 * casual over-user, not a determined one. Upgrade path: a Vercel firewall rule or a shared store.
 */
import { config } from "@/lib/config";

export const RATE_LIMITED = "You've reached the hourly question limit. Please try again in a little while.";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_TRACKED_IPS = 10_000; // bounds memory; clearing only ever lets requests through
const asked = new Map<string, number[]>(); // IP -> timestamps of questions in the last hour

/**
 * The visitor's IP. On Vercel the first x-forwarded-for entry is the client (Vercel sets it).
 * IPv6 is keyed by its /64 network: one subscriber can rotate addresses within it.
 */
export function clientIp(req: Request): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return ip.includes(":") ? expandV6(ip).slice(0, 4).join(":") + "::/64" : ip;
}

function expandV6(ip: string): string[] {
  const [head, tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  return ip.includes("::") ? [...h, ...Array(8 - h.length - t.length).fill("0"), ...t] : h;
}

/** Sliding window: true (and counted) if this visitor asked fewer than the limit in the last hour. */
export function allowRequest(req: Request, now = Date.now()): boolean {
  const ip = clientIp(req);
  const recent = (asked.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= config.questionsPerHour) {
    asked.set(ip, recent);
    return false;
  }
  if (asked.size >= MAX_TRACKED_IPS && !asked.has(ip)) asked.clear();
  asked.set(ip, [...recent, now]);
  return true;
}
