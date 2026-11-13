// pass-below-fold: a 2000 px tall story.
export default { title: "Below fold" };

/** A story whose root is 2000 px tall, its last line at y = 1500: the capture is the full page (FR-012). */
const sheet = `<style>
  .plant-tall { position: absolute; top: 0; left: 0; width: 600px; height: 2000px; }
  .plant-tall .plant-bottom { position: absolute; top: 1500px; margin: 0; }
</style>`;

export const Tall = { render: (): string => `${sheet}<div class="plant-tall"><p>The top of a tall story</p><p class="plant-bottom">Below the fold, at y = 1500</p></div>` };
