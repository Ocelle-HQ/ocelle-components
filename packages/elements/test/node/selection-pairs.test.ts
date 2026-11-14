import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { listboxRows, optionRows, paintedTokens, selectionPairs, styleTemplate, tabPanelRows, tabRows, tabsRows } from "./selection-pairs-check.ts";
import type { PairEntry } from "./selection-pairs-check.ts";

// The listbox's colour pairs, and since phase 3 the tabs' (014 spec FR-058; research.md R-15, R-17; T018), on the element source: the colour tokens
// the style templates of `ocelle-option.ts` and `ocelle-listbox.ts` paint per role are exactly R-15's (the option's text
// `ink` and `disabled-ink`, fill `hover-bg`, bar `accent-strong`, ring `color-focus`; the listbox none), and every pair
// of R-15's rows is a `checked` row of packages/tokens/contrast/pairs.json in both themes (`disabled-ink` exempt). In
// the same test the check runs on a copy of pairs.json with the light `color-accent-strong` on `color-canvas` row
// removed and reports that pair, and on a stylesheet whose bar is `control-border` and reports the token. The built
// stylesheets are checked the same way in test/build/build.test.ts.
const read = (path: string): string => readFileSync(new URL(path, import.meta.url), "utf8");
const pairs = JSON.parse(read("../../../tokens/contrast/pairs.json")) as PairEntry[];
const withoutCanvasBar = pairs.filter((entry) => !(entry.theme === "light" && entry.fg === "color-accent-strong" && entry.bg === "color-canvas"));

describe("the listbox's and the tabs' colour pairs (FR-058, R-15, R-17)", () => {
  it("ocelle-option paints exactly R-15's tokens per role, every R-15 pair checked in pairs.json, and the planted copy without the light canvas bar row reports it", () => {
    const option = styleTemplate(read("../../src/ocelle-option.ts"));
    expect(selectionPairs(option, optionRows.pairs, pairs)).toEqual({ painted: optionRows.painted, missing: [] });
    expect(selectionPairs(option, optionRows.pairs, withoutCanvasBar)).toEqual({ painted: optionRows.painted, missing: ["color-accent-strong on color-canvas in light"] });
  });

  it("ocelle-listbox paints no colour token of its own", () => {
    const listbox = styleTemplate(read("../../src/ocelle-listbox.ts"));
    expect(listbox).not.toBe("");
    expect(selectionPairs(listbox, listboxRows.pairs, pairs)).toEqual({ painted: listboxRows.painted, missing: [] });
  });

  it("ocelle-tab paints exactly R-15's tokens per role, every R-15 pair checked in pairs.json, and the planted copy without the light canvas bar row reports it (014 phase 3)", () => {
    const tab = styleTemplate(read("../../src/ocelle-tab.ts"));
    expect(selectionPairs(tab, tabRows.pairs, pairs)).toEqual({ painted: tabRows.painted, missing: [] });
    expect(selectionPairs(tab, tabRows.pairs, withoutCanvasBar)).toEqual({ painted: tabRows.painted, missing: ["color-accent-strong on color-canvas in light"] });
  });

  it("ocelle-tab-panel paints only its focus outline in color-focus, every pair checked; ocelle-tabs paints no colour token of its own (014 phase 3)", () => {
    const panel = styleTemplate(read("../../src/ocelle-tab-panel.ts"));
    const tabs = styleTemplate(read("../../src/ocelle-tabs.ts"));
    expect({ panelSheet: panel !== "", tabsSheet: tabs !== "" }).toEqual({ panelSheet: true, tabsSheet: true });
    expect(selectionPairs(panel, tabPanelRows.pairs, pairs)).toEqual({ painted: tabPanelRows.painted, missing: [] });
    expect(selectionPairs(tabs, tabsRows.pairs, pairs)).toEqual({ painted: tabsRows.painted, missing: [] });
  });

  it("reads the roles from a stylesheet: a bar in control-border is reported in the bar role, forced-colours rules are not read", () => {
    const planted = ":host { color: var(--ocelle-color-ink); } :host(:hover) { background: var(--ocelle-color-hover-bg); } :host::before { background: var(--ocelle-color-control-border); } :host::after { border: 3px solid var(--ocelle-color-focus); } [part=list] { outline: 1px solid var(--ocelle-color-rule); } @media (forced-colors: active) { :host::before { background: var(--ocelle-color-accent); } }";
    expect(paintedTokens(planted)).toEqual({ text: ["color-ink"], fill: ["color-hover-bg"], bar: ["color-control-border"], ring: ["color-focus"], line: ["color-rule"] });
  });
});
