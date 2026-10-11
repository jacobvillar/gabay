# DESIGN.md — Gabay UI

Dark, monochrome, one type family, a collapsible left rail.

## Tokens (`app/globals.css`)
One family: Hanken Grotesk.
| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#19191e` | chat canvas |
| `--sidebar` | `#1d1d23` | left rail |
| `--panel` / `--panel-hover` | `#26262d` / `#2f2f37` | composer, chips, hover + active rows |
| `--border` | `#33333c` | hairlines |
| `--fg` | `#fafafa` | primary text |
| `--fg-muted` | `#9a9aa6` | secondary text, labels, placeholders (≥4.5:1 on rail and canvas) |
| `--fg-faint` | `#6c6c77` | disabled glyphs and borders only — fails 4.5:1, never for text |
| `--accent` / `--accent-fg` | `#fafafa` / `#19191e` | primary (send) button |

## Anatomy
- **Sidebar** (`components/App.tsx`): logo + wordmark with a collapse toggle; collapses
  to a 64px icon rail (logo becomes the expand button; icon buttons get `aria-label` + tooltip).
  Items: New chat · Search chats (filters Recents; Esc closes) · Documents (opens each PDF) ·
  Recents, each with a "…" menu (Rename inline, Delete with a confirm click). Collapsed state + last 20 chats persist in localStorage. 200ms width transition, off
  for reduced motion and on first paint. One icon family (2px stroke, inline SVG).
  Hidden under `md`.
- **Empty state** (`EmptyState.tsx`): centered greeting + 4 suggested-prompt chips.
- **Messages** (`Message.tsx`): user = right-aligned bubble; assistant = avatar + prose +
  `Sources`.
- **Sources** (`Sources.tsx`): `[n] agency · p.N` chips, one per document page, title on hover;
  each opens the PDF at that page (`/docs/<file>#page=N`).
- **Composer** (`Chat.tsx`): rounded auto-grow textarea, Enter to send, Shift+Enter for newline,
  disabled while streaming.
