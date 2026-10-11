import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "@/lib/rag/retrieval";
import { Sources } from "./Sources";
import { cleanAnswer } from "@/lib/format";
import { Logo } from "./Logo";

export function Message({ message, pending = false }: { message: UIMessage; pending?: boolean }) {
  const isUser = message.role === "user";

  let text = "";
  let sources: Source[] = [];
  for (const part of message.parts as Array<Record<string, unknown>>) {
    if (part.type === "text") text += part.text as string;
    if (part.type === "tool-searchKnowledgeBase" && part.state === "output-available") {
      const out = part.output as { sources?: Source[] } | undefined;
      if (out?.sources) sources = [...sources, ...out.sources]; // union across searches
    }
  }

  const clean = cleanAnswer(text);

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
          <div className="text-sm text-[var(--fg-muted)]">
            {pending
              ? "Searching the handbooks…"
              : "I couldn't find a clear answer in the handbooks. Try rephrasing, or ask about one agency."}
          </div>
        )}
        <Sources sources={sources} />
      </div>
    </div>
  );
}
