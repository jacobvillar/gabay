# CLAUDE.md

Guidance for Claude Code in this repo. See [AGENTS.md](AGENTS.md) for the full working guidance —
it applies here too.

Key reminders:
- Keep diffs small; prefer the boring solution. Mark shortcuts with `// ponytail:`.
- Secrets only through `lib/config.ts`, read at call time. Never ship a secret to the client.
- RAG stays a tool call. Citations always render.
- Run `npm run typecheck && npm test && npm run build` before calling a change done.
