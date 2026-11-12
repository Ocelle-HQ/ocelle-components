// Plant for the style lint: the aspect-ratio allowance in an element's css template (005 research.md R-03, R-09).
const css = (strings: TemplateStringsArray): string => strings.join("");

export const styles = css`
  :host {
    aspect-ratio: calc(2);
  }
`;
