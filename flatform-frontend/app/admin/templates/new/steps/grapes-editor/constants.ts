// steps/grapes-editor/constants.ts
export const NBSP = "&nbsp;";

export const PREHEADER_BLOCK = `
<table role="presentation" width="650" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0">
  <tbody>
    <tr>
      <td width="650" align="center" bgcolor="#ffffff" style="display:none;visibility:hidden;opacity:0;color:transparent;max-height:0;max-width:0;overflow:hidden;mso-hide:all;">
        <p id="pre-header"
           style="margin:0;font-size:1px;line-height:1px;color:transparent;display:none;visibility:hidden;opacity:0;max-height:0;max-width:0;overflow:hidden;mso-hide:all;"
           aria-hidden="true">${NBSP}</p>
      </td>
    </tr>
  </tbody>
</table>
`;

export const DEFAULT_HTML = `
  <!-- Pre-header (hidden) -->
  ${PREHEADER_BLOCK}
  <!-- End Pre-header -->

  <!-- Main -->
  <table role="presentation" width="650" align="center" bgcolor="#f4f4f4" border="0" cellpadding="0" cellspacing="0" style="min-height:500px;">
    <tbody>
      <tr>
        <td valign="top">
          <!-- Drag & drop newsletter blocks here -->
        </td>
      </tr>
    </tbody>
  </table>
`;
