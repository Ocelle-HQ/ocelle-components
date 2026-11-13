// fail-hover-near-fold: the hover target lies at y = 740 to 780, inside the 1280 × 800 viewport and outside Playwright's
// default 720 px one; hovering it shows an unlabelled button (research.md R-08, R-15).
export default { title: "Hover near fold" };

const sheet = `<style>
  .plant-near { position: absolute; top: 740px; left: 0; width: 600px; height: 40px; margin: 0; }
  .plant-reveal { display: none; }
  .plant-near:hover .plant-reveal { display: inline-block; }
</style>`;

export const Hover = {
  parameters: { ocelle: { pointer: { hover: ".plant-near" } } },
  render: (): string => `${sheet}<div class="plant-near">Hover here <button class="plant-reveal" type="button"></button></div>`,
};
