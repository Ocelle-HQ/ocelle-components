// Plant for the style lint: the animation-iteration-count allowance in an element's css template (013 research.md R-10).
const css = (strings: TemplateStringsArray): string => strings.join("");

export const styles = css`
  .mark {
    animation-iteration-count: 2.5;
  }
`;
