// User Story 2's browser scenarios for `ocelle-drawer` (008 spec US2 scenarios 1 to 7; FR-003, FR-012, FR-017 to
// FR-019, FR-025 to FR-028, FR-048; contracts/checks.md § Drawer, every row; tasks.md T030). Run in process on the
// element source (test/drawer.test.ts, test/drawer-repeated-escape.test.ts, test/drawer-upgrade.test.ts) and on the
// built browser build on the strict-CSP fixture (test/browser/drawer.test.ts).
//
// Two kinds of rows:
// - the dialog's rows that matrix § Drawer inherits, built by scenarios/dialog.ts's `overlayScenarios` with the
//   `ocelle-drawer` tag and the `ocelle-drawer-` events. Not inherited, as the matrix states: the dialog's one-line
//   body, long body and styles rows, whose geometry (capped at `dialog-max-block`, four rounded corners,
//   `--ocelle-dialog-inline-size`, centred) is the dialog's and contradicts FR-003, FR-025 and FR-026; its backdrop row
//   (a backdrop click does nothing on the dialog, FR-012); and its motion, body and footer rows, which the drawer's own
//   Motion, Long body, One-line body and Styles rows below replace (the fade is the dialog's; the drawer slides);
// - the drawer's own rows, written here by hand from the spec, research and the matrix.
//
// The rules of scenarios/dialog.ts hold for every body: FR-047's counts at the end, bounded waits, no
// `driver.style()`. The drawer is `dlg`, so the names of `focusPath()` are the dialog rows' (`dlg[button]` its close
// control, `dlg[dialog]` its `<dialog>`, `dlg[div]` its body part while it is a Tab stop).
import type { Direction, Driver, RecordedEvent } from "./driver.ts";
import {
  act,
  after,
  bodyMinimum,
  close,
  easingStandard,
  eventually,
  events,
  focusClose,
  gone,
  inkDark,
  inkLight,
  inspect,
  motionBase,
  overlayDark,
  overlayLight,
  overlayScenarios,
  pause,
  radius2,
  raisedDark,
  raisedLight,
  row,
  sheetDark,
  sheetLight,
  shown,
  state,
  targetMin,
} from "./dialog.ts";
import type { DialogScenario, Inspected } from "./dialog.ts";

export { defineDialogStandIns as defineDrawerStandIns } from "./dialog.ts";

const requestName = "ocelle-drawer-close-request";
const closeName = "ocelle-drawer-close";
const both = [requestName, closeName];

/** The chrome ground and ink (packages/tokens/src/source.ts), as computed colours. */
const chromeLight = "rgb(21, 19, 15)";
const chromeDark = "rgb(13, 12, 10)";
const chromeInk = "rgb(237, 233, 225)";
/** `--ocelle-drawer-inline` (`var(--ocelle-shell-sidebar-width)`, 20rem) at a 16 px root. */
const drawerInline = "320px";
/** `--ocelle-dialog-max-inline` at a 320 px wide viewport: 320 − 2 × 1rem. */
const cappedInline = "288px";

/** The entry's and the exit's keyframes of the slide from `from` (a `translate` value) to the panel's place, and back. */
const slide = (from: string): { readonly entry: unknown[]; readonly exit: unknown[] } => ({
  entry: [
    { offset: 0, easing: "linear", translate: from },
    { offset: 1, easing: "linear", translate: "0px" },
  ],
  exit: [
    { offset: 0, easing: "linear", translate: "0px" },
    { offset: 1, easing: "linear", translate: from },
  ],
});

// The inherited rows ------------------------------------------------------------------------------------------------

/**
 * Before a pointer click: polls, at most 1 000 ms, until the panel of each open overlay in the top layer runs no entry
 * animation; a closing one (its `open` attribute gone) is not waited for, so a click during the exit stays one. Fails
 * with a message when an entry does not end in time.
 */
async function settle(driver: Driver): Promise<void> {
  const hosts = (await driver.topLayer()).map((each) => /^([\w-]+)\[dialog\]$/.exec(each.element)?.[1]).filter((id): id is string => id !== undefined);
  for (const id of hosts) {
    for (const start = Date.now(); ; ) {
      if ((await driver.attribute(id, "open")) === null || (await driver.ownAnimations(id, "dialog")).length === 0) break;
      if (Date.now() - start > 1000) throw new Error(`the entry of #${id} did not end within 1 000 ms`);
      await pause(20);
    }
  }
}

const built = overlayScenarios({ tag: "ocelle-drawer", prefix: "ocelle-drawer", entry: slide("-100%").entry, settle });

/** The rows of a group that mixes the inherited rules with the dialog's motion, body and footer rows (see above). */
const inheritedOnly = (rows: readonly DialogScenario[]): DialogScenario[] => rows.filter(({ name }) => !/^(?:Motion|Body \(|Footer \()/.test(name));

/** Matrix § Drawer's inherited dialog rows. */
const inheritedRows: readonly DialogScenario[] = [
  ...built.initialRows,
  ...built.tabCycleRows,
  ...built.nonStopRows,
  ...built.bodyStartRows,
  ...built.scrollerRows,
  ...built.opaqueRows,
  ...built.opaquePairRows,
  ...built.opaqueMoreRows,
  ...built.sentinelRows,
  ...built.middleRows,
  ...built.positiveRows,
  ...built.stopRows,
  ...built.moreStopRows,
  ...built.shadowNonStopRows,
  ...built.iframeEscapeRows,
  ...built.escapeRows,
  ...built.slottedEscapeRows,
  ...built.closeWatcherRows,
  ...built.nativeModalRows,
  ...built.ordinaryRows,
  ...built.aboveRows,
  ...built.nonModalTabRows,
  ...built.cancelRows,
  ...built.closeControlRows,
  ...built.closeControlLooks,
  ...built.hostRows,
  ...built.returnRows,
  ...built.conditionalRows,
  ...built.nestedRows,
  ...built.firstRenderRows,
  ...built.removalRows,
  ...built.toggleRows,
  ...built.exitInputRows,
  ...built.staleRows,
  ...built.forcedRows,
  ...built.treeRows,
  ...built.fieldEscapeRows,
  ...inheritedOnly(built.entryExitRows),
  ...inheritedOnly(built.lifecycleRows),
  ...inheritedOnly(built.t025Rows),
  ...built.nativeEventRows,
  ...inheritedOnly(built.closedPanelRows),
  ...built.moreReturnRows,
  ...built.unnamedRows,
];

// Helpers of the drawer's own rows -----------------------------------------------------------------------------------

/** A page: an opener, the drawer with `content` (and `footer` in a footer `<div>`), a page button and the stand-in. */
function page(content: string, options: { readonly attrs?: string; readonly footer?: string; readonly label?: string } = {}): string {
  const footer = options.footer === undefined ? "" : `<div slot="footer">${options.footer}</div>`;
  return `<button id="opener">Open</button><ocelle-drawer id="dlg" label="${options.label ?? "Filters"}"${options.attrs ?? ""}>${content}${footer}</ocelle-drawer><button id="after">After</button><ocelle-test-act id="act"></ocelle-test-act>`;
}

/** Clicks the opener (which focuses it), sets `open` and records the drawer's two events. */
async function open(driver: Driver): Promise<void> {
  await driver.click("opener");
  await driver.setAttribute("dlg", "open", "");
  await driver.record("dlg", both);
}

/** Opens the drawer and waits until its entry (motion-base, 200 ms) has ended, so the panel is at its place. */
async function openSettled(driver: Driver): Promise<void> {
  await open(driver);
  await pause(300);
}

const request = (reason: string, focusPath: string): RecordedEvent => ({
  type: requestName,
  detail: { reason },
  cancelable: true,
  bubbles: true,
  composed: true,
  open: true,
  dialogOpen: true,
  modal: true,
  focusPath,
});

const closeEvent = (reason: string, focusPath: string): RecordedEvent => ({
  type: closeName,
  detail: { reason },
  cancelable: false,
  bubbles: true,
  composed: true,
  open: false,
  dialogOpen: false,
  modal: false,
  focusPath,
});

/** A side under a direction, and where the panel lies: against the left or the right edge of the viewport. */
interface Placement {
  readonly side: "start" | "end";
  readonly dir: Direction;
  readonly edge: "left" | "right";
}
const placements: readonly Placement[] = [
  { side: "start", dir: "ltr", edge: "left" },
  { side: "end", dir: "ltr", edge: "right" },
  { side: "start", dir: "rtl", edge: "right" },
  { side: "end", dir: "rtl", edge: "left" },
];
const sides = ["start", "end"] as const;
const label = ({ side, dir }: Placement): string => `side="${side}" under ${dir}`;
/** The host attributes of a placement: `side`, and `dir` (the panel takes the host's direction). */
const attrs = ({ side, dir }: Placement): string => ` side="${side}" dir="${dir}"`;

/** The panel's edges, rounded to the pixel. */
const edges = (panel: Inspected): Record<string, number> => ({ left: Math.round(panel.left), right: Math.round(panel.right), top: Math.round(panel.top), height: Math.round(panel.height) });
/** The edges of a panel of `width` against `edge` of the 1280 × 800 viewport, at full block size. */
const against = (edge: "left" | "right", width = 320, viewport = 1280, height = 800): Record<string, number> =>
  edge === "left" ? { left: 0, right: width, top: 0, height } : { left: viewport - width, right: viewport, top: 0, height };

const basic = '<button id="b1">B1</button><button id="b2">B2</button>';
const prose = '<p id="prose">Some prose to press on.</p><button id="b1">B1</button>';

// Placement and size (US2-1, US2-3, FR-025, FR-026) ------------------------------------------------------------------

const placementRows = [
  ...placements.map((placement) =>
    row(
      `Placement (US2-1, FR-025): ${label(placement)}: the panel is against the ${placement.edge} edge of the viewport at its full block size, shown modally over the backdrop`,
      async (driver) => {
        await driver.mount(page(basic, { attrs: attrs(placement) }));
        await openSettled(driver);
        const panel = await inspect(driver, "dlg", "dialog");
        return { edges: edges(panel), state: await state(driver), layer: await driver.topLayer() };
      },
      { edges: against(placement.edge), state: shown, layer: [{ element: "dlg[dialog]", modal: true, popoverOpen: false }] },
    ),
  ),
  row(
    'Placement (FR-025, data-model § ocelle-drawer): an unknown side, side="left", renders as the default, the start edge',
    async (driver) => {
      await driver.mount(page(basic, { attrs: ' side="left"' }));
      await openSettled(driver);
      return { edges: edges(await inspect(driver, "dlg", "dialog")) };
    },
    { edges: against("left") },
  ),
  ...sides.map((side) =>
    row(
      `Size (US2-3, FR-026): side="${side}" at 1280 × 800: the panel's inline size equals the computed --ocelle-drawer-inline, uncapped`,
      async (driver) => {
        await driver.mount(page('<p>Body.</p><div id="ref">Reference</div>', { attrs: ` side="${side}"` }));
        await driver.rules("#ref { inline-size: var(--ocelle-drawer-inline); }");
        await open(driver);
        const panel = await inspect(driver, "dlg", "dialog", ["inline-size"]);
        const ref = await inspect(driver, "ref", undefined, ["inline-size"]);
        return { inline: panel.styles["inline-size"], token: ref.styles["inline-size"] };
      },
      { inline: drawerInline, token: drawerInline },
    ),
  ),
  ...sides.map((side) =>
    row(
      `Size (US2-3, FR-026): side="${side}" at 320 × 800, where --ocelle-drawer-inline exceeds the cap: the panel's inline size equals the computed dialog-max-inline, 288 px`,
      async (driver) => {
        await driver.viewport(320, 800);
        try {
          await driver.mount(page(basic, { attrs: ` side="${side}"` }));
          await open(driver);
          return (await inspect(driver, "dlg", "dialog", ["inline-size", "max-inline-size"])).styles;
        } finally {
          await driver.viewport(1280, 800);
        }
      },
      { "inline-size": cappedInline, "max-inline-size": cappedInline },
    ),
  ),
  row(
    "Size (FR-026): --ocelle-dialog-inline-size: 40rem on the host leaves the panel's inline size at --ocelle-drawer-inline (the drawer has no such hook)",
    async (driver) => {
      await driver.mount(page(basic));
      await driver.rules("#dlg { --ocelle-dialog-inline-size: 40rem; }");
      await open(driver);
      return (await inspect(driver, "dlg", "dialog", ["inline-size"])).styles;
    },
    { "inline-size": drawerInline },
  ),
];

// Styles (FR-003, FR-019, FR-026) ------------------------------------------------------------------------------------

const panelStyles = ["border-top-width", "border-top-style", "border-top-color", "padding-top", "padding-left", "margin-top", "margin-bottom", "max-inline-size", "max-block-size", "background-color", "color", "box-shadow"];
const corners = ["border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius"];

const styleRows = [
  ...(["light", "dark"] as const).map((theme) =>
    row(
      `Styles in ${theme} (FR-003, FR-026): the UA reset to tokens (border, padding, block margins, max-inline-size the computed dialog-max-inline, no block cap below the viewport's block size), sheet ground and ink, the overlay backdrop, the raised shadow`,
      async (driver) => {
        await driver.mount(page(basic));
        await driver.theme(theme);
        await open(driver);
        const panel = await inspect(driver, "dlg", "dialog", panelStyles);
        const backdrop = await inspect(driver, "dlg", "dialog", ["background-color"], "::backdrop");
        const { "max-block-size": maxBlock, ...styles } = panel.styles;
        return { styles, uncapped: maxBlock === "none" || Number.parseFloat(maxBlock ?? "0") >= 800, backdrop: backdrop.styles["background-color"] };
      },
      {
        styles: {
          "border-top-width": "1px",
          "border-top-style": "solid",
          "border-top-color": "rgba(0, 0, 0, 0)",
          "padding-top": "0px",
          "padding-left": "0px",
          "margin-top": "0px",
          "margin-bottom": "0px",
          "max-inline-size": "1248px",
          "background-color": theme === "light" ? sheetLight : sheetDark,
          color: theme === "light" ? inkLight : inkDark,
          "box-shadow": theme === "light" ? raisedLight : raisedDark,
        },
        uncapped: true,
        backdrop: theme === "light" ? overlayLight : overlayDark,
      },
    ),
  ),
  ...placements.map((placement) =>
    row(
      `Styles, corners (FR-003): ${label(placement)}: the two corners against the ${placement.edge} edge are 0, the two on the inner edge the computed radius-2; the panel is not centred`,
      async (driver) => {
        await driver.mount(page(basic, { attrs: attrs(placement) }));
        await openSettled(driver);
        const panel = await inspect(driver, "dlg", "dialog", corners);
        return { corners: panel.styles, edges: edges(panel) };
      },
      {
        corners:
          placement.edge === "left"
            ? { "border-top-left-radius": "0px", "border-top-right-radius": radius2, "border-bottom-left-radius": "0px", "border-bottom-right-radius": radius2 }
            : { "border-top-left-radius": radius2, "border-top-right-radius": "0px", "border-bottom-left-radius": radius2, "border-bottom-right-radius": "0px" },
        edges: against(placement.edge),
      },
    ),
  ),
  row(
    "Styles (US2-3, FR-019): the body's inline size is definite with prose and a table: a short paragraph fills the body's content box, the body fills the panel",
    async (driver) => {
      await driver.mount(page('<p id="short">Short.</p><table id="narrow"><tbody><tr><td>A</td><td>B</td></tr></tbody></table>'));
      await open(driver);
      const panel = await inspect(driver, "dlg", "dialog", ["border-left-width", "border-right-width"]);
      const body = await inspect(driver, "dlg", '[part="body"]', ["padding-left", "padding-right"]);
      const short = await inspect(driver, "short");
      const borders = Number.parseFloat(panel.styles["border-left-width"] ?? "NaN") + Number.parseFloat(panel.styles["border-right-width"] ?? "NaN");
      const padding = Number.parseFloat(body.styles["padding-left"] ?? "NaN") + Number.parseFloat(body.styles["padding-right"] ?? "NaN");
      return { bodyFills: Math.abs(body.width - (panel.width - borders)) < 0.5, prose: Math.abs(short.width - (body.width - padding)) < 0.5 };
    },
    { bodyFills: true, prose: true },
  ),
  row(
    "Styles, footer (FR-017): with the footer slot empty there is no footer box; filled, the footer box ends at the panel's end",
    async (driver) => {
      await driver.mount(page(basic));
      await open(driver);
      const empty = await driver.box("dlg", '[part="footer"]');
      await driver.mount(page(basic, { footer: '<button id="f1">F1</button>' }));
      await open(driver);
      const panel = await inspect(driver, "dlg", "dialog", ["border-bottom-width"]);
      const footer = await inspect(driver, "dlg", '[part="footer"]');
      return { empty: { width: empty.width, height: empty.height }, filled: footer.height > 0, atEnd: Math.abs(footer.bottom - (panel.bottom - Number.parseFloat(panel.styles["border-bottom-width"] ?? "NaN"))) < 0.5 };
    },
    { empty: { width: 0, height: 0 }, filled: true, atEnd: true },
  ),
];

// Long body and one-line body (FR-017, FR-018, R-18) -----------------------------------------------------------------

const paragraphs = Array.from({ length: 40 }, (_, index) => `<p id="p${String(index)}">Paragraph ${String(index + 1)} of a long body that is taller than the viewport, so the drawer's body scrolls.</p>`).join("");

/** Polls the body part's `tabindex` until it is gone, at most 1 000 ms; returns the last reading. */
async function bodyTabindexGone(driver: Driver): Promise<string | null> {
  let tabindex: string | undefined = (await inspect(driver, "dlg", '[part="body"]')).attributes.tabindex;
  for (const start = Date.now(); tabindex !== undefined && Date.now() - start < 1000; ) {
    await pause(20);
    tabindex = (await inspect(driver, "dlg", '[part="body"]')).attributes.tabindex;
  }
  return tabindex ?? null;
}

const bodyRows = [
  ...sides.map((side) =>
    row(
      `Long body (FR-018, FR-025): side="${side}": the panel's block size is the viewport's, 800 px, from its block start, not capped at dialog-max-block; heading and footer inside the panel, the body scrolls, Tab from the close control reaches it, ArrowDown and PageDown scroll it; no tabindex once it no longer overflows`,
      async (driver) => {
        await driver.mount(page(paragraphs, { attrs: ` side="${side}"`, footer: '<button id="f1">F1</button>' }));
        await openSettled(driver);
        const panel = await inspect(driver, "dlg", "dialog");
        const heading = await inspect(driver, "dlg", '[part="heading"]');
        const footer = await inspect(driver, "dlg", '[part="footer"]');
        const body = await inspect(driver, "dlg", '[part="body"]');
        await focusClose(driver);
        await driver.press("Tab");
        const focused = await driver.focusPath();
        const top = (): Promise<number> => inspect(driver, "dlg", '[part="body"]').then((each) => each.scrollTop);
        await driver.press("ArrowDown");
        const down = await eventually(async () => (await top()) > 0);
        await pause(300);
        const afterDown = await top();
        await driver.press("PageDown");
        const paged = await eventually(async () => (await top()) > afterDown);
        const ids = Array.from({ length: 39 }, (_, index) => `p${String(index + 1)}`);
        await act(driver, { op: "seq", ops: ids.map((id) => ({ op: "remove", id }) as const) });
        return {
          block: { height: Math.round(panel.height), top: Math.round(panel.top) },
          headingInside: heading.top >= panel.top && heading.bottom <= panel.bottom,
          footerInside: footer.top >= panel.top && footer.bottom <= panel.bottom,
          overflows: body.scrollHeight > body.clientHeight,
          bodyTabindex: body.attributes.tabindex,
          focused,
          scrolled: { down, page: paged },
          after: await bodyTabindexGone(driver),
        };
      },
      { block: { height: 800, top: 0 }, headingInside: true, footerInside: true, overflows: true, bodyTabindex: "0", focused: "dlg[div]", scrolled: { down: true, page: true }, after: null },
    ),
  ),
  ...sides.map((side) =>
    row(
      `Long body, short viewport 320 × 256 (FR-018, WCAG 1.4.10, R-18): side="${side}": the panel's block size is 256 px, the body keeps its minimum block size and its last content is reachable by scrolling`,
      async (driver) => {
        await driver.viewport(320, 256);
        try {
          await driver.mount(page(paragraphs, { attrs: ` side="${side}"`, footer: '<button id="f1">F1</button><button id="f2">Second action</button>' }));
          await openSettled(driver);
          const panel = await inspect(driver, "dlg", "dialog");
          const body = await inspect(driver, "dlg", '[part="body"]');
          await focusClose(driver);
          await driver.press("Tab");
          const focused = await driver.focusPath();
          await driver.press("End");
          const atEnd = await eventually(async () => {
            const ended = await inspect(driver, "dlg", '[part="body"]');
            return ended.scrollTop + ended.clientHeight >= ended.scrollHeight - 1;
          });
          return { block: Math.round(panel.height), minimum: body.height, overflows: body.scrollHeight > body.clientHeight, focused, atEnd };
        } finally {
          await driver.viewport(1280, 800);
        }
      },
      { block: 256, minimum: bodyMinimum, overflows: true, focused: "dlg[div]", atEnd: true },
    ),
  ),
  ...sides.map((side) =>
    row(
      `One-line body (US2-7, FR-017, FR-018, R-18): side="${side}", a footer of one button: the body fills the panel between header and footer, at least calc(3 * --ocelle-target-min), the text at its block start, the footer's block end at the panel's, no tabindex`,
      async (driver) => {
        await driver.mount(page('<p id="line">Delete this project?</p>', { attrs: ` side="${side}"`, footer: '<button id="f1">Delete</button>' }));
        await openSettled(driver);
        const panel = await inspect(driver, "dlg", "dialog", ["border-top-width", "border-bottom-width", "padding-top", "padding-bottom"]);
        const header = await inspect(driver, "dlg", ".header");
        const footer = await inspect(driver, "dlg", '[part="footer"]');
        const body = await inspect(driver, "dlg", '[part="body"]', ["padding-block-start"]);
        const line = await inspect(driver, "line", undefined, ["margin-block-start"]);
        const px = (value: string | undefined): number => Number.parseFloat(value ?? "NaN");
        const frame = px(panel.styles["border-top-width"]) + px(panel.styles["border-bottom-width"]) + px(panel.styles["padding-top"]) + px(panel.styles["padding-bottom"]);
        return {
          fills: Math.abs(body.height - (panel.height - header.height - footer.height - frame)) < 0.5,
          minimum: body.height >= bodyMinimum,
          start: Math.round(line.top - body.top - px(body.styles["padding-block-start"]) - px(line.styles["margin-block-start"])),
          footerAtEnd: Math.abs(footer.bottom - (panel.bottom - px(panel.styles["border-bottom-width"]) - px(panel.styles["padding-bottom"]))) < 0.5,
          tabindex: body.attributes.tabindex ?? null,
        };
      },
      { fills: true, minimum: true, start: 0, footerAtEnd: true, tabindex: null },
    ),
  ),
  ...sides.map((side) =>
    row(
      `One-line body (R-18): side="${side}", no footer: the body's block end is at the panel's`,
      async (driver) => {
        await driver.mount(page('<p id="line">Delete this project?</p>', { attrs: ` side="${side}"` }));
        await openSettled(driver);
        const panel = await inspect(driver, "dlg", "dialog", ["border-bottom-width", "padding-bottom"]);
        const body = await inspect(driver, "dlg", '[part="body"]');
        const px = (value: string | undefined): number => Number.parseFloat(value ?? "NaN");
        return { bodyAtEnd: Math.abs(body.bottom - (panel.bottom - px(panel.styles["border-bottom-width"]) - px(panel.styles["padding-bottom"]))) < 0.5 };
      },
      { bodyAtEnd: true },
    ),
  ),
];

// The backdrop (US2-2, FR-012, R-07) ---------------------------------------------------------------------------------

/** A point on the backdrop beside the panel, at mid height: the middle of the 960 px the panel leaves free. */
const backdropPoint = (edge: "left" | "right"): { readonly x: number; readonly y: number } => ({ x: edge === "left" ? 800 : 480, y: 400 });
/** A point inside the panel, on prose of the body: the middle of the panel's inline extent, at the prose's height. */
async function prosePoint(driver: Driver): Promise<{ readonly x: number; readonly y: number }> {
  const box = await driver.box("prose");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

const backdropRows = [
  ...placements.flatMap((placement) =>
    ([false, true] as const).map((veto) =>
      row(
        `Backdrop (US2-2, FR-012, R-07): ${label(placement)}, a primary click on the backdrop beside the panel, ${veto ? "veto: one request with reason backdrop, the drawer stays open and :modal" : "no veto: the request and the close carry reason backdrop, focus back on the opener"}`,
        async (driver) => {
          await driver.mount(page(basic, { attrs: attrs(placement) }));
          await openSettled(driver);
          if (veto) await act(driver, { op: "veto", id: "dlg", event: requestName });
          await driver.pointer([{ ...backdropPoint(placement.edge), down: true, up: true }]);
          return veto ? { recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() } : { recorded: await events(driver, 2), state: await state(driver), focus: await driver.focusPath() };
        },
        veto
          ? { recorded: [request("backdrop", "dlg[dialog]")], state: shown, focus: "dlg[dialog]" }
          : { recorded: [request("backdrop", "dlg[dialog]"), closeEvent("backdrop", "opener")], state: gone, focus: "opener" },
      ),
    ),
  ),
  ...placements.slice(0, 2).flatMap((placement) => [
    row(
      `Backdrop (FR-012, R-07): ${label(placement)}, a primary click on the panel's border at its inner edge, inside the border box with the <dialog> as target: nothing is requested, the drawer stays open`,
      async (driver) => {
        await driver.mount(page(prose, { attrs: attrs(placement) }));
        await openSettled(driver);
        const panel = await inspect(driver, "dlg", "dialog");
        // A point the pointer can reach even with no panel (an absent part reads no box): then the click lands on the page.
        const finite = (value: number): number => (Number.isFinite(value) ? value : 0.5);
        const x = placement.edge === "left" ? finite(panel.right - 0.5) : finite(panel.left + 0.5);
        await driver.pointer([{ x, y: 400, down: true, up: true }]);
        return { recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
      },
      { recorded: [], state: shown, focus: "dlg[dialog]" },
    ),
    row(
      `Backdrop (FR-012, R-07): ${label(placement)}, a press on body prose released on the backdrop: nothing is requested, the drawer stays open`,
      async (driver) => {
        await driver.mount(page(prose, { attrs: attrs(placement) }));
        await openSettled(driver);
        const inside = await prosePoint(driver);
        await driver.pointer([
          { ...inside, down: true },
          { ...backdropPoint(placement.edge), up: true },
        ]);
        return { recorded: await after(driver), state: await state(driver) };
      },
      { recorded: [], state: shown },
    ),
    row(
      `Backdrop (FR-012, R-07): ${label(placement)}, a press on the backdrop released on body prose: nothing is requested, the drawer stays open`,
      async (driver) => {
        await driver.mount(page(prose, { attrs: attrs(placement) }));
        await openSettled(driver);
        const inside = await prosePoint(driver);
        await driver.pointer([
          { ...backdropPoint(placement.edge), down: true },
          { ...inside, up: true },
        ]);
        return { recorded: await after(driver), state: await state(driver) };
      },
      { recorded: [], state: shown },
    ),
    row(
      `Backdrop (FR-012, R-07): ${label(placement)}, a secondary-button click on the backdrop: nothing is requested, the drawer stays open`,
      async (driver) => {
        await driver.mount(page(prose, { attrs: attrs(placement) }));
        await openSettled(driver);
        await driver.pointer([{ ...backdropPoint(placement.edge), down: true, up: true, button: "right" }]);
        return { recorded: await after(driver), state: await state(driver) };
      },
      { recorded: [], state: shown },
    ),
  ]),
  row(
    "Backdrop during the exit, motion on (FR-013, FR-014, R-07): a double click on the backdrop, no veto: exactly one request and one close, both with reason backdrop, focus on the opener",
    async (driver) => {
      await driver.mount(page(basic));
      await openSettled(driver);
      const point = backdropPoint("left");
      await driver.pointer([
        { ...point, down: true, up: true },
        { ...point, down: true, up: true },
      ]);
      await events(driver, 2);
      return { recorded: await after(driver), state: await state(driver), focus: await driver.focusPath() };
    },
    { recorded: [request("backdrop", "dlg[dialog]"), closeEvent("backdrop", "opener")], state: gone, focus: "opener" },
  ),
];

// The border box's edges (R-07, T036) ------------------------------------------------------------------------------

/**
 * A press and click at one point, outside the panel's border box or not. The border box is the half-open area of the
 * panel's pixels, [left, right) × [top, bottom): a point on its first or last pixel column or row is inside it, the
 * pixel next to it outside, on the backdrop. The block-axis edges are reached with the panel shortened and centred by
 * a host rule on `::part(panel)`.
 */
interface Edge {
  readonly label: string;
  readonly attrs: string;
  readonly rules?: string;
  readonly point: { readonly x: number; readonly y: number };
  readonly backdrop: boolean;
  readonly edges: Record<string, number>;
}
const shortened = "#dlg::part(panel) { block-size: 400px; margin-block: auto; }";
const shortEdges = { left: 0, right: 320, top: 200, height: 400 };
const borderEdges: readonly Edge[] = [
  { label: 'side="start", the panel\'s last pixel column (x = 319)', attrs: ' side="start"', point: { x: 319, y: 400 }, backdrop: false, edges: against("left") },
  { label: 'side="start", the backdrop\'s first column beside the panel (x = 320)', attrs: ' side="start"', point: { x: 320, y: 400 }, backdrop: true, edges: against("left") },
  { label: 'side="start", the panel\'s first pixel column, at the viewport\'s edge (x = 0)', attrs: ' side="start"', point: { x: 0, y: 400 }, backdrop: false, edges: against("left") },
  { label: 'side="end", the panel\'s first pixel column (x = 960)', attrs: ' side="end"', point: { x: 960, y: 400 }, backdrop: false, edges: against("right") },
  { label: 'side="end", the backdrop\'s last column beside the panel (x = 959)', attrs: ' side="end"', point: { x: 959, y: 400 }, backdrop: true, edges: against("right") },
  { label: "a panel 400 px tall, centred by ::part(panel), the backdrop's row above it (y = 199)", attrs: "", rules: shortened, point: { x: 160, y: 199 }, backdrop: true, edges: shortEdges },
  { label: "a panel 400 px tall, centred by ::part(panel), its first pixel row (y = 200)", attrs: "", rules: shortened, point: { x: 160, y: 200 }, backdrop: false, edges: shortEdges },
  { label: "a panel 400 px tall, centred by ::part(panel), its last pixel row (y = 599)", attrs: "", rules: shortened, point: { x: 160, y: 599 }, backdrop: false, edges: shortEdges },
  { label: "a panel 400 px tall, centred by ::part(panel), the backdrop's row below it (y = 600)", attrs: "", rules: shortened, point: { x: 160, y: 600 }, backdrop: true, edges: shortEdges },
];

const edgeRows = borderEdges.map(({ label: where, attrs: attributes, rules, point, backdrop, edges: expectedEdges }) =>
  row(
    `Backdrop, the border box's edges (FR-012, R-07): a primary click at ${where}: ${backdrop ? "outside the border box, the request and the close carry reason backdrop" : "inside the border box, nothing is requested"}`,
    async (driver) => {
      await driver.mount(page(basic, { attrs: attributes }));
      if (rules !== undefined) await driver.rules(rules);
      await openSettled(driver);
      const panel = edges(await inspect(driver, "dlg", "dialog"));
      await driver.pointer([{ ...point, down: true, up: true }]);
      return { panel, recorded: backdrop ? await events(driver, 2) : await after(driver), state: await state(driver) };
    },
    { panel: expectedEdges, recorded: backdrop ? [request("backdrop", "dlg[dialog]"), closeEvent("backdrop", "opener")] : [], state: backdrop ? gone : shown },
  ),
);

// The press of a backdrop click (R-07, T036): the primary button's pointerdown of the primary pointer, its own -------

const pressRows = [
  row(
    'Backdrop, the press (FR-012, R-07): side="end", a script click() on the panel with no press before it: nothing is requested (a backdrop click needs its own press outside the border box)',
    async (driver) => {
      await driver.mount(page(basic, { attrs: ' side="end"' }));
      await openSettled(driver);
      await act(driver, { op: "call", id: "dlg", inner: "dialog", method: "click" });
      return { recorded: await after(driver), state: await state(driver) };
    },
    { recorded: [], state: shown },
  ),
  row(
    'Backdrop, the press (FR-012, R-07): side="end", veto, a primary click on the backdrop, then a script click() on the panel: one request only (the second click has no press of its own)',
    async (driver) => {
      await driver.mount(page(basic, { attrs: ' side="end"' }));
      await openSettled(driver);
      await act(driver, { op: "veto", id: "dlg", event: requestName });
      await driver.pointer([{ ...backdropPoint("right"), down: true, up: true }]);
      await act(driver, { op: "call", id: "dlg", inner: "dialog", method: "click" });
      return { recorded: await after(driver), state: await state(driver) };
    },
    { recorded: [request("backdrop", "dlg[dialog]")], state: shown },
  ),
  row(
    "Backdrop, the press (FR-012, R-07): a secondary-button press on the backdrop, then a primary click there while it is held: nothing is requested (the press began with the secondary button)",
    async (driver) => {
      await driver.mount(page(basic));
      await openSettled(driver);
      const point = backdropPoint("left");
      await driver.pointer([
        { ...point, down: true, button: "right" },
        { ...point, down: true },
        { ...point, up: true },
        { ...point, up: true, button: "right" },
      ]);
      return { recorded: await after(driver), state: await state(driver) };
    },
    { recorded: [], state: shown },
  ),
  row(
    "Backdrop, the press (FR-012, R-07): a primary press on the backdrop, a second, non-primary pointer pressed on body prose, then the primary click released on the backdrop: the request and the close carry reason backdrop (only the primary pointer's press counts)",
    async (driver) => {
      await driver.mount(page(prose));
      await openSettled(driver);
      const inside = await prosePoint(driver);
      await driver.pointer([{ ...backdropPoint("left"), down: true }]);
      await act(driver, { op: "pointerdown", id: "dlg", inner: "dialog", ...inside, isPrimary: false });
      await driver.pointer([{ ...backdropPoint("left"), up: true }]);
      return { recorded: await events(driver, 2), state: await state(driver) };
    },
    { recorded: [request("backdrop", "dlg[dialog]"), closeEvent("backdrop", "opener")], state: gone },
  ),
  row(
    "Backdrop, the press (FR-012, R-07): a primary press on body prose, a second, non-primary pointer pressed on the backdrop, then the primary click released on the backdrop: nothing is requested (only the primary pointer's press counts)",
    async (driver) => {
      await driver.mount(page(prose));
      await openSettled(driver);
      const inside = await prosePoint(driver);
      await driver.pointer([{ ...inside, down: true }]);
      await act(driver, { op: "pointerdown", id: "dlg", inner: "dialog", ...backdropPoint("left"), isPrimary: false });
      await driver.pointer([{ ...backdropPoint("left"), up: true }]);
      return { recorded: await after(driver), state: await state(driver) };
    },
    { recorded: [], state: shown },
  ),
];

// Motion (US2-5, FR-020, FR-028) -------------------------------------------------------------------------------------

const motionRows = [
  ...placements.map((placement) =>
    row(
      `Motion (US2-5, FR-020, FR-028): ${label(placement)}: the entry slides the panel in from the ${placement.edge} edge (translate from ${placement.edge === "left" ? "-100%" : "100%"}) and the exit back there, with the duration of --ocelle-motion-base and the easing of --ocelle-easing-standard`,
      async (driver) => {
        await driver.mount(page(basic, { attrs: attrs(placement) }));
        await open(driver);
        const entry = (await driver.ownAnimations("dlg", "dialog")).map(({ playState, ...rest }) => ({ ...rest, running: playState === "running" }));
        await pause(300);
        await driver.press("Escape");
        const exit = (await driver.ownAnimations("dlg", "dialog")).map(({ playState, ...rest }) => ({ ...rest, running: playState === "running" }));
        return { entry, exit, recorded: await events(driver, 2) };
      },
      {
        entry: [{ duration: motionBase, easing: easingStandard, keyframes: slide(placement.edge === "left" ? "-100%" : "100%").entry, running: true }],
        exit: [{ duration: motionBase, easing: easingStandard, keyframes: slide(placement.edge === "left" ? "-100%" : "100%").exit, running: true }],
        recorded: [request("escape", "b1"), closeEvent("escape", "opener")],
      },
    ),
  ),
  ...sides.map((side) =>
    row(
      `Motion under reduced motion (FR-020, SC-008): side="${side}": no animation on open or close, the whole close in one update`,
      async (driver) => {
        await driver.reducedMotion("reduce");
        await driver.mount(page(basic, { attrs: ` side="${side}"` }));
        await open(driver);
        const entry = await driver.ownAnimations("dlg", "dialog");
        await driver.press("Escape");
        const exit = await driver.ownAnimations("dlg", "dialog");
        return { entry, exit, recorded: await driver.recorded() };
      },
      { entry: [], exit: [], recorded: [request("escape", "b1"), closeEvent("escape", "opener")] },
    ),
  ),
];

// Ground and heading-hidden (US2-4, US2-6, FR-005, FR-027, FR-048) ---------------------------------------------------

const groundRows = [
  ...(["light", "dark"] as const).flatMap((theme) =>
    (
      [
        ["", "the default, the sheet", theme === "light" ? sheetLight : sheetDark, theme === "light" ? inkLight : inkDark],
        [' ground="chrome"', 'ground="chrome", the chrome', theme === "light" ? chromeLight : chromeDark, chromeInk],
        [' ground="rail"', 'an unknown ground, ground="rail", the default sheet', theme === "light" ? sheetLight : sheetDark, theme === "light" ? inkLight : inkDark],
      ] as const
    ).map(([attributes, what, background, ink]) =>
      row(
        `Ground (US2-4, FR-027) in ${theme}: ${what} ground and its ink`,
        async (driver) => {
          await driver.mount(page(basic, { attrs: attributes }));
          await driver.theme(theme);
          await open(driver);
          return (await inspect(driver, "dlg", "dialog", ["background-color", "color"])).styles;
        },
        { "background-color": background, color: ink },
      ),
    ),
  ),
  row(
    "side, ground and heading-hidden (data-model § ocelle-drawer) are reflected: the defaults start and sheet, no heading-hidden; set as properties, end, chrome and heading-hidden",
    async (driver) => {
      await driver.mount(page(basic));
      const read = async (): Promise<unknown> => ({ side: await driver.attribute("dlg", "side"), ground: await driver.attribute("dlg", "ground"), headingHidden: await driver.attribute("dlg", "heading-hidden") });
      const defaults = await read();
      await act(driver, { op: "seq", ops: [{ op: "set", id: "dlg", name: "side", value: "end" }, { op: "set", id: "dlg", name: "ground", value: "chrome" }, { op: "set", id: "dlg", name: "headingHidden", value: true }] });
      await driver.setAttribute("act", "data-wait", "");
      return { defaults, set: await read() };
    },
    { defaults: { side: "start", ground: "sheet", headingHidden: null }, set: { side: "end", ground: "chrome", headingHidden: "" } },
  ),
];

const headingStyles = ["position", "overflow", "opacity"];
const headingRows = [
  row(
    'heading-hidden (US2-6, FR-048): label="Personal", ground="chrome" and heading-hidden: the heading is not painted and takes no space (a size-visually-hidden box), the tree still holds one modal dialog named Personal with a level-2 heading Personal; the close control is visible, named by close-label, at the block start, reached by Tab, and closes with close-button',
    async (driver) => {
      await driver.mount(page('<button id="b1">B1</button>', { label: "Personal", attrs: ' ground="chrome" heading-hidden close-label="Close personal"' }));
      await openSettled(driver);
      const panel = await inspect(driver, "dlg", "dialog", ["border-top-width"]);
      const header = await inspect(driver, "dlg", ".header", ["padding-top"]);
      const heading = await inspect(driver, "dlg", '[part="heading"]', headingStyles);
      const control = await inspect(driver, "dlg", close);
      // The named nodes: Chromium also exposes an unnamed generic node for the body holding a focusable element.
      const tree = (await driver.ax("dlg")).filter((node) => node.name !== "");
      await driver.press("Tab");
      const tabbed = await driver.focusPath();
      await driver.press("Enter");
      const px = (value: string | undefined): number => Number.parseFloat(value ?? "NaN");
      return {
        heading: { width: heading.width, height: heading.height, styles: heading.styles },
        tree,
        control: { label: control.attributes["aria-label"], visible: control.width >= targetMin && control.height >= targetMin, atBlockStart: Math.abs(control.top - (panel.top + px(panel.styles["border-top-width"]) + px(header.styles["padding-top"]))) < 0.5 },
        tabbed,
        recorded: await events(driver, 2),
      };
    },
    {
      heading: { width: 1, height: 1, styles: { position: "absolute", overflow: "hidden", opacity: "0" } },
      tree: [
        { role: "dialog", name: "Personal", modal: true },
        { role: "heading", name: "Personal", level: 2 },
        { role: "button", name: "Close personal" },
        { role: "StaticText", name: "Personal" },
      ],
      control: { label: "Close personal", visible: true, atBlockStart: true },
      tabbed: "dlg[button]",
      recorded: [request("close-button", "dlg[button]"), closeEvent("close-button", "opener")],
    },
  ),
  row(
    'heading-hidden (US2-6, FR-048): without it, label="Personal" and ground="chrome": the heading is painted, in the flow, wider and taller than one pixel',
    async (driver) => {
      await driver.mount(page('<button id="b1">B1</button>', { label: "Personal", attrs: ' ground="chrome"' }));
      await openSettled(driver);
      const heading = await inspect(driver, "dlg", '[part="heading"]', headingStyles);
      return { painted: heading.width > 1 && heading.height > 1, styles: heading.styles };
    },
    { painted: true, styles: { position: "static", overflow: "visible", opacity: "1" } },
  ),
  row(
    "heading-hidden (FR-005, FR-048): with a host aria-label as well as label: the modal dialog keeps the host aria-label as its name, the heading stays in the tree",
    async (driver) => {
      await driver.mount(page("<p>Body.</p>", { label: "Personal", attrs: ' heading-hidden aria-label="Settings"' }));
      await open(driver);
      return { tree: (await driver.ax("dlg")).filter((node) => node.role === "dialog" || node.role === "heading") };
    },
    {
      tree: [
        { role: "dialog", name: "Settings", modal: true },
        { role: "heading", name: "Personal", level: 2 },
      ],
    },
  ),
];

/** Every row of matrix § Drawer but the repeated-Escape case, which runs on a page of its own. */
export const drawerScenarios: readonly DialogScenario[] = [...inheritedRows, ...placementRows, ...styleRows, ...bodyRows, ...backdropRows, ...edgeRows, ...pressRows, ...motionRows, ...groundRows, ...headingRows];

/**
 * The veto-then-Escape-twice case with slotted content (matrix § Dialog "Escape with slotted content", inherited), with
 * its warm-up: in process alone in test/drawer-repeated-escape.test.ts, on the fixture on a fresh page.
 */
export const drawerRepeatedEscape: DialogScenario = built.repeatedEscapeScenario;

/** The before-definition case of the inherited open-at-first-render row (b): test/drawer-upgrade.test.ts in process. */
export const drawerUpgrade: { readonly markup: string; readonly before: (driver: Driver) => Promise<unknown>; readonly after: (driver: Driver) => Promise<unknown>; readonly expected: unknown } = built.upgrade;

