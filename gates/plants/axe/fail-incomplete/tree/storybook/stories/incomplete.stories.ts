// fail-incomplete: text over a background image (a gradient of two tokens), whose contrast axe cannot decide: a serious
// color-contrast incomplete result in both themes (phase 1 spike § 8).
export default { title: "Incomplete" };

const sheet = new CSSStyleSheet();
sheet.replaceSync('[data-candidate="image"] { background-image: linear-gradient(var(--ocelle-color-canvas), var(--ocelle-color-inset)); padding: 8px; }');
if (!document.adoptedStyleSheets.includes(sheet)) document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

export const OverImage = { render: (): string => '<div data-candidate="image">Text over a background image</div>' };
