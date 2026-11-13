// fail-open-shadow-unlabelled: a custom element whose open shadow root holds an unlabelled button (research.md R-08).
export default { title: "Open shadow" };

class PlantOpen extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = "<button></button>";
  }
}
if (customElements.get("ocelle-plant-open") === undefined) customElements.define("ocelle-plant-open", PlantOpen);

export const Unlabelled = { render: (): string => "<ocelle-plant-open></ocelle-plant-open>" };
