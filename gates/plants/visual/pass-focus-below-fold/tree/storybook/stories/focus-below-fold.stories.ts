// pass-focus-below-fold: a focus below the fold scrolls the page.
export default { title: "Focus below fold" };

// A custom element whose connectedCallback focuses its text field at y = 1500, which scrolls the page.
class PlantFocusLow extends HTMLElement {
  connectedCallback(): void {
    this.querySelector("input")?.focus();
  }
}
if (customElements.get("ocelle-plant-focus-low") === undefined) customElements.define("ocelle-plant-focus-low", PlantFocusLow);

const sheet = `<style>
  .plant-tall { position: absolute; top: 0; left: 0; width: 600px; height: 2000px; }
  .plant-fixed { position: fixed; top: 0; right: 0; margin: 0; padding: 8px; background: var(--ocelle-color-ink); color: var(--ocelle-color-canvas); }
  .plant-low { position: absolute; top: 1500px; font: inherit; }
</style>`;

export const Focused = {
  render: (): string => `${sheet}<ocelle-plant-focus-low><div class="plant-tall"><p class="plant-fixed">Fixed at the top</p><input class="plant-low" value="Focused below the fold"></div></ocelle-plant-focus-low>`,
};
