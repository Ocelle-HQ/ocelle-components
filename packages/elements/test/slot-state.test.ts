import { LitElement, css, html } from "lit";
import { afterEach, describe, expect, it } from "vitest";
import { SlotState } from "../src/slot-state.ts";

// The slot-state controller (011 research.md R-03, FR-005, T003) on a test host: a Lit element whose shadow root holds
// a default slot and a slot named `aside`, each in a wrapper that takes the class `empty` while the controller reads
// its slot as empty, as the elements of this feature will. A slot is empty when no element is assigned to it and every
// assigned text node is empty or whitespace only (spec "Empty slot"). The host counts its updates, so a test can see
// that a change which leaves every slot's state as it was asks for none.
class SlotStateHost extends LitElement {
  static override styles = css`
    .empty {
      display: none;
    }
  `;

  readonly slots = new SlotState(this);
  updates = 0;

  protected override render(): unknown {
    return html`<div class=${this.slots.empty("") ? "body empty" : "body"}><slot></slot></div><div class=${this.slots.empty("aside") ? "aside empty" : "aside"}><slot name="aside"></slot></div>`;
  }

  protected override updated(): void {
    this.updates += 1;
  }
}

customElements.define("ocelle-slot-state-host", SlotStateHost);

/** The empty state of each wrapper, read from its class. */
interface Wrappers {
  readonly body: boolean;
  readonly aside: boolean;
}

function host(): SlotStateHost {
  const found = document.querySelector("ocelle-slot-state-host");
  if (found === null) throw new Error("no ocelle-slot-state-host on the page");
  return found as SlotStateHost;
}

function wrappers(of: SlotStateHost = host()): Wrappers {
  const empty = (name: string): boolean => of.renderRoot.querySelector(`.${name}`)?.classList.contains("empty") ?? false;
  return { body: empty("body"), aside: empty("aside") };
}

/** Waits for the slot change and text-data records of the last DOM change to be delivered, then for every update. */
async function settled(of: SlotStateHost = host()): Promise<void> {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  let done = await of.updateComplete;
  while (!done) done = await of.updateComplete;
}

async function mount(markup: string): Promise<SlotStateHost> {
  document.body.innerHTML = `<ocelle-slot-state-host>${markup}</ocelle-slot-state-host>`;
  await settled();
  return host();
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("SlotState: what counts as empty (R-03)", () => {
  it("reads both slots empty with no assigned node, and an assigned element makes its own slot not empty", async () => {
    const bare = wrappers(await mount(""));
    const filled = wrappers(await mount('<span>Body</span><span slot="aside">Aside</span>'));
    expect({ bare, filled }).toEqual({ bare: { body: true, aside: true }, filled: { body: false, aside: false } });
  });

  it("reads the default slot empty with only empty or whitespace-only text nodes assigned, and not empty with a non-whitespace one", async () => {
    const whitespace = wrappers(await mount(" \n\t  "));
    const element = await mount("");
    element.append(document.createTextNode(""), document.createTextNode("  "));
    await settled();
    const blank = wrappers();
    const text = wrappers(await mount("  Body  "));
    expect({ whitespace, blank, text }).toEqual({
      whitespace: { body: true, aside: true },
      blank: { body: true, aside: true },
      text: { body: false, aside: true },
    });
  });

  it("reads a slot with a hidden element assigned as not empty, also between whitespace text nodes, beside the other slot read empty", async () => {
    expect({
      body: wrappers(await mount("\n  <p hidden>Draft</p>\n  ")),
      aside: wrappers(await mount('<p slot="aside" hidden>Draft</p>')),
    }).toEqual({ body: { body: false, aside: true }, aside: { body: true, aside: false } });
  });

  it("reads an empty element as content: an element assigned makes the slot not empty whatever it holds", async () => {
    expect({
      body: wrappers(await mount("<span></span>")),
      aside: wrappers(await mount('<span slot="aside"> </span>')),
    }).toEqual({ body: { body: false, aside: true }, aside: { body: true, aside: false } });
  });
});

describe("SlotState: the state follows the light DOM (R-03)", () => {
  it("follows an element appended to and removed from each slot", async () => {
    const element = await mount("");
    const body = document.createElement("span");
    const aside = document.createElement("span");
    aside.slot = "aside";
    element.append(body);
    await settled();
    const bodyAdded = wrappers();
    element.append(aside);
    await settled();
    const asideAdded = wrappers();
    body.remove();
    await settled();
    const bodyRemoved = wrappers();
    aside.remove();
    await settled();
    expect({ bodyAdded, asideAdded, bodyRemoved, asideRemoved: wrappers() }).toEqual({
      bodyAdded: { body: false, aside: true },
      asideAdded: { body: false, aside: false },
      bodyRemoved: { body: true, aside: false },
      asideRemoved: { body: true, aside: true },
    });
  });

  it("follows the slot attribute of an assigned element changed, set and removed", async () => {
    await mount('<span id="moved">Moved</span>');
    const moved = document.getElementById("moved");
    if (moved === null) throw new Error("no #moved");
    const before = wrappers();
    moved.slot = "aside";
    await settled();
    const toAside = wrappers();
    moved.slot = "elsewhere";
    await settled();
    const toNowhere = wrappers();
    moved.removeAttribute("slot");
    await settled();
    expect({ before, toAside, toNowhere, back: wrappers() }).toEqual({
      before: { body: false, aside: true },
      toAside: { body: true, aside: false },
      toNowhere: { body: true, aside: true },
      back: { body: false, aside: true },
    });
  });

  it("follows an assigned text node's data changed from whitespace to text and back, which fires no slotchange", async () => {
    const element = await mount("   ");
    const text = element.firstChild as Text;
    const slot = element.renderRoot.querySelector("slot:not([name])");
    let slotchanges = 0;
    slot?.addEventListener("slotchange", () => {
      slotchanges += 1;
    });
    const before = wrappers();
    text.data = "Body";
    await settled();
    const toText = wrappers();
    text.data = " \n ";
    await settled();
    const toWhitespace = wrappers();
    text.data = "Again";
    await settled();
    expect({ before, toText, toWhitespace, again: wrappers(), slotchanges }).toEqual({
      before: { body: true, aside: true },
      toText: { body: false, aside: true },
      toWhitespace: { body: true, aside: true },
      again: { body: false, aside: true },
      slotchanges: 0,
    });
  });

  it("asks for an update when a slot's state changes and for none when a change leaves every state as it was", async () => {
    const element = await mount("Body");
    const text = element.firstChild as Text;
    const start = element.updates;
    text.data = "Other body";
    await settled();
    const unchanged = element.updates - start;
    text.data = "  ";
    await settled();
    expect({ unchanged, changed: element.updates - start, body: wrappers().body }).toEqual({ unchanged: 0, changed: 1, body: true });
  });

  it("keeps each host's state its own: content in one host leaves another host's slots empty", async () => {
    document.body.innerHTML = '<ocelle-slot-state-host id="one">One</ocelle-slot-state-host><ocelle-slot-state-host id="two"></ocelle-slot-state-host>';
    const one = document.getElementById("one") as SlotStateHost;
    const two = document.getElementById("two") as SlotStateHost;
    await settled(one);
    await settled(two);
    expect({ one: wrappers(one), two: wrappers(two) }).toEqual({ one: { body: false, aside: true }, two: { body: true, aside: true } });
  });

  it("keeps following the light DOM after the host is moved to another place on the page", async () => {
    document.body.innerHTML = '<div id="first"><ocelle-slot-state-host>Body</ocelle-slot-state-host></div><div id="second"></div>';
    await settled();
    const element = host();
    document.getElementById("second")?.append(element);
    await settled();
    const moved = wrappers();
    (element.firstChild as Text).data = " ";
    await settled();
    const blank = wrappers();
    element.append(Object.assign(document.createElement("span"), { slot: "aside" }));
    await settled();
    expect({ moved, blank, aside: wrappers() }).toEqual({
      moved: { body: false, aside: true },
      blank: { body: true, aside: true },
      aside: { body: true, aside: false },
    });
  });
});

describe("SlotState: the first render (R-03)", () => {
  it("sets the empty class on an empty slot's wrapper once updateComplete resolves after the first render", async () => {
    document.body.innerHTML = "<ocelle-slot-state-host>   </ocelle-slot-state-host>";
    await host().updateComplete;
    const first = wrappers();
    const box = host().renderRoot.querySelector(".body")?.getBoundingClientRect();
    expect({ first, height: box?.height }).toEqual({ first: { body: true, aside: true }, height: 0 });
  });

  it("clears the empty class of a slot with content once the host has settled after the first render", async () => {
    document.body.innerHTML = "<ocelle-slot-state-host><span>Body</span></ocelle-slot-state-host>";
    await settled();
    const box = host().renderRoot.querySelector(".body")?.getBoundingClientRect();
    expect({ wrappers: wrappers(), shown: (box?.height ?? 0) > 0 }).toEqual({ wrappers: { body: false, aside: true }, shown: true });
  });
});
