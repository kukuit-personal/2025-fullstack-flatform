// steps/grapes-editor/blocks.ts
// Các block 100% HTML email-safe: table, p, img, a
export const BLOCK_ONE_SECTION = `
<table role="presentation" width="650" align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0;background:#ffffff;">
  <tbody>
    <tr>
      <td valign="top" style="padding:16px;">
        <p style="margin:0 0 8px 0;line-height:1.4;color:#111111;font-size:14px;">
          Lorem ipsum dolor sit amet, <a href="#a" style="text-decoration:underline;">a link</a>.
        </p>
        <p style="margin:0;line-height:1.4;color:#555555;font-size:13px;">
          Replace this text with your content. You can also insert an <a href="#a" style="text-decoration:underline;">anchor link</a>.
        </p>
      </td>
    </tr>
  </tbody>
</table>
`;

export const BLOCK_HALF_SECTION = `
<table role="presentation" width="650" align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0;background:#ffffff;">
  <tbody>
    <tr>
      <td width="325" valign="top" style="padding:16px;">
        <p style="margin:0 0 8px 0;line-height:1.4;color:#111111;font-size:14px;">
          Left column paragraph with an <a href="#a" style="text-decoration:underline;">anchor link</a>.
        </p>
        <p style="margin:0;line-height:1.4;color:#555555;font-size:13px;">
          Add your text here. You can also place an image below:
        </p>
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0;margin-top:8px;">
          <tbody>
            <tr>
              <td align="left">
                <img src="https://via.placeholder.com/300x150" width="300" height="150" alt="Placeholder"
                     style="display:block;border:0;outline:none;text-decoration:none;max-width:100%;height:auto;" />
              </td>
            </tr>
          </tbody>
        </table>
      </td>
      <td width="325" valign="top" style="padding:16px;">
        <p style="margin:0 0 8px 0;line-height:1.4;color:#111111;font-size:14px;">
          Right column paragraph. <a href="#a" style="text-decoration:underline;">Learn more</a>.
        </p>
        <p style="margin:0;line-height:1.4;color:#555555;font-size:13px;">
          Put any text here. All markup sticks to table, p, img, a.
        </p>
      </td>
    </tr>
  </tbody>
</table>
`;

export function registerCustomBlocks(editor: any, opts?: { categoryId?: string; categoryLabel?: string }) {
  const catId = opts?.categoryId ?? "email-layout";
  const catLabel = opts?.categoryLabel ?? "Email layouts";
  const bm = editor.BlockManager;

  bm.add("one-section", {
    label: "1 Section",
    category: { id: catId, label: catLabel },
    attributes: { title: "1 Section" },
    content: BLOCK_ONE_SECTION,
  });

  bm.add("half-section", {
    label: "1/2 Section",
    category: { id: catId, label: catLabel },
    attributes: { title: "1/2 Section" },
    content: BLOCK_HALF_SECTION,
  });
}
