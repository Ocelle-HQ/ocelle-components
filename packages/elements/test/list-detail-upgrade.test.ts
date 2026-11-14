import { describe, expect, it } from "vitest";
import { inProcessDriver } from "./in-process.ts";

// The upgrade rule of `ocelle-list-detail` (009 FR-028, Edge Cases "`detail-open` before the element upgrades";
// research.md R-14, PLAN-TESTABILITY-1-007; T049), in process so Stryker mutates the first-render branch: server-
// rendered markup of a one-column list-detail with `detail-open` in Frame N (636 px at a 720 px viewport) is mounted
// before the element is defined, focus is put in a pane of the plain light DOM, and then the element is defined, so it
// upgrades in place with focus inside it. The first case dynamic-imports src/ocelle-list-detail.ts (this file's own
// iframe and registry hold nothing else). The other cases need an upgrade of their own after that import, so they
// define a subclass of the element under a test tag, which runs the same first render. Focus inside the list, which
// the first layout hides, moves to the detail pane; focus in the detail, which stays shown, and focus outside the
// element are not moved. test/browser/list-detail.test.ts checks the first two cases on built output.
const driver = inProcessDriver();

/** Server-rendered markup of a list-detail with `detail-open`, as the tag `tag` with id `id`, in Frame N. */
const markup = (tag: string, id: string): string =>
  `<button id="before" type="button">before</button><div data-frame="N"><${tag} id="${id}" detail-open><div slot="list"><p>Records</p><button id="${id}-l0" type="button">Record WP-01</button></div><div><p>Detail of WP-01</p><button id="${id}-d0" type="button">Edit</button></div><div slot="inspector"><p>Inspector of WP-01</p></div></${tag}></div>`;

/** The deep active element, each level as its id or its local name and classes, joined by " >> ". */
function active(): string {
  const levels: string[] = [];
  let at: Element | null = document.activeElement;
  while (at !== null) {
    levels.push(at.id !== "" ? at.id : [at.localName, ...at.classList].join("."));
    at = at.shadowRoot?.activeElement ?? null;
  }
  return levels.join(" >> ");
}

/** The computed display of a pane wrapper of the element with `id`, or "absent". */
function display(id: string, pane: string): string {
  const wrapper = document.getElementById(id)?.shadowRoot?.querySelector(`.pane.${pane}`);
  return wrapper === null || wrapper === undefined ? "absent" : getComputedStyle(wrapper).display;
}

/** Mounts the markup at Frame N's viewport and focuses `focus` by script. */
async function mounted(tag: string, id: string, focus: string): Promise<string> {
  await driver.viewport(720, 800);
  await driver.mount(markup(tag, id));
  document.getElementById(focus)?.focus();
  return active();
}

describe("ocelle-list-detail at upgrade (R-14)", () => {
  it("with focus inside the list of the un-upgraded element, defining it by importing its module shows the detail and moves focus to the detail pane, which holds it by script with tabindex -1", async () => {
    const before = await mounted("ocelle-list-detail", "u", "u-l0");
    await import("../src/ocelle-list-detail.ts");
    await driver.settle();
    const tabindex = document.getElementById("u")?.shadowRoot?.querySelector(".pane.detail")?.getAttribute("tabindex");
    expect({ before, after: active(), list: display("u", "list"), detail: display("u", "detail"), tabindex }).toEqual({ before: "u-l0", after: "u >> div.pane.detail", list: "none", detail: "block", tabindex: "-1" });
  });

  it("with focus inside the detail, which the first layout shows, upgrading moves no focus", async () => {
    const { OcelleListDetail } = await import("../src/ocelle-list-detail.ts");
    const before = await mounted("test-list-detail-shown", "s", "s-d0");
    customElements.define("test-list-detail-shown", class extends OcelleListDetail {});
    await driver.settle();
    expect({ before, after: active(), list: display("s", "list"), detail: display("s", "detail") }).toEqual({ before: "s-d0", after: "s-d0", list: "none", detail: "block" });
  });

  it("with focus outside the element, upgrading moves no focus", async () => {
    const { OcelleListDetail } = await import("../src/ocelle-list-detail.ts");
    const before = await mounted("test-list-detail-outside", "o", "before");
    customElements.define("test-list-detail-outside", class extends OcelleListDetail {});
    await driver.settle();
    expect({ before, after: active(), list: display("o", "list"), detail: display("o", "detail") }).toEqual({ before: "before", after: "before", list: "none", detail: "block" });
  });
});
