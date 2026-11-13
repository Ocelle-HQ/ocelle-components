// pass-excepted: one text node in the decorative rule colour (serious color-contrast), excepted per theme.
export default { title: "Excepted" };

const sheet = new CSSStyleSheet();
sheet.replaceSync('[data-candidate="low"] { color: var(--ocelle-color-rule); }');
if (!document.adoptedStyleSheets.includes(sheet)) document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

export const Faint = { render: (): string => '<p id="plant-faint" data-candidate="low">A faint line</p>' };
