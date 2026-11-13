// fail-other-font: text in a system serif face.
export default { title: "Other font" };

export const Serif = { render: (): string => `<style>.plant-serif { font-family: serif; }</style><p class="plant-serif">Serif text</p>` };
