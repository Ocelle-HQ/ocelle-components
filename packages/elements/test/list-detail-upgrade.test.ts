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
// element are not moved. Since phase 4's review round 1 (R1-01), focus in the inspector, which the first layout shows
// in Frame R (three columns) and in Frame N with `detail-open` (stacked under the detail), is not moved either.
// test/browser/list-detail.test.ts checks the first two cases and the two inspector cases on built output.
const driver = inProcessDriver();

/** Server-rendered markup of a list-detail with `detail-open`, as the tag `tag` with id `id`, in Frame N. */
const markup = (tag: string, id: string): string =>
  `<button id="before" type="button">before</button><div data-frame="N"><${tag} id="${id}" detail-open><div slot="list"><p>Records</p><button id="${id}-l0" type="button">Record WP-01</button></div><div><p>Detail of WP-01</p><button id="${id}-d0" type="button">Edit</button></div><div slot="inspector"><p>Inspector of WP-01</p><button id="${id}-i0" type="button">Assign</button></div></${tag}></div>`;

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

/** Mounts the markup at Frame N's viewport (or in Frame R at 1280 px) and focuses `focus` by script. */
async function mounted(tag: string, id: string, focus: string, frame: "N" | "R" = "N"): Promise<string> {
  await driver.viewport(frame === "N" ? 720 : 1280, 800);
  await driver.mount(markup(tag, id).replace('data-frame="N"', `data-frame="${frame}"`));
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

  // A guard added after the green implementation (the first render's own measurement, whose mutants survived the first
  // mutation run; reviews/phase-4/plants.md § Guards): the first layout is chosen from the element's size at upgrade.
  it("guard: in Frame R, where the first layout has three columns, focus inside the list is not moved at upgrade, detail-open or not", async () => {
    const { OcelleListDetail } = await import("../src/ocelle-list-detail.ts");
    const before = await mounted("test-list-detail-wide", "w", "w-l0", "R");
    customElements.define("test-list-detail-wide", class extends OcelleListDetail {});
    await driver.settle();
    expect({ before, after: active(), list: display("w", "list"), detail: display("w", "detail") }).toEqual({ before: "w-l0", after: "w-l0", list: "block", detail: "block" });
  });

  // Added in phase 4's review round 1 (R1-01), red before the fix: the first layout knows the inspector is present.
  it.each([
    { frame: "N" as const, tag: "test-list-detail-insp-open", id: "in", list: "none" },
    { frame: "R" as const, tag: "test-list-detail-insp-wide", id: "ir", list: "block" },
  ])("review R1-01: in Frame $frame, where the first layout shows the inspector, focus inside the inspector is not moved at upgrade", async ({ frame, tag, id, list }) => {
    const { OcelleListDetail } = await import("../src/ocelle-list-detail.ts");
    const before = await mounted(tag, id, `${id}-i0`, frame);
    customElements.define(tag, class extends OcelleListDetail {});
    await driver.settle();
    expect({ before, after: active(), list: display(id, "list"), detail: display(id, "detail"), inspector: display(id, "inspector") }).toEqual({ before: `${id}-i0`, after: `${id}-i0`, list, detail: "block", inspector: "block" });
  });
});
