// fail-pointer-target-below-fold: the hover target lies below the fold.
export default { title: "Pointer target below fold" };

const sheet = `<style>
  .plant-tall { position: absolute; top: 0; left: 0; width: 600px; height: 2000px; }
  .plant-low { position: absolute; top: 1500px; margin: 0; }
</style>`;

export const Hover = {
  parameters: { ocelle: { pointer: { hover: ".plant-low" } } },
  render: (): string => `${sheet}<div class="plant-tall"><p>A tall story</p><p class="plant-low">The hover target, below the fold</p></div>`,
};
