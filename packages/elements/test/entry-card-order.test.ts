import { describe, expect, it } from "vitest";
import { css } from "../../tokens/src/generate.ts";
import { source } from "../../tokens/src/source.ts";
import "../src/ocelle-card.ts";

// Definition order, the card first (011 research.md R-05, contracts/checks.md § Pairing plants "Definition order
// changes nothing"; T014): with only src/ocelle-card.ts imported, a compact card is mounted with a section header in
// its header slot, which is not yet defined; then src/ocelle-section-header.ts is imported. The header, upgraded after
// the card's first slotchange, resolves its size in its own first update: it is drawn at --ocelle-font-size-subhead,
// the compact size, beside a header outside the card at --ocelle-font-size-lg. The reverse order is
// entry-card-order-reverse.test.ts: once defined, an element cannot be undefined in this file's iframe. Plant: the
// header resolving its size only in its constructor.
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

describe("the card defined before the section header", () => {
  it("draws a header slotted into a compact card before its definition at the compact size once it is defined", async () => {
    const tokens = new CSSStyleSheet();
    tokens.replaceSync(css(source).replace(/@font-face\s*\{[^}]*\}/g, ""));
    document.adoptedStyleSheets = [tokens];
    document.body.innerHTML =
      '<ocelle-card density="compact"><ocelle-section-header slot="header"><h2 id="in-card" slot="heading">Runs</h2></ocelle-section-header></ocelle-card>' +
      '<ocelle-section-header><h2 id="outside" slot="heading">Runs</h2></ocelle-section-header>';
    await settled();
    const before = { defined: customElements.get("ocelle-section-header") !== undefined };
    await import("../src/ocelle-section-header.ts");
    await settled();
    const font = (id: string): string => getComputedStyle(document.getElementById(id) ?? document.body).fontSize;
    expect({ before, inCard: font("in-card"), outside: font("outside") }).toEqual({ before: { defined: false }, inCard: size("font-size-subhead"), outside: size("font-size-lg") });
  });
});
