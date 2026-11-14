// pass-input-font: inputs with font: inherit in the shadow styles.
export default { title: "Input font" };

// A custom element with an open shadow root holding two inputs; its shadow styles set their font.
class PlantInputs extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>input { font: inherit; }</style><input value="Typed value"><input placeholder="A placeholder">`;
  }
}
if (customElements.get("ocelle-plant-inputs") === undefined) customElements.define("ocelle-plant-inputs", PlantInputs);

export const Fields = { render: (): string => "<ocelle-plant-inputs></ocelle-plant-inputs>" };
