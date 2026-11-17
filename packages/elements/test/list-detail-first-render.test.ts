import { describe, expect, it } from "vitest";
import "../src/ocelle-list-detail.ts";
import { inProcessDriver } from "./in-process.ts";

// The first render of `ocelle-list-detail` brings no second update (phase 4's review round 3, R3-03), in process and
// in a file of its own: Lit's development build, which Vite resolves here, warns once per class when an update is
// requested inside an update (its "change-in-update" warning), so only the first list-detail rendered in a test file's
// iframe can show it, and this file renders no other before this case. Before the fix, the first render observed the
// slots in `firstUpdated` and requested an update whether or not the inspector's presence had changed.
const driver = inProcessDriver();

describe("ocelle-list-detail's first render", () => {
  it("review R3-03: the first render of a list-detail with three panes in Frame R requests no second update, so the console reports nothing and the layout is three columns", async () => {
    await driver.viewport(1280, 800);
    await driver.mount('<div data-frame="R"><ocelle-list-detail id="f"><div slot="list"><p>List</p></div><div><p>Detail</p></div><div slot="inspector"><p>Inspector</p></div></ocelle-list-detail></div>');
    const tier = document.getElementById("f")?.shadowRoot?.querySelector(".grid")?.getAttribute("data-tier");
    expect({ tier, messages: await driver.messages() }).toEqual({ tier: "three", messages: [] });
  });
});
