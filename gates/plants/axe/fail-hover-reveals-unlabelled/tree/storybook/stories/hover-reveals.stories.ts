// fail-hover-reveals-unlabelled: hovering the trigger shows an unlabelled button; the story's pointer state hovers it.
export default { title: "Hover reveals" };

const sheet = `<style>
  .plant-reveal { display: none; }
  .plant-trigger:hover .plant-reveal { display: inline-block; }
</style>`;

export const Hover = {
  parameters: { ocelle: { pointer: { hover: ".plant-trigger" } } },
  render: (): string => `${sheet}<div class="plant-trigger"><p>Hover here</p><button class="plant-reveal" type="button"></button></div>`,
};
