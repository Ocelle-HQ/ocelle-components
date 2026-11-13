// fail-excepted-second-node: the pass-excepted story with a second node of the excepted rule, which its entries do not cover.
export default { title: "Excepted" };

const sheet = new CSSStyleSheet();
sheet.replaceSync('[data-candidate="low"] { color: var(--ocelle-color-rule); }');
if (!document.adoptedStyleSheets.includes(sheet)) document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

export const Faint = { render: (): string => '<p id="plant-faint" data-candidate="low">A faint line</p><p id="plant-faint-two" data-candidate="low">A second faint line</p>' };
