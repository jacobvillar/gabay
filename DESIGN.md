# DESIGN.md — Gabay UI

Onyx-inspired design language: a dark left rail, a light chat canvas, one indigo accent.

## Tokens (`app/globals.css`)
| Token | Value | Use |
| --- | --- | --- |
| `--sidebar` | `#0d0f13` | dark left rail |
| `--canvas` | `#ffffff` | chat background |
| `--accent` | `#6d4aff` | brand / buttons / citation markers |
| `--accent-soft` | `#efeaff` | chip hover |
| `--user-bubble` | `#f1f2f5` | user message |
| `--border` | `#e5e7eb` | hairlines |

## Anatomy
- **Sidebar** (`components/App.tsx`, Onyx-style): Gabay mark + wordmark, "New chat", collapsible "Documents" (links to each agency), and "Recents" saved in the browser (localStorage, last 20 chats — no accounts or server storage). Hidden
  under `md` (mobile-friendly — stretch goal).
- **Empty state** (`EmptyState.tsx`): centered greeting + 4 suggested-prompt chips (stretch goal).
- **Messages** (`Message.tsx`): user = right-aligned bubble; assistant = avatar + prose +
  `Sources`. Inline `[n]` markers map to the sources list.
- **Sources** (`Sources.tsx`): `[n] document · agency · p.N`, linked to `source_url`.
- **Composer** (`Chat.tsx`): rounded auto-grow textarea, Enter to send, Shift+Enter for newline,
  disabled while streaming. Legal-info disclaimer underneath.

## Fidelity note
This matches Onyx's *design language*, not a pixel copy of a specific screen. To tighten to 1:1,
drop screenshots of Onyx's chat view or reference the `onyx-dot-app/onyx` theme and adjust tokens.
