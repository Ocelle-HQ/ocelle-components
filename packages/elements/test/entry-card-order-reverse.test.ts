import { describe, expect, it } from "vitest";
import { css } from "../../tokens/src/generate.ts";
import { source } from "../../tokens/src/source.ts";
import "../src/ocelle-section-header.ts";

// Definition order, the section header first (011 research.md R-05, contracts/checks.md § Pairing plants "Definition
// order changes nothing"; T014, the reverse of entry-card-order.test.ts): with only src/ocelle-section-header.ts
// imported, a compact card that is not yet defined is mounted with a section header in its header slot; the header
// renders first, with no slot assigned, at the regular size; then src/ocelle-card.ts is imported. The card's first
// slotchange asks the header to update, and it is drawn at --ocelle-font-size-subhead, the compact size, beside a
// header outside the card at --ocelle-font-size-lg. Plant: the card not notifying its headers on slotchange.
async function settled(): Promise<void> {
  const elements = [...document.querySelectorAll("ocelle-card, ocelle-section-header")] as unknown as { updateComplete?: Promise<unknown> }[];
  await Promise.all(elements.map((each) => each.updateComplete ?? Promise.resolve()));
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

describe("the section header defined before the card", () => {
  it("draws a header slotted into a compact card that is defined after it at the compact size once the card is defined", async () => {
    const tokens = new CSSStyleSheet();
    tokens.replaceSync(css(source).replace(/@font-face\s*\{[^}]*\}/g, ""));
    document.adoptedStyleSheets = [tokens];
    document.body.innerHTML =
      '<ocelle-card density="compact"><ocelle-section-header slot="header"><h2 id="in-card" slot="heading">Runs</h2></ocelle-section-header></ocelle-card>' +
      '<ocelle-section-header><h2 id="outside" slot="heading">Runs</h2></ocelle-section-header>';
    await settled();
    const font = (id: string): string => getComputedStyle(document.getElementById(id) ?? document.body).fontSize;
    const before = { defined: customElements.get("ocelle-card") !== undefined, inCard: font("in-card") };
    await import("../src/ocelle-card.ts");
    await settled();
    expect({ before, inCard: font("in-card"), outside: font("outside") }).toEqual({ before: { defined: false, inCard: size("font-size-lg") }, inCard: size("font-size-subhead"), outside: size("font-size-lg") });
  });
});
