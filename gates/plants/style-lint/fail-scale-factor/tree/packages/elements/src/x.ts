// Plant for the style lint: the scale allowance in an element's css template (005 research.md R-03, R-08).
const css = (strings: TemplateStringsArray): string => strings.join("");

export const styles = css`
  :host(:dir(rtl)) .mirror {
    scale: 2;
  }
`;
