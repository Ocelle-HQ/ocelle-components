import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";

// The `axStates(target, scope)` browser command (014 research.md R-11, PLAN-TESTABILITY-1-014, T004): the unignored
// accessibility nodes of a target with the states Chromium reports for them (`selected`, `pressed`, `disabled`,
// `orientation`, `live`, `controls` as the controlled nodes' roles and names), read from the full tree of this test's
// frame, on a fixed page of native controls with known states. Mission 005's `axTree` keeps exactly `{ role, name }`
// for the same nodes, so its expectations (commands.test.ts) stay as they are.
afterEach(() => {
  document.body.replaceChildren();
});

describe("axStates(target, scope)", () => {
  it("gives a native listbox's orientation and, through its subtree, each option's selected and disabled states", async () => {
    document.body.innerHTML = '<select id="s" size="3" aria-label="Fruit"><option>Apple</option><option selected>Pear</option><option disabled>Plum</option></select>';
    expect(await commands.axStates("s", "subtree")).toEqual([
      { role: "listbox", name: "Fruit", orientation: "vertical" },
      { role: "option", name: "Apple", selected: false },
      { role: "option", name: "Pear", selected: true },
      { role: "option", name: "Plum", disabled: true },
    ]);
  });

  it("addresses a child of a parent: the second option of the listbox", async () => {
    document.body.innerHTML = '<select id="s" size="3" aria-label="Fruit"><option>Apple</option><option selected>Pear</option><option>Plum</option></select>';
    expect(await commands.axStates({ parent: "s", kind: "option", index: 1 })).toEqual([{ role: "option", name: "Pear", selected: true }]);
  });

  it("gives pressed as true, false or mixed, and disabled, for toggle buttons", async () => {
    document.body.innerHTML =
      '<button id="on" aria-pressed="true">Bold</button><button id="off" aria-pressed="false">Italic</button><button id="mixed" aria-pressed="mixed">Mixed</button><button id="no" disabled>Off</button>';
    expect({
      on: await commands.axStates("on"),
      off: await commands.axStates("off"),
      mixed: await commands.axStates("mixed"),
      no: await commands.axStates("no"),
    }).toEqual({
      on: [{ role: "button", name: "Bold", pressed: true }],
      off: [{ role: "button", name: "Italic", pressed: false }],
      mixed: [{ role: "button", name: "Mixed", pressed: "mixed" }],
      no: [{ role: "button", name: "Off", disabled: true }],
    });
  });

  it("maps aria-controls to the controlled node's role and name, and gives a tablist's orientation and a status's live value", async () => {
    document.body.innerHTML =
      '<button id="c" aria-controls="panel">Show</button><div id="panel" role="region" aria-label="Panel">x</div>' +
      '<div id="tl" role="tablist" aria-label="Views" aria-orientation="vertical"></div><span id="st" role="status">Saved</span>';
    expect({ c: await commands.axStates("c"), tl: await commands.axStates("tl"), st: await commands.axStates("st") }).toEqual({
      c: [{ role: "button", name: "Show", controls: [{ role: "region", name: "Panel" }] }],
      tl: [{ role: "tablist", name: "Views", orientation: "vertical" }],
      st: [{ role: "status", name: "", live: "polite" }],
    });
  });

  it("leaves axTree's nodes exactly { role, name } for the same buttons", async () => {
    document.body.innerHTML = '<button id="on" aria-pressed="true">Bold</button><button id="c" aria-controls="panel" disabled>Show</button><div id="panel" role="region" aria-label="Panel">x</div>';
    expect({ on: await commands.axTree("on"), c: await commands.axTree("c"), states: await commands.axStates("on") }).toEqual({
      on: [{ role: "button", name: "Bold" }],
      c: [{ role: "button", name: "Show" }],
      states: [{ role: "button", name: "Bold", pressed: true }],
    });
  });
});
