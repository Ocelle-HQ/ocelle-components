// Plant for the style lint: a style template in element source (postcss-lit).
const css = (strings: TemplateStringsArray): string => strings.join("");

export const styles = css`
  :host {
    margin: 4px;
  }
`;
