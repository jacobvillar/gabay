import type { UIMessage } from "ai";
import type { Source } from "@/lib/rag/retrieval";
import { Sources } from "./Sources";

export function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  // Concatenate text parts; collect sources from the retrieval tool's output.
  let text = "";
  let sources: Source[] = [];
  for (const part of message.parts as Array<Record<string, unknown>>) {
    if (part.type === "text") text += part.text as string;
    if (part.type === "tool-searchKnowledgeBase" && part.state === "output-available") {
      const out = part.output as { sources?: Source[] } | undefined;
      if (out?.sources) sources = out.sources;
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-[var(--user-bubble)] px-4 py-2.5 text-sm text-[var(--fg)]">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-xs font-bold text-white">
        G
      </div>
      <div className="min-w-0 flex-1">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--fg)]">
          {text || <span className="text-[var(--fg-muted)]">Searching the handbooks…</span>}
        </div>
        <Sources sources={sources} />
      </div>
    </div>
  );
}
