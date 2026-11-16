// Plant for the style lint: the grid-template-columns allowance in an element's css template (013 research.md R-10).
const css = (strings: TemplateStringsArray): string => strings.join("");

export const styles = css`
  dl {
    grid-template-columns: fit-content(50%) minmax(auto, 50%);
  }
`;
