// fail-hover-style-changed: only the :hover rule changed.
export default { title: "Hover and press" };

const sheet = `<style>
  .plant-target { display: inline-block; padding: 8px 16px; border: 1px solid var(--ocelle-color-ink); }
  .plant-hover:hover { background: var(--ocelle-color-link); color: var(--ocelle-color-canvas); }
  .plant-press:active { background: var(--ocelle-color-link); color: var(--ocelle-color-canvas); }
</style>`;

/** A declared hover state: the capture shows the :hover rule (FR-031). */
export const Hover = {
  parameters: { ocelle: { pointer: { hover: ".plant-hover" } } },
  render: (): string => `${sheet}<p class="plant-target plant-hover">Hovered target</p>`,
};

/** A declared press state: the capture shows the :active rule (FR-031). */
export const Press = {
  parameters: { ocelle: { pointer: { press: ".plant-press" } } },
  render: (): string => `${sheet}<button type="button" class="plant-target plant-press">Pressed target</button>`,
};
