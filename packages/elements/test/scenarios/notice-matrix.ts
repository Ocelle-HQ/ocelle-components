// The SC-002 matrix as a table-driven body (specs/010-feedback-forms SC-002, FR-008, FR-009; T012): for each of the
// five tones and each supported host-role row of FR-009 (no role with `announce`, `role="alert"`, `role="status"`),
// one capture over a page as first loaded with one notice per cell, each cell's trigger or non-trigger made on its own
// notice, and one expected count per cell, written by hand below, asserted on that notice's live regions alone under
// both rules. Triggers: insertion, reveal, text change, politeness change; non-triggers: first load, same text,
// re-render, move, `announce` set later, change while hidden. As SC-002 reads them per row: in the no-role row the
// politeness change is a tone change across politeness; in the `alert` row it is a runtime change of the role from
// `status` to `alert` and in the `status` row from `alert` to `status`; "`announce` set later" is a live role set at
// runtime in the `alert` and `status` rows. In the `alert` row, insertion, reveal and the change to `alert` count zero
// live-region announcements, with the host's node an `alert` node (the platform alert event carries them). The change
// while hidden is followed by the reveal, which announces the text current at that moment once (zero in the `alert`
// row), so the change itself counts zero; every zero cell is also checked for its live region present, its box drawn
// and its host's role.
import { assert } from "vitest";
import type { Expected, Politeness } from "../live-reading.ts";
import type { Driver, Operation } from "./driver.ts";
import { announced, el, only, pastFirstLoad, politenessOf, regionPresent, tones, visible } from "./notice.ts";
import type { NoticeScenario, Tone } from "./notice.ts";

type Row = "none" | "alert" | "status";
type Cell = "insertion" | "reveal" | "text" | "politeness" | "first-load" | "same-text" | "re-render" | "move" | "set-later" | "while-hidden";

/** The politeness an announcement of a cell takes: the tone's, the other one (a tone change across), or a fixed one. */
type Takes = "tone" | "across" | Politeness;

/** One expected count per cell and the politeness of its announcement, by row (SC-002, by hand). */
const table: Readonly<Record<Row, Readonly<Record<Cell, { readonly count: 0 | 1; readonly takes: Takes }>>>> = {
  none: {
    insertion: { count: 1, takes: "tone" },
    reveal: { count: 1, takes: "tone" },
    text: { count: 1, takes: "tone" },
    politeness: { count: 1, takes: "across" },
    "first-load": { count: 0, takes: "tone" },
    "same-text": { count: 0, takes: "tone" },
    "re-render": { count: 0, takes: "tone" },
    move: { count: 0, takes: "tone" },
    "set-later": { count: 0, takes: "tone" },
    "while-hidden": { count: 1, takes: "tone" },
  },
  alert: {
    insertion: { count: 0, takes: "assertive" },
    reveal: { count: 0, takes: "assertive" },
    text: { count: 1, takes: "assertive" },
    politeness: { count: 0, takes: "assertive" },
    "first-load": { count: 0, takes: "assertive" },
    "same-text": { count: 0, takes: "assertive" },
    "re-render": { count: 0, takes: "assertive" },
    move: { count: 0, takes: "assertive" },
    "set-later": { count: 0, takes: "assertive" },
    "while-hidden": { count: 0, takes: "assertive" },
  },
  status: {
    insertion: { count: 1, takes: "polite" },
    reveal: { count: 1, takes: "polite" },
    text: { count: 1, takes: "polite" },
    politeness: { count: 1, takes: "polite" },
    "first-load": { count: 0, takes: "polite" },
    "same-text": { count: 0, takes: "polite" },
    "re-render": { count: 0, takes: "polite" },
    move: { count: 0, takes: "polite" },
    "set-later": { count: 0, takes: "polite" },
    "while-hidden": { count: 1, takes: "polite" },
  },
};

/** The host role each row's notices end with, as the tree reads it. */
const finalRole: Readonly<Record<Exclude<Row, "none">, string>> = { alert: "alert", status: "status" };

const cells = Object.keys(table.none) as Cell[];

/** The tone across politeness from `tone`: `danger` from a polite tone, `info` from an assertive one. */
const across = (tone: Tone): Tone => (politenessOf(tone) === "polite" ? "danger" : "info");

/** The attributes a notice of the row has from the start. */
function rowAttributes(row: Row, tone: Tone): string {
  if (row === "none") return `announce tone="${tone}"`;
  return `role="${row}" tone="${tone}"`;
}

/** The text a cell's notice ends with, distinct per cell. */
const finalText: Readonly<Record<Cell, string>> = {
  insertion: "Inserted",
  reveal: "Revealed",
  text: "Changed",
  politeness: "Politeness",
  "first-load": "First load",
  "same-text": "Same",
  "re-render": "Re-render",
  move: "Moved",
  "set-later": "Set later",
  "while-hidden": "Changed while hidden",
};

/** The page as first loaded: every cell's notice but the inserted one; the moved one beside a container `d`. */
function firstLoaded(row: Row, tone: Tone): string {
  const attributes = rowAttributes(row, tone);
  const notice = (cell: Cell, extra: string, text: string): string => el("ocelle-first-load", `id="${cell}" ${extra}`, text);
  const startRole = row === "alert" ? `role="status" tone="${tone}"` : row === "status" ? `role="alert" tone="${tone}"` : attributes;
  return (
    '<div id="d"></div>' +
    notice("reveal", `${attributes} hidden`, finalText.reveal) +
    notice("text", attributes, "Before") +
    notice("politeness", startRole, finalText.politeness) +
    notice("first-load", attributes, finalText["first-load"]) +
    notice("same-text", attributes, finalText["same-text"]) +
    notice("re-render", attributes, finalText["re-render"]) +
    notice("move", attributes, finalText.move) +
    notice("set-later", `tone="${tone}"`, finalText["set-later"]) +
    notice("while-hidden", attributes, "Before hidden")
  );
}

/** The cells' operations in one task: each cell's trigger or non-trigger on its own notice. */
function operations(row: Row, tone: Tone, tag: string): Operation[] {
  const politeness: Operation =
    row === "none" ? { op: "attribute", id: "politeness", name: "tone", value: across(tone) } : { op: "attribute", id: "politeness", name: "role", value: row };
  const setLater: Operation = row === "none" ? { op: "attribute", id: "set-later", name: "announce", value: "" } : { op: "attribute", id: "set-later", name: "role", value: row };
  return [
    { op: "insert", container: "c", markup: el(tag, `id="insertion" ${rowAttributes(row, tone)}`, finalText.insertion) },
    { op: "attribute", id: "reveal", name: "hidden", value: null },
    { op: "text", id: "text", text: finalText.text },
    politeness,
    { op: "text", id: "same-text", text: finalText["same-text"] },
    { op: "attribute", id: "re-render", name: "size", value: "compact" },
    { op: "move", id: "move", to: "d" },
    setLater,
    { op: "attribute", id: "while-hidden", name: "hidden", value: "" },
  ];
}

function expectedOf(cell: Cell, row: Row, tone: Tone): Expected[] {
  const { count, takes } = table[row][cell];
  const politeness: Politeness = takes === "tone" ? politenessOf(tone) : takes === "across" ? politenessOf(across(tone)) : takes;
  return Array.from({ length: count }, () => ({ text: finalText[cell], politeness, host: cell }));
}

/** The matrix body of one tone and one row. */
async function matrix(driver: Driver, tag: string, row: Row, tone: Tone): Promise<void> {
  await driver.mount('<main id="c"></main>');
  await driver.firstLoad("c", firstLoaded(row, tone), tag);
  await pastFirstLoad(driver);
  await driver.batch(operations(row, tone, tag));
  await driver.batch([{ op: "text", id: "while-hidden", text: finalText["while-hidden"] }]);
  const gap = await driver.after(2 * driver.W.loaded);
  assert.deepEqual({ gap: gap >= 2 * driver.W.loaded && gap < 4 * driver.W.loaded }, { gap: true }, `SC-002 ${row} ${tone}: the wait before the reveal`);
  await driver.batch([{ op: "attribute", id: "while-hidden", name: "hidden", value: null }]);
  const snapshots = await driver.liveCapture.stop();
  for (const cell of cells) announced(driver, only(snapshots, [cell]), expectedOf(cell, row, tone), `SC-002 ${row} ${tone} ${cell}: announcements`);
  const seen = { regions: cells.map((cell) => regionPresent(snapshots, cell)), drawn: await Promise.all(cells.map((cell) => visible(driver, cell))) };
  assert.deepEqual(seen, { regions: cells.map(() => true), drawn: cells.map(() => true) }, `SC-002 ${row} ${tone}: regions and boxes`);
}

/** The roles of the cells' hosts at the end, for the `alert` and `status` rows (the zero cells' host role). */
async function roles(driver: Driver, row: Exclude<Row, "none">): Promise<void> {
  const seen = await Promise.all(cells.map((cell) => driver.hostRole(cell)));
  assert.deepEqual(seen, cells.map(() => finalRole[row]), `SC-002 ${row}: host roles`);
}

const cellList = "insertion, reveal, text, politeness, first load, same text, re-render, move, set later, while hidden";

export const matrixScenarios: readonly NoticeScenario[] = [
  ...tones.map(
    (tone): NoticeScenario => ({
      name: `SC-002 none ${tone}: one expected count per cell (${cellList})`,
      run: (driver, tag) => matrix(driver, tag, "none", tone),
    }),
  ),
  ...(["alert", "status"] as const).flatMap((row) =>
    tones.map(
      (tone): NoticeScenario => ({
        name: `SC-002 ${row} ${tone}: one expected count per cell (${cellList}), every host a ${row} node`,
        run: async (driver, tag) => {
          await matrix(driver, tag, row, tone);
          await roles(driver, row);
        },
      }),
    ),
  ),
];
