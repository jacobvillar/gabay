import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "@/lib/rag/retrieval";
import { Sources } from "./Sources";
import { Logo } from "./Logo";

export function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  let text = "";
  let sources: Source[] = [];
  for (const part of message.parts as Array<Record<string, unknown>>) {
    if (part.type === "text") text += part.text as string;
    if (part.type === "tool-searchKnowledgeBase" && part.state === "output-available") {
      const out = part.output as { sources?: Source[] } | undefined;
      if (out?.sources) sources = out.sources;
    }
  }

  // Strip model-specific citation tokens like 【3†L1-L4】; real sources render below.
  const clean = text.replace(/【[^】]*】/g, "").replace(/ +([.,])/g, "$1");

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-[var(--panel)] px-4 py-2.5 text-sm text-[var(--fg)]">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0">
        <Logo size={26} />
      </div>
      <div className="min-w-0 flex-1">
        {clean ? (
          <div className="chat-md text-sm leading-relaxed text-[var(--fg)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{clean}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-sm text-[var(--fg-muted)]">Searching the handbooks…</div>
        )}
        <Sources sources={sources} />
      </div>
    </div>
  );
}
