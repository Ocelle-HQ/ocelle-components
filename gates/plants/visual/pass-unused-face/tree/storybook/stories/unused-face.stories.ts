// pass-unused-face: a declared face no text uses.
export default { title: "Unused face" };

const sheet = `<style>
  @font-face { font-family: "Plant Unused Face"; src: url("./fonts/plant-unused-face.woff2") format("woff2"); }
  .plant-unused { font-family: "Plant Unused Face"; }
</style>`;

export const Declared = { render: (): string => `${sheet}<p>Text in the base face, beside a face no text uses</p>` };
