export function parseFullHtml(full: string): { css: string; body: string } {
  if (!full) return { css: "", body: "" };
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let css = "";
  let m: RegExpExecArray | null;
  while ((m = styleRegex.exec(full)) !== null) css += (m[1] || "") + "\n";
  const bodyMatch = full.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : full;
  return { css, body };
}
