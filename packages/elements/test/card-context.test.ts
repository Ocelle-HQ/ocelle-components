import { afterEach, describe, expect, it } from "vitest";
import { inCompactCardHeader, notifyHeaders } from "../src/card-context.ts";

// The card context (011 research.md R-05, FR-017; T010) on stand-in elements of this file's own iframe: an
// `ocelle-card` whose open shadow root holds a slot named `header` and a default slot, as the card's does, an
// `ocelle-other` with the same shadow root, and, defined after one header element is created, an `ocelle-section-header` that
// counts the `requestUpdate()` calls it receives. The module matches both by local name, so the stand-ins are what the
// real elements are to it; the real card and header are not imported here.
class StandInCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = '<slot name="header"></slot><slot></slot>';
  }
}

class StandInOther extends StandInCard {}

class StandInHeader extends HTMLElement {
  updates = 0;

  requestUpdate(): void {
    this.updates += 1;
  }
}

customElements.define("ocelle-card", StandInCard);
customElements.define("ocelle-other", StandInOther);
// Created before its tag is defined and never connected, so it stays a header that is not upgraded.
const early = document.createElement("ocelle-section-header");
customElements.define("ocelle-section-header", StandInHeader);

/** A new `ocelle-section-header`: an upgraded stand-in, since the tag is defined. */
function standIn(): StandInHeader {
  const made: Element = document.createElement("ocelle-section-header");
  return made as StandInHeader;
}

afterEach(() => {
  document.body.replaceChildren();
});

function byId(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`no #${id}`);
  return found;
}

function headerSlot(card: Element): HTMLSlotElement {
  const slot = card.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="header"]');
  if (slot === null || slot === undefined) throw new Error("no header slot");
  return slot;
}

describe("inCompactCardHeader(header) (R-05)", () => {
  it('is true for an element assigned to the header slot of an ocelle-card with density="compact", and false for the same card with density "", "bogus", "regular" or none', () => {
    document.body.innerHTML = ["compact", "", "bogus", "regular", null]
      .map((density, index) => `<ocelle-card${density === null ? "" : ` density="${density}"`}><span id="h${String(index)}" slot="header">Runs</span></ocelle-card>`)
      .join("");
    expect([0, 1, 2, 3, 4].map((index) => inCompactCardHeader(byId(`h${String(index)}`)))).toEqual([true, false, false, false, false]);
  });

  it("is false for an element in a compact card's body, inside a div in its header slot, in an inner card's header slot, outside any card, and in the header slot of another element", () => {
    document.body.innerHTML =
      '<ocelle-card id="outer" density="compact"><span id="direct" slot="header">Runs</span><div slot="header"><span id="nested">Runs</span></div>' +
      '<span id="body">Runs</span><ocelle-card id="inner"><span id="inner-header" slot="header">Runs</span></ocelle-card></ocelle-card>' +
      '<span id="outside">Runs</span><ocelle-other density="compact"><span id="other" slot="header">Runs</span></ocelle-other>';
    expect(Object.fromEntries(["direct", "nested", "body", "inner-header", "outside", "other"].map((id) => [id, inCompactCardHeader(byId(id))]))).toEqual({
      direct: true,
      nested: false,
      body: false,
      "inner-header": false,
      outside: false,
      other: false,
    });
  });

  it("follows the card's density attribute and the element's slot attribute as they change", () => {
    document.body.innerHTML = '<ocelle-card id="card"><span id="header" slot="header">Runs</span></ocelle-card>';
    const card = byId("card");
    const header = byId("header");
    const seen = [inCompactCardHeader(header)];
    card.setAttribute("density", "compact");
    seen.push(inCompactCardHeader(header));
    header.removeAttribute("slot");
    seen.push(inCompactCardHeader(header));
    header.setAttribute("slot", "header");
    seen.push(inCompactCardHeader(header));
    card.removeAttribute("density");
    seen.push(inCompactCardHeader(header));
    expect(seen).toEqual([false, true, false, true, false]);
  });
});

describe("notifyHeaders(slot, previous) (R-05)", () => {
  it("asks each upgraded ocelle-section-header assigned to the slot to update once, skips one not yet upgraded and other elements, and returns the assigned ocelle-section-header elements in slot order", () => {
    const card = document.createElement("ocelle-card");
    early.slot = "header";
    card.append(early);
    const late = standIn();
    late.slot = "header";
    const other = document.createElement("div");
    other.slot = "header";
    const body = standIn();
    card.append(other, late, body);
    const returned = notifyHeaders(headerSlot(card), []);
    expect({
      returned: returned.map((element) => (element === early ? "early" : element === late ? "late" : element.localName)),
      upgraded: [early instanceof StandInHeader, late instanceof StandInHeader],
      updates: { late: late.updates, body: body.updates },
    }).toEqual({ returned: ["early", "late"], upgraded: [false, true], updates: { late: 1, body: 0 } });
  });

  it("also asks the headers of previous that have left the slot to update, each header once when it is in both, and returns only the assigned ones", () => {
    document.body.innerHTML =
      '<ocelle-card id="card"><ocelle-section-header id="stays" slot="header"></ocelle-section-header><ocelle-section-header id="left"></ocelle-section-header></ocelle-card><ocelle-section-header id="moved"></ocelle-section-header>';
    const [stays, left, moved] = ["stays", "left", "moved"].map((id) => byId(id) as StandInHeader) as [StandInHeader, StandInHeader, StandInHeader];
    const returned = notifyHeaders(headerSlot(byId("card")), [stays, left, moved]);
    expect({ returned: returned.map((element) => element.id), updates: [stays.updates, left.updates, moved.updates] }).toEqual({ returned: ["stays"], updates: [1, 1, 1] });
  });

  it("returns an empty list and asks nothing of an empty slot with no previous headers, and of an empty slot only its previous headers", () => {
    document.body.innerHTML = '<ocelle-card id="card"></ocelle-card><ocelle-section-header id="gone"></ocelle-section-header>';
    const gone = byId("gone") as StandInHeader;
    const none = notifyHeaders(headerSlot(byId("card")), []);
    const updatesBefore = gone.updates;
    const again = notifyHeaders(headerSlot(byId("card")), [gone]);
    expect({ none, again, updates: [updatesBefore, gone.updates] }).toEqual({ none: [], again: [], updates: [0, 1] });
  });
});
