// fail-closed-shadow-root: a closed shadow root holding an unlabelled button, which axe cannot see.
export default { title: "Closed shadow root" };

class PlantClosed extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "closed" }).innerHTML = '<button type="button"></button>';
  }
}
if (customElements.get("ocelle-plant-closed") === undefined) customElements.define("ocelle-plant-closed", PlantClosed);

export const Closed = { render: (): string => "<p>Beside a closed shadow root</p><ocelle-plant-closed></ocelle-plant-closed>" };
