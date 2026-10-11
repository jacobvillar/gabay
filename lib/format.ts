/**
 * Clean model output before rendering. The prompt forbids these, but models still emit them now
 * and then (verified on production), so the UI is the backstop.
 */
export function cleanAnswer(text: string): string {
  return (
    text
      // gpt-oss citation tokens like 【3†L1-L4】; real sources render in the Sources panel.
      .replace(/【[^】]*】/g, "")
      // Raw HTML list/break tags: Markdown is rendered without raw HTML, so they'd show literally.
      .replace(/<\/?(br|ul|ol|li|p)\s*\/?>/gi, " ")
      // Leaked LaTeX math → plain text (the UI has no math renderer).
      .replace(/\\text\{([^{}]*)\}/g, "$1")
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "$1 ÷ $2")
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\[()]/g, "")
      .replace(/^\s*\\?\[\s+(.+?)\s+\\?\]\s*$/gm, "$1") // display-math wrapper "[ … ]"
      .replace(/ +([.,])/g, "$1")
      .replace(/(\S) {2,}(?=\S)/g, "$1 ") // between words only: keeps list indentation and hard breaks
  );
}
