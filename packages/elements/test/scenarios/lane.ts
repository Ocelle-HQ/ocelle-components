// The shared bodies of User Story 2's browser scenarios for `ocelle-workflow-lane` (009 spec US2 scenarios 4 to 8, the
// Edge Case "Lane count updates", FR-017 to FR-021; contracts/elements.md § `ocelle-workflow-lane`; research.md R-09,
// R-10, R-17; T032). Each scenario sets its frame's viewport, observes the page through the driver and returns one
// observation; each harness asserts it equals the scenario's `expected`, written by hand from the spec and research:
// the token values of packages/tokens/test/expected.ts (`--ocelle-font-size-sm` 0.875rem, 14 px; `--ocelle-font-size-xs`
// 0.75rem, 12 px; `--ocelle-font-weight-strong` 600; `--ocelle-tracking-eyebrow` 0.08em, 0.96 px at 12 px;
// `--ocelle-radius-row` 6 px; `--ocelle-space-3` 12 px; the colours per theme) and research.md R-09's structure: the
// visible header is hidden from the tree (`aria-hidden="true"`, the lane's one hidden node) and holds the title and
// the count, `.title` and `.count`; the lane's group role and name are on a node of its shadow root. The visible text is
// the header's rendered text (`innerText`, so `text-transform` shows), and the names are read from the tree. Every
// "does not" outcome is observed in the same scenario as the positive outcome it guards, and the plant that makes it
// fail is named beside it (reviews/phase-3/plants.md, T044).
import type { Driver } from "./driver.ts";
import { tokenColour } from "./icon.ts";
import { board, lane, page, roles, widths } from "./board.ts";
import type { BoardScenario } from "./board.ts";
import { readOnce } from "./scroller.ts";

/** The family `--ocelle-font-sans` computes to (packages/tokens/test/expected.ts). */
const sans = '"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif';

/** The lane's visible header text, rendered (`innerText`), or null when the lane shows no header. */
export async function shownText(driver: Driver, id: string): Promise<string | null> {
  const header = (await driver.elements(id)).some((part) => part.attributes["aria-hidden"] === "true");
  return header ? readOnce(driver, { id, inner: '[aria-hidden="true"]' }, "innerText") : null;
}

/** The names of the text nodes of the lane's accessibility subtree, slotted content included. */
async function texts(driver: Driver, id: string): Promise<string[]> {
  return (await driver.axSubtree(id)).filter((node) => node.role === "StaticText").map((node) => node.name);
}

/** A lane with what it shows and its role nodes. */
async function laneState(driver: Driver, id: string): Promise<unknown> {
  return { shown: await shownText(driver, id), roles: await roles(driver, id) };
}

const named = (shown: string | null, name: string | null): unknown => ({ shown, roles: name === null ? [] : [{ role: "group", name }] });

/** Computed properties of a target, by name. */
async function styleOf(driver: Driver, target: string | { readonly id: string; readonly inner: string }, properties: readonly string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const property of properties) out[property] = await driver.computed(target, property);
  return out;
}

const typeProperties = ["font-family", "font-size", "font-weight", "color", "font-variant-numeric", "text-transform", "letter-spacing"];

/** US2-4 in one theme: the default lane's chrome, its ground against the four main grounds, and its title and count. */
async function chrome(driver: Driver, theme: "light" | "dark"): Promise<unknown> {
  await page(driver, "W", `<div data-frame="W">${lane("d", ' label="Ready" count="3"')}</div>`);
  await driver.theme(theme);
  const ground = await driver.computed("d", "background-color");
  const differs: Record<string, boolean> = {};
  for (const other of ["canvas", "panel", "inspector", "pane"]) differs[other] = ground !== (await driver.resolveColour(`var(--ocelle-color-${other})`));
  return {
    ground,
    differs,
    box: await styleOf(driver, "d", ["border-top-left-radius", "border-bottom-right-radius", "padding-top", "padding-left"]),
    title: await styleOf(driver, { id: "d", inner: ".title" }, typeProperties),
    count: await styleOf(driver, { id: "d", inner: ".count" }, ["color", "font-variant-numeric", "font-family"]),
  };
}

function chromeExpected(theme: "light" | "dark"): unknown {
  return {
    ground: tokenColour("color-sheet", theme),
    differs: { canvas: true, panel: true, inspector: true, pane: true },
    box: { "border-top-left-radius": "6px", "border-bottom-right-radius": "6px", "padding-top": "12px", "padding-left": "12px" },
    title: { "font-family": sans, "font-size": "14px", "font-weight": "600", color: tokenColour("color-ink", theme), "font-variant-numeric": "normal", "text-transform": "none", "letter-spacing": "normal" },
    count: { color: tokenColour("color-ink-muted", theme), "font-variant-numeric": "tabular-nums", "font-family": sans },
  };
}

/** US2-7 in one theme: the flat lane's box, its title and count styles, what it shows and its tree. */
async function flat(driver: Driver, theme: "light" | "dark"): Promise<unknown> {
  await page(driver, "W", `<div data-frame="W">${lane("f", ' label="Ready" count="3" variant="flat"')}</div>`);
  await driver.theme(theme);
  return {
    box: await styleOf(driver, "f", ["background-color", "border-top-left-radius", "padding-top", "padding-left"]),
    title: await styleOf(driver, { id: "f", inner: ".title" }, typeProperties),
    count: await styleOf(driver, { id: "f", inner: ".count" }, typeProperties),
    variant: await driver.attribute("f", "variant"),
    ...((await laneState(driver, "f")) as object),
  };
}

function flatExpected(theme: "light" | "dark"): unknown {
  const type = {
    "font-family": sans,
    "font-size": "12px",
    "font-weight": "600",
    color: tokenColour("color-ink-soft", theme),
    "font-variant-numeric": "tabular-nums",
    "text-transform": "uppercase",
    "letter-spacing": "0.96px",
  };
  return {
    box: { "background-color": "rgba(0, 0, 0, 0)", "border-top-left-radius": "0px", "padding-top": "0px", "padding-left": "0px" },
    title: type,
    count: type,
    variant: "flat",
    shown: "READY 3",
    roles: [{ role: "group", name: "Ready, 3" }],
  };
}

export const laneScenarios: readonly BoardScenario[] = [
  ...(["light", "dark"] as const).map(
    (theme): BoardScenario => ({
      // Plant: the lane's ground set to `--ocelle-color-panel` (it then matches the canvas, panel and inspector; R-10).
      name: `US2-4 in ${theme}: a default lane has a color-sheet ground that differs from color-canvas, color-panel, color-inspector and color-pane, 6 px corners and 12 px padding; its title is 14 px at weight 600 in color-ink in the sans, and its count follows in color-ink-muted with tabular figures (FR-017, R-10)`,
      base: false,
      run: (driver) => chrome(driver, theme),
      expected: chromeExpected(theme),
    }),
  ),
  {
    // Plant: the visible title not hidden from the tree ("Ready" and "3" are then read again inside the group).
    name: 'US2-5: <ocelle-workflow-lane label="Ready" count="3"> is exactly one group named "Ready, 3" holding the slotted content, and its visible title and count add no text to the tree; with count-label="3 work packages" the group is named "Ready, 3 work packages" and the count still shows 3 (FR-019, SC-004)',
    base: false,
    run: async (driver) => {
      await page(
        driver,
        "W",
        `<div data-frame="W">${lane("l", ' label="Ready" count="3"', '<p id="c1">Card text</p>')}${lane("w", ' label="Ready" count="3" count-label="3 work packages"', '<p id="c2">Card text</p>')}</div>`,
      );
      return {
        l: { ...((await laneState(driver, "l")) as object), texts: await texts(driver, "l") },
        w: { ...((await laneState(driver, "w")) as object), texts: await texts(driver, "w") },
      };
    },
    expected: {
      l: { shown: "Ready 3", roles: [{ role: "group", name: "Ready, 3" }], texts: ["Card text"] },
      w: { shown: "Ready 3", roles: [{ role: "group", name: "Ready, 3 work packages" }], texts: ["Card text"] },
    },
  },
  {
    // Plants: the count rendered as "0" when absent (the lanes without a valid count then show "0" and are named
    // "Ready, 0"); the group role and the ", " separator always applied (the untitled lane without a count is then a
    // group, and the untitled lane with a count is named ", 3").
    name: "US2-6: every count and title case of the spec: an absent or invalid count shows no count and names the group by the title with no comma, 0 shows and is named, a padded or zero-led count shows 3, an untitled lane with a count is a group named by it with no comma, an untitled lane without a count has no role and no name, a title is trimmed, and a host aria-label names the group alone while a blank one counts as absent (FR-018, FR-019)",
    base: false,
    run: async (driver) => {
      const cases: readonly (readonly [string, string])[] = [
        ["none", ' label="Ready"'],
        ["minus", ' label="Ready" count="-1"'],
        ["decimal", ' label="Ready" count="2.5"'],
        ["letters", ' label="Ready" count="abc"'],
        ["plus", ' label="Ready" count="+3"'],
        ["point", ' label="Ready" count="3.0"'],
        ["exponent", ' label="Ready" count="3e0"'],
        ["empty", ' label="Ready" count=""'],
        ["zero", ' label="Ready" count="0"'],
        ["padded", ' label="Ready" count=" 3 "'],
        ["leading", ' label="Ready" count="03"'],
        ["untitled", ' count="3"'],
        ["emptyTitle", ' label="" count="3"'],
        ["blankTitle", ' label="  " count="3"'],
        ["untitledLabelled", ' count="3" count-label="3 work packages"'],
        ["bare", ""],
        ["trimmed", ' label=" Ready " count="3"'],
        ["host", ' aria-label="Ready column" label="Ready" count="3"'],
        ["hostBare", ' aria-label="Ready column"'],
        ["blankHost", ' aria-label=" " label="Ready" count="3"'],
        ["blankHostBare", ' aria-label=" "'],
        ["property", ' label="Ready" count="3"'],
      ];
      await page(driver, "W", `<div data-frame="W">${cases.map(([id, attributes]) => lane(id, attributes, `<p id="${id}-card">Card text</p>`)).join("")}</div>`);
      await driver.setProperty("property", "count", undefined);
      const observed: Record<string, unknown> = {};
      for (const [id] of cases) observed[id] = await laneState(driver, id);
      return observed;
    },
    expected: {
      none: named("Ready", "Ready"),
      minus: named("Ready", "Ready"),
      decimal: named("Ready", "Ready"),
      letters: named("Ready", "Ready"),
      plus: named("Ready", "Ready"),
      point: named("Ready", "Ready"),
      exponent: named("Ready", "Ready"),
      empty: named("Ready", "Ready"),
      zero: named("Ready 0", "Ready, 0"),
      padded: named("Ready 3", "Ready, 3"),
      leading: named("Ready 3", "Ready, 3"),
      untitled: named("3", "3"),
      emptyTitle: named("3", "3"),
      blankTitle: named("3", "3"),
      untitledLabelled: named("3", "3 work packages"),
      bare: named(null, null),
      trimmed: named("Ready 3", "Ready, 3"),
      host: named("Ready 3", "Ready column"),
      hostBare: named(null, "Ready column"),
      blankHost: named("Ready 3", "Ready, 3"),
      blankHostBare: named(null, null),
      property: named("Ready", "Ready"),
    },
  },
  ...(["light", "dark"] as const).map(
    (theme): BoardScenario => ({
      name: `US2-7 in ${theme}: a flat lane has no ground, corners or padding; its title and count are 12 px uppercase at weight 600 in color-ink-soft, spaced by --ocelle-tracking-eyebrow, in the sans with tabular figures, never monospace; variant is reflected and the tree is the default lane's (FR-017, FR-021)`,
      base: false,
      run: (driver) => flat(driver, theme),
      expected: flatExpected(theme),
    }),
  ),
  {
    name: "US2-8: a title longer than its lane wraps between words, a single long word breaks inside the lane, the lanes keep their equal shares and the count stays visible inside the lane (FR-020)",
    base: false,
    run: async (driver) => {
      await page(
        driver,
        "W",
        board(
          "b",
          [
            lane("w0", ' label="Waiting for review by the operator and the squad" count="3"'),
            lane("w1", ' label="Pneumonoultramicroscopicsilicovolcanoconiosis" count="4"'),
            lane("w2", ' label="Ready" count="1"'),
            lane("w3", ' label="In review" count="2"'),
            lane("w4", ' label="Done" count="5"'),
          ].join(""),
        ),
      );
      const wraps = async (id: string): Promise<unknown> => {
        const box = await driver.box(id);
        const title = await driver.box(id, ".title");
        const count = await driver.box(id, ".count");
        const content = { left: box.x + 12 - 0.5, right: box.x + box.width - 12 + 0.5 };
        return {
          wrapped: title.height > count.height * 1.5,
          titleInside: title.x >= content.left && title.x + title.width <= content.right,
          countInside: count.width > 0 && count.x >= content.left && count.x + count.width <= content.right,
        };
      };
      return { lanes: await widths(driver, ["w0", "w1", "w2", "w3", "w4"]), words: await wraps("w0"), word: await wraps("w1") };
    },
    expected: {
      lanes: { widths: [164, 164, 164, 164, 164], equal: true, atLeast: true },
      words: { wrapped: true, titleInside: true, countInside: true },
      word: { wrapped: true, titleInside: true, countInside: true },
    },
  },
  {
    // Plant: `aria-live="polite"` on the lane's header (a live region then announces the change).
    name: 'US2 lane count updates: setting count to 4 and then count-label to "4 work packages" shows 4 and names the group "Ready, 4", then "Ready, 4 work packages", and the lane adds no aria-live attribute and no status, alert or log node (Edge Cases, FR-018, FR-019)',
    base: false,
    run: async (driver) => {
      await page(driver, "W", `<div data-frame="W">${lane("l", ' label="Ready" count="3"', '<p id="c">Card text</p>')}</div>`);
      await driver.setAttribute("l", "count", "4");
      const counted = await laneState(driver, "l");
      await driver.setAttribute("l", "count-label", "4 work packages");
      const labelled = await laneState(driver, "l");
      return {
        counted,
        labelled,
        live: (await driver.elements("l")).filter((part) => "aria-live" in part.attributes).length,
        announcing: (await driver.axSubtree("l")).filter((node) => ["status", "alert", "log"].includes(node.role)).length,
      };
    },
    expected: { counted: named("Ready 4", "Ready, 4"), labelled: named("Ready 4", "Ready, 4 work packages"), live: 0, announcing: 0 },
  },
];

// ---------------------------------------------------------------------------------------------------------------
// Guards added after the green implementation, on paths no red scenario reached (the mutants of the lane's observed
// host `aria-label` and of `variant`'s reflection that survived the first mutation run; reviews/phase-3/plants.md
// § Guards). The surviving mutants are their proof that they can fail.

export const laneGuards: readonly BoardScenario[] = [
  {
    name: "US2 guard: a host aria-label set on a lane after it renders names its group at once, and a blank or removed one falls back to the title and count (FR-019)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", `<div data-frame="W">${lane("l", ' label="Ready" count="3"')}</div>`);
      await driver.setAttribute("l", "aria-label", "Ready column");
      const named = await laneState(driver, "l");
      await driver.setAttribute("l", "aria-label", " ");
      const blank = await laneState(driver, "l");
      await driver.setAttribute("l", "aria-label", null);
      return { named, blank, removed: await laneState(driver, "l") };
    },
    expected: { named: named("Ready 3", "Ready column"), blank: named("Ready 3", "Ready, 3"), removed: named("Ready 3", "Ready, 3") },
  },
  {
    name: "US2 guard: variant set by property is reflected to the attribute, so the flat lane drops its ground, and deleting it restores the default lane's ground (FR-017)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", `<div data-frame="W">${lane("l", ' label="Ready" count="3"')}</div>`);
      await driver.setProperty("l", "variant", "flat");
      const flat = { attribute: await driver.attribute("l", "variant"), ground: await driver.computed("l", "background-color") };
      await driver.setProperty("l", "variant", undefined);
      return { flat, restored: { attribute: await driver.attribute("l", "variant"), ground: await driver.computed("l", "background-color") } };
    },
    expected: { flat: { attribute: "flat", ground: "rgba(0, 0, 0, 0)" }, restored: { attribute: null, ground: tokenColour("color-sheet", "light") } },
  },
];
