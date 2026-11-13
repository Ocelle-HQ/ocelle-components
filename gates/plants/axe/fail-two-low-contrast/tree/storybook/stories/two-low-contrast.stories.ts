// fail-two-low-contrast: two text nodes in the decorative rule colour on the canvas, below 4.5:1 in both themes (phase 1
// spike § 8). Token colours only; the stylesheet is adopted by the document, as the spike's candidate.
export default { title: "Two low contrast" };

const sheet = new CSSStyleSheet();
sheet.replaceSync('[data-candidate="low"] { color: var(--ocelle-color-rule); }');
if (!document.adoptedStyleSheets.includes(sheet)) document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

export const Faint = { render: (): string => '<div><p data-candidate="low">First faint line</p><p data-candidate="low">Second faint line</p></div>' };
