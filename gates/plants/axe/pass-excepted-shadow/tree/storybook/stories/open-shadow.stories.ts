// pass-excepted-shadow (the fail-open-shadow-unlabelled story, excepted per theme by its >>> selector): a custom element whose open shadow root holds an unlabelled button (research.md R-08).
export default { title: "Open shadow" };

class PlantOpen extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = "<button></button>";
  }
}
if (customElements.get("ocelle-plant-open") === undefined) customElements.define("ocelle-plant-open", PlantOpen);

export const Unlabelled = { render: (): string => "<ocelle-plant-open></ocelle-plant-open>" };
