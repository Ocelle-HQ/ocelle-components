// Plant for the style lint: the transform allowance in an element's css template (013 research.md R-10).
const css = (strings: TemplateStringsArray): string => strings.join("");

export const styles = css`
  @keyframes sweep {
    from {
      transform: translateX(8px);
    }
  }
`;
