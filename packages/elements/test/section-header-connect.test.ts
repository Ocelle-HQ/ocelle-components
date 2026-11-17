import { afterEach, describe, expect, it } from "vitest";
import { css } from "../../tokens/src/generate.ts";
import { source } from "../../tokens/src/source.ts";
import "../src/ocelle-section-header.ts";

// A section header re-reads its slot when it is connected (011 research.md R-05: "it also calls requestUpdate() in
// connectedCallback, so a header moved in the DOM re-reads its slot"; T020), in process on the element source with a
// stand-in `ocelle-card` that never notifies its headers, as a card of a copy that does not would: its open shadow
// root holds a slot named `header` and a default slot, and its `density` attribute is `compact`. A header that was
// drawn outside it at --ocelle-font-size-lg and is then moved into its header slot is drawn at
// --ocelle-font-size-subhead, the compact size; moved back out, at --ocelle-font-size-lg again. The real card is not
// imported in this file's iframe, so nothing but the header's own connection can make it compact.
class SilentCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = '<slot name="header"></slot><slot></slot>';
  }
}
customElements.define("ocelle-card", SilentCard);

const tokens = new CSSStyleSheet();
tokens.replaceSync(css(source).replace(/@font-face\s*\{[^}]*\}/g, ""));

afterEach(() => {
  document.body.replaceChildren();
});

async function settled(): Promise<void> {
  const headers = [...document.querySelectorAll("ocelle-section-header")] as unknown as { updateComplete: Promise<unknown> }[];
  await Promise.all(headers.map((each) => each.updateComplete));
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

/** The token's used font size on the page, through a probe. */
function size(token: string): string {
  const probe = document.createElement("span");
  probe.style.fontSize = `var(--ocelle-${token})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).fontSize;
  probe.remove();
  return value;
}

describe("ocelle-section-header moved into a compact card that does not notify it", () => {
  it("is drawn at the compact size once moved into the card's header slot, and at the default size once moved out again", async () => {
    document.adoptedStyleSheets = [tokens];
    document.body.innerHTML =
      '<ocelle-card id="card" density="compact"><p>Body</p></ocelle-card><div id="outside"><ocelle-section-header id="header" slot="header"><h2 id="heading" slot="heading">Runs</h2></ocelle-section-header></div>';
    await settled();
    const font = (): string => getComputedStyle(document.getElementById("heading") ?? document.body).fontSize;
    const header = document.getElementById("header");
    if (header === null) throw new Error("no #header");
    const seen = [font()];
    document.getElementById("card")?.append(header);
    await settled();
    seen.push(font());
    document.getElementById("outside")?.append(header);
    await settled();
    seen.push(font());
    expect(seen).toEqual([size("font-size-lg"), size("font-size-subhead"), size("font-size-lg")]);
  });
});
