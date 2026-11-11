// pass-animation-and-caret: a running animation and a focused field.
export default { title: "Animation and caret" };

// A custom element whose connectedCallback focuses its text field, so the caret would blink in the capture.
class PlantFocus extends HTMLElement {
  connectedCallback(): void {
    this.querySelector("input")?.focus();
  }
}
if (customElements.get("ocelle-plant-focus") === undefined) customElements.define("ocelle-plant-focus", PlantFocus);

const sheet = `<style>
  @keyframes plant-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .plant-spinner { width: 80px; height: 80px; margin: 16px; background: var(--ocelle-color-ink); animation: plant-spin 1s linear infinite; }
  .plant-field { font: inherit; }
</style>`;

export const Running = {
  render: (): string => `${sheet}<ocelle-plant-focus><div class="plant-spinner"></div><input class="plant-field" value="A focused field"></ocelle-plant-focus>`,
};
