// fail-font-file-missing: a face whose file does not exist.
export default { title: "Font file missing" };

const sheet = `<style>
  @font-face { font-family: "Plant Missing Face"; src: url("./fonts/plant-missing-face.woff2") format("woff2"); }
  .plant-face { font-family: "Plant Missing Face", "Schibsted Grotesk"; }
</style>`;

export const MissingFace = { render: (): string => `${sheet}<p class="plant-face">Text in a face that is not there</p>` };
