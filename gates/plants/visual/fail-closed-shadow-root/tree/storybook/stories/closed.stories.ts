// fail-closed-shadow-root: a closed shadow root.
export default { title: "Closed shadow root" };

class PlantClosed extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "closed" }).innerHTML = "<p>Inside a closed shadow root</p>";
  }
}
if (customElements.get("ocelle-plant-closed") === undefined) customElements.define("ocelle-plant-closed", PlantClosed);

export const Closed = { render: (): string => "<ocelle-plant-closed></ocelle-plant-closed>" };
