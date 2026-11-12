// Plant for the style lint: the 1lh allowance in an element's css template (005 research.md R-03, R-10).
const css = (strings: TemplateStringsArray): string => strings.join("");

export const styles = css`
  .icon-row {
    padding-block: calc((1lh) * 3 + var(--ocelle-space-1));
  }
`;
