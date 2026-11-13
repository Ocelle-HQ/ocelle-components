// fail-font-not-loaded: a face whose file is no font.
export default { title: "Font not loaded" };

const sheet = `<style>
  @font-face { font-family: "Plant Face"; src: url("./index.json") format("woff2"); }
  .plant-face { font-family: "Plant Face", "Schibsted Grotesk"; }
</style>`;

export const BrokenFace = { render: (): string => `${sheet}<p class="plant-face">Text in a face that never loads</p>` };
