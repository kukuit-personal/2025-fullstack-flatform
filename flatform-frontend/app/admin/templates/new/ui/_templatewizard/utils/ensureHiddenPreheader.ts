/** Ẩn chắc chắn p#pre-header (idempotent) */
export function ensureHiddenPreheader(html: string): string {
  try {
    const hasHtmlTag = /<\s*html[\s>]/i.test(html);
    const shell = hasHtmlTag
      ? html
      : `<!doctype html><html><body>${html}</body></html>`;
    const doc = new DOMParser().parseFromString(shell, "text/html");
    const p = doc.getElementById("pre-header") as HTMLElement | null;
    if (p) {
      const H =
        "display:none !important;visibility:hidden !important;opacity:0 !important;color:transparent !important;max-height:0 !important;max-width:0 !important;overflow:hidden !important;mso-hide:all !important;font-size:1px !important;line-height:1px !important;";
      p.setAttribute("style", `${p.getAttribute("style") || ""};${H}`);
      p.setAttribute("aria-hidden", "true");
      const td = p.closest("td") as HTMLElement | null;
      if (td)
        td.setAttribute(
          "style",
          `${td.getAttribute("style") || ""};mso-hide:all !important;`
        );
    }
    return hasHtmlTag ? doc.documentElement.outerHTML : doc.body.innerHTML;
  } catch {
    return html;
  }
}
