// Plant for the style lint: a misspelt token in a style template of element source (FR-010, SC-006).
const css = (strings: TemplateStringsArray): string => strings.join("");

export const styles = css`
  :host {
    background: var(--ocelle-color-canvs);
  }
`;
