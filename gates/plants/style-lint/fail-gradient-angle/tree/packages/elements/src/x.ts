// Plant for the style lint: a gradient in a style template of element source (postcss-lit).
const css = (strings: TemplateStringsArray): string => strings.join("");

export const styles = css`
  .region-box {
    mask-image: linear-gradient(45deg, transparent, var(--ocelle-color-ink));
  }
`;
