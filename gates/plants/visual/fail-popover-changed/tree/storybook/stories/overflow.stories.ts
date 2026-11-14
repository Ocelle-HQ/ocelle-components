// fail-popover-changed: the popover's text changed.
export default { title: "Overflow and popover" };

// A custom element whose connectedCallback opens its popover, so the top layer holds it before the capture.
class PlantPopover extends HTMLElement {
  connectedCallback(): void {
    this.querySelector<HTMLElement>("[popover]")?.showPopover();
  }
}
if (customElements.get("ocelle-plant-popover") === undefined) customElements.define("ocelle-plant-popover", PlantPopover);

const sheet = `<style>
  .plant-box { position: relative; width: 300px; height: 100px; border: 1px solid var(--ocelle-color-ink); }
  .plant-over { position: absolute; left: 250px; top: 80px; width: 220px; margin: 0; background: var(--ocelle-color-sheet); }
</style>`;

/** A child overflowing its root's box and an open top-layer popover: both are in the capture (FR-012). */
export const Surfaces = {
  render: (): string => `${sheet}<ocelle-plant-popover><div class="plant-box"><p class="plant-over">Outside the root's box</p></div><div popover="manual">Changed popover text</div></ocelle-plant-popover>`,
};
