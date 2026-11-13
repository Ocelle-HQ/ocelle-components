// fail-input-system-font: inputs without a font rule.
export default { title: "Input system font" };

// A custom element with an open shadow root holding two inputs; no font rule reaches them.
class PlantInputs extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<input value="Typed value"><input placeholder="A placeholder">`;
  }
}
if (customElements.get("ocelle-plant-inputs") === undefined) customElements.define("ocelle-plant-inputs", PlantInputs);

export const Fields = { render: (): string => "<ocelle-plant-inputs></ocelle-plant-inputs>" };
