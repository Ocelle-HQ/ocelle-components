// The shared bodies of User Story 1's browser scenarios for `ocelle-notice` (specs/010-feedback-forms spec US1
// scenarios 1 to 19 and the notice's Edge Cases; T011). Each body is written once against the driver, with the notice's
// tag as a parameter (the plant rows of test/plants.test.ts run a body with a plant's tag), and asserts as it goes: it
// resolves when every assertion held and rejects with the first failed one. It is run in process on the element source
// (test/notice.test.ts) and on strict-CSP fixture pages with the browser build (test/browser/notice.test.ts).
//
// Expected values are written by hand from the spec and the contracts (tasks.md, guard rules): announcement texts and
// counts from the scenarios, colours from the token names the spec names (the hand-written token table of
// packages/tokens/test/expected.ts, through `tokenColour`), sizes from that table's used values at a 16 px root font
// size, timing as fractions of the `W` in force (`driver.W`: 300 ms loaded and 700 ms loading on fixture pages, the
// in-process constant's in process) and the hold `H` (`driver.H`).
//
// Every announcement assertion states its expected list once and checks it under both the "settled" and the
// "rendered" rule (`expectAnnouncements`, through `announced`), with the capture's `D` taken as half the `W` in force.
// A zero count never stands alone: its scenario also asserts the positive outcome it guards (the notice's live region
// present, its text visible, the host's role). Each timed step goes through `drive.after` and its returned gap is
// asserted, unconditionally, to lie in its stated range (analysis A2).
import { assert } from "vitest";
import { expectedTokens } from "../../../tokens/test/expected.ts";
import { expectAnnouncements } from "../live-reading.ts";
import type { Expected, Politeness } from "../live-reading.ts";
import type { Driver, InsertHow, Palette, Snapshot } from "./driver.ts";
import { tokenColour } from "./icon.ts";

export interface NoticeScenario {
  /** The spec scenario and what it checks. */
  readonly name: string;
  /** Runs the scenario with the notice's tag `tag` (`ocelle-notice`, or a plant's tag), asserting as it goes. */
  readonly run: (driver: Driver, tag: string) => Promise<void>;
}

/** The literal tag that `firstLoad` replaces by the notice's tag. */
const firstTag = "ocelle-first-load";

/** An element of tag `tag` with attributes `attributes` (as written) and content `content`. */
export function el(tag: string, attributes: string, content: string): string {
  return `<${tag}${attributes === "" ? "" : ` ${attributes}`}>${content}</${tag}>`;
}

/** A first-load notice: the literal tag `firstLoad` replaces. */
const fl = (attributes: string, content: string): string => el(firstTag, attributes, content);

export const polite = (text: string, host = "n"): Expected => ({ text, politeness: "polite", host });
export const assertive = (text: string, host = "n"): Expected => ({ text, politeness: "assertive", host });

/** Asserts the announcements of `snapshots` under both rules, with the capture's `D` of the `W` in force. */
export function announced(driver: Driver, snapshots: readonly Snapshot[], expected: readonly Expected[], message: string): void {
  expectAnnouncements(snapshots, expected, { loaded: driver.W.loaded / 2, loading: driver.W.loading / 2 }, message);
}

/** The snapshots with only the live regions at or inside the hosts `hosts`. */
export function only(snapshots: readonly Snapshot[], hosts: readonly string[]): Snapshot[] {
  return snapshots.map((snapshot) => ({ ...snapshot, regions: snapshot.regions.filter((region) => region.host !== null && hosts.includes(region.host)) }));
}

/** Whether the final snapshot holds a live region node at or inside host `host`. */
export function regionPresent(snapshots: readonly Snapshot[], host: string): boolean {
  return snapshots.at(-1)?.regions.some((region) => region.host === host) ?? false;
}

/** Whether the notice `id` draws its box: the shadow box is displayed and has a height. */
export async function visible(driver: Driver, id: string): Promise<boolean> {
  const box = await driver.box(id, ".box");
  return box.display !== "none" && box.display !== "absent" && box.height > 0;
}

/** Asserts that `gap` (a `drive.after` result) lies in [`from`, `below`). */
export function expectGap(gap: number, from: number, below: number, message: string): void {
  assert.deepEqual({ gap: gap >= from && gap < below }, { gap: true }, `${message}: gap ${String(gap)} in [${String(from)}, ${String(below)})`);
}

/** The used value of a non-colour token of the hand-written table, as a number of CSS pixels or its computed text. */
export function used(token: string): number | string {
  const entry = expectedTokens.find((each) => each.name === token);
  if (entry === undefined || typeof entry.compare === "string") throw new Error(`no probe for token ${token}`);
  const value = entry.compare.used;
  if (typeof value === "object") throw new Error(`token ${token} is per theme`);
  return value;
}

/** A token's used length as computed CSS text (`12px`); a used value the table writes as text (`14px`) as it is. */
export function px(token: string): string {
  const value = used(token);
  return typeof value === "number" ? `${String(value)}px` : value;
}

/** A unitless line-height token times a font size in pixels, as computed CSS text. */
function lineHeight(token: string, fontSize: string): string {
  const entry = expectedTokens.find((each) => each.name === token);
  if (entry === undefined || typeof entry.declared !== "string") throw new Error(`no line height ${token}`);
  return `${String(Math.round(Number(entry.declared) * Number.parseFloat(fontSize) * 1000) / 1000)}px`;
}

export const tones = ["info", "success", "warning", "danger", "neutral"] as const;
export type Tone = (typeof tones)[number];

/** The politeness of a tone (FR-009). */
export const politenessOf = (tone: Tone): Politeness => (tone === "warning" || tone === "danger" ? "assertive" : "polite");

const announcing = (tag: string, content = "Saved", attributes = 'announce tone="success"'): string => el(tag, `id="n" ${attributes}`, content);

/** Mounts the container, arms the capture on it, inserts `markup` the way `how` says and stops the capture. */
async function insertion(driver: Driver, markup: string, how: InsertHow = "innerHTML"): Promise<Snapshot[]> {
  await driver.mount('<main id="c"></main>');
  await driver.liveCapture.start("c");
  await driver.insert("c", markup, how);
  return driver.liveCapture.stop();
}

/**
 * How long after the live region of `host` was first seen, empty, its text was first seen as `text`, in page
 * milliseconds; -1 when either was not seen.
 */
function firstWrite(snapshots: readonly Snapshot[], host: string, text: string): number {
  const seen = (snapshot: Snapshot, want: string): boolean => snapshot.regions.some((region) => region.host === host && region.text === want);
  const rendered = snapshots.find((snapshot) => seen(snapshot, ""));
  const written = snapshots.find((snapshot) => seen(snapshot, text));
  return rendered === undefined || written === undefined ? -1 : written.at - rendered.at;
}

/**
 * Asserts that notice `n`, first loaded and changed in the first task after the load, had its copy `text` written no
 * earlier than the pre-load `W` after its region was first seen (spec FR-008; research R-02 step 2, phase 2 stop 2
 * decision (a)), less half the after-load `W` for the capture's sampling of both states. On fixture pages that is 550
 * ms; a wait counted from the trigger only writes 340 to 379 ms after it (reviews/phase-2/stop-2.md). In process both
 * load states share the test `D`, so it holds as soon as the copy is written `W` after the trigger.
 */
function writtenAfterFirstRender(driver: Driver, snapshots: readonly Snapshot[], text: string, message: string): void {
  const gap = firstWrite(snapshots, "n", text);
  const from = driver.W.loading - driver.W.loaded / 2;
  assert.deepEqual({ gap: gap >= from }, { gap: true }, `${message}: the write after the first render, ${String(gap)} ms, from ${String(from)}`);
}

/**
 * Mounts the page as first loaded with `markup` (the capture armed from before), runs `steps` from the first task after
 * the load and stops the capture.
 */
async function loaded(driver: Driver, tag: string, markup: string, steps: () => Promise<void> = () => Promise.resolve()): Promise<Snapshot[]> {
  await driver.mount('<main id="c"></main>');
  await driver.firstLoad("c", markup, tag);
  await steps();
  return driver.liveCapture.stop();
}

/** Waits until the effects of the last trigger have settled: twice `W` after the previous step. */
async function settleAnnouncement(driver: Driver): Promise<void> {
  const gap = await driver.after(2 * driver.W.loaded);
  expectGap(gap, 2 * driver.W.loaded, 4 * driver.W.loaded, "settling wait");
}

const ways: readonly InsertHow[] = ["innerHTML", "template", "domparser", "createElement"];

/** The look of the box of notice `id`: ground, marker colour and width, radius, and the text colour of its body `b`. */
async function look(driver: Driver, id: string): Promise<Record<string, string>> {
  return {
    ground: await driver.computedIn(id, ".box", "background-color"),
    marker: await driver.computedIn(id, ".box", "border-inline-start-color"),
    markerWidth: await driver.computedIn(id, ".box", "border-inline-start-width"),
    radius: await driver.computedIn(id, ".box", "border-start-start-radius"),
    text: await driver.computed("b", "color"),
  };
}

function expectedLook(tone: Tone, theme: Palette): Record<string, string> {
  return {
    ground: tokenColour(`color-${tone}-bg`, theme),
    marker: tokenColour(`color-${tone}`, theme),
    markerWidth: px("bar-width"),
    radius: px("radius-row"),
    text: tokenColour("color-ink", theme),
  };
}

/** The distance from the top of the box's content box to the top of the body element `b`. */
async function bodyOffset(driver: Driver, id: string): Promise<number> {
  const content = await driver.contentBox(id, ".box");
  const body = await driver.box("b");
  return Math.round((body.y - content.y) * 1000) / 1000;
}

export const noticeScenarios: readonly NoticeScenario[] = [
  {
    name: "US1-1: a notice with no tone has the info look (ground info-bg, marker info at the bar width, ink text, radius-row) and tone reads info",
    run: async (driver, tag) => {
      await driver.mount(el(tag, 'id="n"', '<span id="b">Body text</span>'));
      assert.deepEqual({ look: await look(driver, "n"), tone: await driver.property("n", "tone") }, { look: expectedLook("info", "light"), tone: "info" }, "US1-1");
    },
  },
  {
    name: "US1-2: each tone in light and in dark has its ground --ocelle-color-<tone>-bg and its marker --ocelle-color-<tone>",
    run: async (driver, tag) => {
      await driver.mount(tones.map((tone) => el(tag, `id="n-${tone}" tone="${tone}"`, `<span id="b-${tone}">Body</span>`)).join(""));
      const seen: Record<string, unknown> = {};
      const expected: Record<string, unknown> = {};
      for (const theme of ["light", "dark"] as const) {
        await driver.theme(theme);
        for (const tone of tones) {
          seen[`${theme} ${tone}`] = { ground: await driver.computedIn(`n-${tone}`, ".box", "background-color"), marker: await driver.computedIn(`n-${tone}`, ".box", "border-inline-start-color"), text: await driver.computed(`b-${tone}`, "color") };
          expected[`${theme} ${tone}`] = { ground: tokenColour(`color-${tone}-bg`, theme), marker: tokenColour(`color-${tone}`, theme), text: tokenColour("color-ink", theme) };
        }
      }
      assert.deepEqual(seen, expected, "US1-2");
    },
  },
  {
    name: 'US1-3: tone="bogus" and tone="" have the info look and the info (polite) announcement politeness, with no console message',
    run: async (driver, tag) => {
      const snapshots = await insertion(driver, el(tag, 'id="n" announce tone="bogus"', '<span id="b">Saved</span>') + el(tag, 'id="e" announce tone=""', "Done"));
      announced(driver, only(snapshots, ["n"]), [polite("Saved")], "US1-3 bogus: announcements");
      announced(driver, only(snapshots, ["e"]), [polite("Done", "e")], "US1-3 empty: announcements");
      assert.deepEqual({ look: await look(driver, "n"), empty: await driver.computedIn("e", ".box", "background-color"), messages: await driver.messages() }, {
        look: expectedLook("info", "light"),
        empty: tokenColour("color-info-bg", "light"),
        messages: [],
      }, "US1-3");
    },
  },
  {
    name: 'Attributes (FR-001; analysis G5): tone="bogus" and size="huge" stay in the attribute as written while tone reads "info" and size reads "regular"',
    run: async (driver, tag) => {
      await driver.mount(el(tag, 'id="n" tone="bogus" size="huge"', "Body"));
      assert.deepEqual({ tone: [await driver.attribute("n", "tone"), await driver.property("n", "tone")], size: [await driver.attribute("n", "size"), await driver.property("n", "size")] }, { tone: ["bogus", "info"], size: ["huge", "regular"] }, "attributes");
    },
  },
  {
    name: "US1-4, SC-004: an absent heading (none, an empty or a whitespace element) renders no heading box: the body starts at the top of the content box, in both sizes, with and without forced colours",
    run: async (driver, tag) => {
      const headings = { none: "", empty: '<span slot="heading"></span>', blank: '<span slot="heading"> </span>' };
      const seen: Record<string, unknown> = {};
      const expected: Record<string, unknown> = {};
      for (const forced of ["none", "active"] as const) {
        for (const size of ["regular", "compact"] as const) {
          for (const [kind, heading] of Object.entries(headings)) {
            await driver.mount(el(tag, `id="n" size="${size}"`, `${heading}<div id="b">Body text</div>`));
            await driver.forcedColors(forced, "light");
            const part = await driver.box("n", '[part="heading"]');
            seen[`${forced} ${size} ${kind}`] = { offset: await bodyOffset(driver, "n"), heading: part.display, drawn: await visible(driver, "n") };
            expected[`${forced} ${size} ${kind}`] = { offset: 0, heading: "none", drawn: true };
          }
        }
      }
      await driver.forcedColors("none");
      assert.deepEqual(seen, expected, "US1-4, SC-004: heading absent");
    },
  },
  {
    name: "US1-5: a heading is drawn above the body in the heading style with the gap of its size, and removing it returns to the absent layout",
    run: async (driver, tag) => {
      const seen: Record<string, unknown> = {};
      const expected: Record<string, unknown> = {};
      const styles = { regular: { size: used("font-size-subhead"), line: "line-height-tight", gap: used("space-2") }, compact: { size: used("font-size-sm"), line: "line-height-compact", gap: used("space-1") } } as const;
      for (const size of ["regular", "compact"] as const) {
        await driver.mount(el(tag, `id="n" size="${size}"`, '<span slot="heading" id="h">Run failed</span><div id="b">Body text</div>'));
        const part = await driver.box("n", '[part="heading"]');
        const body = await driver.box("b");
        const content = await driver.contentBox("n", ".box");
        const style = styles[size];
        seen[size] = {
          above: Math.round((part.y - content.y) * 1000) / 1000,
          gap: Math.round((body.y - part.y - part.height) * 1000) / 1000,
          weight: await driver.computed("h", "font-weight"),
          fontSize: await driver.computed("h", "font-size"),
          lineHeight: await driver.computed("h", "line-height"),
        };
        expected[size] = { above: 0, gap: style.gap, weight: used("font-weight-strong"), fontSize: style.size, lineHeight: lineHeight(style.line, String(style.size)) };
        await driver.batch([{ op: "remove", id: "h" }]);
        seen[`${size} removed`] = { offset: await bodyOffset(driver, "n"), heading: (await driver.box("n", '[part="heading"]')).display };
        expected[`${size} removed`] = { offset: 0, heading: "none" };
      }
      assert.deepEqual(seen, expected, "US1-5");
    },
  },
  {
    name: 'US1-6: size="compact" sets the text in font-size-sm and line-height-compact with the compact padding, smaller on both axes; regular, none and any other value give the regular padding',
    run: async (driver, tag) => {
      const sizes = { compact: 'size="compact"', regular: 'size="regular"', none: "", other: 'size="huge"' };
      await driver.mount(Object.entries(sizes).map(([kind, attribute]) => el(tag, `id="n-${kind}" ${attribute}`, `<span id="b-${kind}">Body</span>`)).join(""));
      const seen: Record<string, unknown> = {};
      for (const kind of Object.keys(sizes)) {
        seen[kind] = { block: await driver.computedIn(`n-${kind}`, ".box", "padding-block-start"), inline: await driver.computedIn(`n-${kind}`, ".box", "padding-inline-end") };
      }
      seen.text = { fontSize: await driver.computed("b-compact", "font-size"), lineHeight: await driver.computed("b-compact", "line-height") };
      const regular = { block: px("space-3"), inline: px("space-4") };
      assert.deepEqual(seen, {
        compact: { block: px("space-2"), inline: px("space-3") },
        regular,
        none: regular,
        other: regular,
        text: { fontSize: px("font-size-sm"), lineHeight: lineHeight("line-height-compact", px("font-size-sm")) },
      }, "US1-6");
    },
  },
  {
    name: "US1-7: without announce and with no role or a role with no live politeness (note, region with a label, none), inserting, revealing, changing the text or the tone makes no live region node and announces nothing",
    run: async (driver, tag) => {
      const roles = { plain: "", note: 'role="note"', region: 'role="region" aria-label="Status"', none: 'role="none"' };
      await driver.mount('<main id="c"></main>');
      await driver.liveCapture.start("c");
      await driver.insert("c", Object.entries(roles).map(([kind, role]) => el(tag, `id="${kind}" ${role}`, `<span id="t-${kind}">First</span>`) + el(tag, `id="h-${kind}" hidden ${role}`, "Hidden")).join(""), "template");
      await settleAnnouncement(driver);
      await driver.batch(Object.keys(roles).flatMap((kind) => [{ op: "attribute", id: `h-${kind}`, name: "hidden", value: null } as const]));
      await settleAnnouncement(driver);
      await driver.batch(Object.keys(roles).map((kind) => ({ op: "text", id: `t-${kind}`, text: "Second" }) as const));
      await settleAnnouncement(driver);
      await driver.batch(Object.keys(roles).map((kind) => ({ op: "attribute", id: kind, name: "tone", value: "danger" }) as const));
      const snapshots = await driver.liveCapture.stop();
      const regions = snapshots.flatMap((snapshot) => snapshot.regions);
      announced(driver, snapshots, [], "US1-7: announcements");
      assert.deepEqual({ regions, drawn: await Promise.all(Object.keys(roles).map((kind) => visible(driver, kind))), roles: [await driver.hostRole("note"), await driver.hostRole("region")] }, { regions: [], drawn: [true, true, true, true], roles: ["note", "region"] }, "US1-7");
    },
  },
  ...ways.map(
    (how): NoticeScenario => ({
      name: `US1-8 ${how}: an announcing success notice inserted after parsing is announced politely, once`,
      run: async (driver, tag) => {
        const snapshots = await insertion(driver, announcing(tag), how);
        announced(driver, snapshots, [polite("Saved")], `US1-8 ${how}: announcements`);
      },
    }),
  ),
  {
    name: 'US1-8 interactive: a notice inserted while document.readyState is "interactive" is an insertion, announced once, its copy written no earlier than the pre-load W after the insertion',
    run: async (driver, tag) => {
      await driver.mount('<main id="c"></main>');
      const at = await driver.insertInteractive("c", announcing(tag));
      const snapshots = await driver.liveCapture.stop();
      announced(driver, snapshots, [polite("Saved")], "US1-8 interactive: announcements");
      const written = snapshots.find((snapshot) => snapshot.regions.some((region) => region.host === "n" && region.text === "Saved"));
      assert.deepEqual({ written: written !== undefined, early: (written?.at ?? Number.NEGATIVE_INFINITY) - at < driver.W.loading }, { written: true, early: false }, "US1-8 interactive: the copy's time");
    },
  },
  ...ways.map(
    (how): NoticeScenario => ({
      name: `US1-9 ${how}: an announcing danger notice inserted after parsing is announced assertively, once`,
      run: async (driver, tag) => {
        const snapshots = await insertion(driver, announcing(tag, "Run failed", 'announce tone="danger"'), how);
        announced(driver, snapshots, [assertive("Run failed")], `US1-9 ${how}: announcements`);
      },
    }),
  ),
  {
    name: "US1-9 warning: an announcing warning notice inserted after parsing is announced assertively, once",
    run: async (driver, tag) => {
      const snapshots = await insertion(driver, announcing(tag, "Disk almost full", 'announce tone="warning"'));
      announced(driver, snapshots, [assertive("Disk almost full")], "US1-9 warning: announcements");
    },
  },
  {
    name: "US1-10: an announcing notice that is part of the page as first loaded is not announced; a later change of its text is announced once",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce tone="success"', '<span id="t">Saved</span>'), async () => {
        await settleAnnouncement(driver);
        await driver.batch([{ op: "text", id: "t", text: "Saved again" }]);
      });
      announced(driver, snapshots, [polite("Saved again")], "US1-10: announcements");
    },
  },
  {
    name: "US1-10 first load only: an announcing notice that is part of the page as first loaded announces nothing, its region present and its text visible",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce tone="success"', "Saved"));
      announced(driver, snapshots, [], "US1-10 first load only: announcements");
      assert.deepEqual({ region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { region: true, drawn: true }, "US1-10 first load only");
    },
  },
  {
    name: "US1-11 text: when the host replaces a text node of the body, heading and body are announced once, joined by one space",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', '<span slot="heading" id="h">Run 7</span><span id="t">running</span>'), async () => {
        await driver.batch([{ op: "text", id: "t", text: "failed" }]);
      });
      announced(driver, snapshots, [polite("Run 7 failed")], "US1-11 text: announcements");
      writtenAfterFirstRender(driver, snapshots, "Run 7 failed", "US1-11 text");
    },
  },
  {
    name: "US1-11 heading: when the host changes the heading, heading and body are announced once",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', '<span slot="heading" id="h">Run 7</span><span id="t">failed</span>'), async () => {
        await driver.batch([{ op: "text", id: "h", text: "Run 8" }]);
      });
      announced(driver, snapshots, [polite("Run 8 failed")], "US1-11 heading: announcements");
    },
  },
  {
    name: "US1-11 same text: the host setting the same text again announces nothing, the region present and the text visible",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', "\n  Saved\n"), async () => {
        await driver.batch([{ op: "text", id: "n", text: "Saved" }]);
      });
      announced(driver, snapshots, [], "US1-11 same text: announcements");
      assert.deepEqual({ region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { region: true, drawn: true }, "US1-11 same text");
    },
  },
  {
    name: "US1-11 re-render: a size change and a theme change announce nothing, the region present and the text visible",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', "Saved"), async () => {
        await driver.setAttribute("n", "size", "compact");
        await driver.theme("dark");
      });
      announced(driver, snapshots, [], "US1-11 re-render: announcements");
      assert.deepEqual({ region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { region: true, drawn: true }, "US1-11 re-render");
    },
  },
  {
    name: "US1-11 move: moving the notice within the page in one task announces nothing, the region present and the text visible",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, `<div id="d"></div>${fl('id="n" announce', "Saved")}`, async () => {
        await driver.batch([{ op: "move", id: "n", to: "d" }]);
      });
      announced(driver, snapshots, [], "US1-11 move: announcements");
      assert.deepEqual({ region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { region: true, drawn: true }, "US1-11 move");
    },
  },
  ...([false, true] as const).map(
    (focused): NoticeScenario => ({
      name: `US1-12${focused ? " focused link" : ""}: info to danger with the same text is announced once, assertively; danger to warning announces nothing${focused ? "; the slotted link stays focused and in the tree" : ""}`,
      run: async (driver, tag) => {
        const snapshots = await loaded(driver, tag, fl('id="n" announce tone="info"', 'Saved <a id="l" href="#details">details</a>'), async () => {
          if (focused) await driver.batch([{ op: "focus", id: "l" }]);
          await driver.setAttribute("n", "tone", "danger");
          await settleAnnouncement(driver);
          await driver.setAttribute("n", "tone", "warning");
        });
        announced(driver, snapshots, [assertive("Saved details")], `US1-12${focused ? " focused link" : ""}: announcements`);
        const link = (await driver.axSubtree("n")).filter((node) => node.role === "link").map((node) => node.name);
        assert.deepEqual({ focus: await driver.focusPath(), link }, { focus: focused ? ["a#l"] : [], link: ["details"] }, "US1-12: the link");
      },
    }),
  ),
  {
    name: "US1-13 one task: three text changes in one task announce only the final text, once",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', "Ready"), async () => {
        await driver.batch([
          { op: "text", id: "n", text: "One" },
          { op: "text", id: "n", text: "Two" },
          { op: "text", id: "n", text: "Three" },
        ]);
      });
      announced(driver, snapshots, [polite("Three")], "US1-13 one task: announcements");
      writtenAfterFirstRender(driver, snapshots, "Three", "US1-13 one task");
    },
  },
  {
    name: "US1-13 100 ms apart: changes A to B, then B to C in a later task W/3 later, announce only C, once",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', "A"), async () => {
        await driver.batch([{ op: "text", id: "n", text: "B" }]);
        expectGap(await driver.after(driver.W.loaded / 3), driver.W.loaded / 3, driver.W.loaded, "US1-13 100 ms apart");
        await driver.batch([{ op: "text", id: "n", text: "C" }]);
      });
      announced(driver, snapshots, [polite("C")], "US1-13 100 ms apart: announcements");
    },
  },
  {
    name: "US1-13 A, B, A: a text that goes from A to B and back to A within the wait announces nothing, the region present and the text visible",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', "A"), async () => {
        await driver.batch([{ op: "text", id: "n", text: "B" }]);
        expectGap(await driver.after(driver.W.loaded / 3), driver.W.loaded / 3, driver.W.loaded, "US1-13 A, B, A");
        await driver.batch([{ op: "text", id: "n", text: "A" }]);
      });
      announced(driver, snapshots, [], "US1-13 A, B, A: announcements");
      assert.deepEqual({ region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { region: true, drawn: true }, "US1-13 A, B, A");
    },
  },
  {
    name: "US1-13 10 ms after a write: the earlier announcement still counts and the new text is announced once after it",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', "A"), async () => {
        await driver.batch([{ op: "text", id: "n", text: "B" }]);
        // The write of a change right after a first load comes no later than the pre-load `W` after it (R-02 step 2:
        // the wait ends `W` after the trigger and no earlier than the pre-load `W` after the region's first render).
        expectGap(await driver.after(driver.W.loading), driver.W.loading, 2 * driver.W.loading, "US1-13 10 ms after a write: the write");
        expectGap(await driver.after(driver.W.loaded / 30), driver.W.loaded / 30, driver.W.loaded, "US1-13 10 ms after a write");
        await driver.batch([{ op: "text", id: "n", text: "C" }]);
      });
      announced(driver, snapshots, [polite("B"), polite("C")], "US1-13 10 ms after a write: announcements");
    },
  },
  {
    name: "US1-13 hold: an announced copy stays in the region, settled, for the hold H and is then removed, which announces nothing",
    run: async (driver, tag) => {
      await driver.mount('<main id="c"></main>');
      await driver.firstLoad("c", fl('id="n" announce', "A"), tag);
      await driver.batch([{ op: "text", id: "n", text: "B" }]);
      // `stop` first waits for the hold to have passed since the capture started: the wait to the write (at most the
      // pre-load W from the region's first render, R-02 step 2), H, and W more.
      const snapshots = await driver.liveCapture.stop({ atLeast: driver.W.loading + driver.W.loaded + driver.H });
      const text = (snapshot: Snapshot | undefined): string | undefined => snapshot?.regions.find((region) => region.host === "n")?.text;
      const from = snapshots.findIndex((snapshot) => text(snapshot) === "B");
      const until = snapshots.findIndex((snapshot, index) => index > from && text(snapshot) === "");
      const held = from < 0 || until < 0 ? -1 : (snapshots[until]?.at ?? 0) - (snapshots[from]?.at ?? 0);
      announced(driver, snapshots, [polite("B")], "US1-13 hold: announcements");
      assert.deepEqual({ held: held >= driver.H - 5 && held < driver.H + driver.W.loaded, final: text(snapshots.at(-1)) }, { held: true, final: "" }, `US1-13 hold: held ${String(held)} ms`);
    },
  },
  {
    name: "US1-14: with announce removed later changes are not announced; set again, the current text is not announced and the next change is",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', "A"), async () => {
        await driver.setAttribute("n", "announce", null);
        await driver.batch([{ op: "text", id: "n", text: "B" }]);
        await settleAnnouncement(driver);
        await driver.setAttribute("n", "announce", "");
        await settleAnnouncement(driver);
        await driver.batch([{ op: "text", id: "n", text: "C" }]);
      });
      announced(driver, snapshots, [polite("C")], "US1-14: announcements");
    },
  },
  {
    name: 'US1-15 status insertion: a role="status" danger notice without announce inserted after parsing is announced politely, once, by one live region node, the host a status node',
    run: async (driver, tag) => {
      const snapshots = await insertion(driver, el(tag, 'id="n" role="status" tone="danger"', "Saved"));
      announced(driver, snapshots, [polite("Saved")], "US1-15 status insertion: announcements");
      assert.strictEqual(await driver.hostRole("n"), "status", "US1-15 status insertion: host role");
    },
  },
  {
    name: 'US1-15 status reveal: a role="status" notice first loaded hidden and revealed is announced politely, once',
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" role="status" hidden', "Saved"), async () => {
        await driver.setAttribute("n", "hidden", null);
      });
      announced(driver, snapshots, [polite("Saved")], "US1-15 status reveal: announcements");
    },
  },
  {
    name: 'US1-15 status text change: a text change of a role="status" notice is announced once by exactly one live region node (no nested or host region)',
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" role="status"', '<span id="t">Saving</span>'), async () => {
        // The first text is current for longer than D first, so a second region holding the content would count.
        await settleAnnouncement(driver);
        await driver.batch([{ op: "text", id: "t", text: "Saved" }]);
      });
      announced(driver, snapshots, [polite("Saved")], "US1-15 status text change: announcements");
      assert.strictEqual(await driver.hostRole("n"), "status", "US1-15 status text change: host role");
    },
  },
  {
    name: 'US1-15 alert insertion: a role="alert" notice inserted after parsing is left to the platform alert event: no live region announces, the host an alert node with its region present and its text visible',
    run: async (driver, tag) => {
      const snapshots = await insertion(driver, el(tag, 'id="n" role="alert"', "Run failed"));
      announced(driver, snapshots, [], "US1-15 alert insertion: announcements");
      assert.deepEqual({ role: await driver.hostRole("n"), region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { role: "alert", region: true, drawn: true }, "US1-15 alert insertion");
    },
  },
  {
    name: 'US1-15 alert reveal: a role="alert" notice first loaded hidden and revealed is left to the platform alert event: no live region announces, the host an alert node',
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" role="alert" hidden', "Run failed"), async () => {
        await driver.setAttribute("n", "hidden", null);
      });
      announced(driver, snapshots, [], "US1-15 alert reveal: announcements");
      assert.deepEqual({ role: await driver.hostRole("n"), region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { role: "alert", region: true, drawn: true }, "US1-15 alert reveal");
    },
  },
  {
    name: 'US1-15 server-rendered alert: a role="alert" notice that is part of the page as first loaded is not announced, the host an alert node',
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" role="alert"', "Run failed"));
      announced(driver, snapshots, [], "US1-15 server-rendered alert: announcements");
      assert.deepEqual({ role: await driver.hostRole("n"), region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { role: "alert", region: true, drawn: true }, "US1-15 server-rendered alert");
    },
  },
  {
    name: 'US1-15 runtime roles: role="alert" set at runtime announces nothing; its next text change is announced assertively once; then status announces the text politely once; back to alert announces nothing; removing the role announces nothing and later changes are not announced',
    run: async (driver, tag) => {
      const markup = fl('id="n"', '<span id="t">Queued</span> <a id="l" href="#run">run</a>');
      const roleAlert = await loaded(driver, tag, markup, async () => {
        await driver.setAttribute("n", "role", "alert");
      });
      announced(driver, roleAlert, [], "US1-15 runtime roles, alert set: announcements");
      const first = { role: await driver.hostRole("n"), region: regionPresent(roleAlert, "n") };
      await driver.liveCapture.start("c");
      await driver.batch([{ op: "text", id: "t", text: "Running" }]);
      const change = await driver.liveCapture.stop();
      announced(driver, change, [assertive("Running run")], "US1-15 runtime roles, text change: announcements");
      await driver.liveCapture.start("c");
      await driver.setAttribute("n", "role", "status");
      const toStatus = await driver.liveCapture.stop();
      announced(driver, toStatus, [polite("Running run")], "US1-15 runtime roles, alert to status: announcements");
      await driver.liveCapture.start("c");
      await driver.setAttribute("n", "role", "alert");
      const back = await driver.liveCapture.stop();
      announced(driver, back, [], "US1-15 runtime roles, back to alert: announcements");
      const second = { role: await driver.hostRole("n"), region: regionPresent(back, "n") };
      await driver.liveCapture.start("c");
      await driver.setAttribute("n", "role", null);
      await driver.batch([{ op: "text", id: "t", text: "Done" }]);
      const removed = await driver.liveCapture.stop();
      announced(driver, removed, [], "US1-15 runtime roles, role removed: announcements");
      assert.deepEqual({ first, second, drawn: await visible(driver, "n"), regions: removed.at(-1)?.regions ?? null }, {
        first: { role: "alert", region: true },
        second: { role: "alert", region: true },
        drawn: true,
        regions: [],
      }, "US1-15 runtime roles");
    },
  },
  {
    name: 'US1-15 alert to status, focused link: the change of role="alert" to status announces the current text politely once while the slotted link stays focused and in the tree',
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" role="alert"', 'Run failed <a id="l" href="#run">View run</a>'), async () => {
        await driver.batch([{ op: "focus", id: "l" }]);
        await driver.setAttribute("n", "role", "status");
      });
      announced(driver, snapshots, [polite("Run failed View run")], "US1-15 alert to status, focused link: announcements");
      const link = (await driver.axSubtree("n")).filter((node) => node.role === "link").map((node) => node.name);
      assert.deepEqual({ focus: await driver.focusPath(), link, role: await driver.hostRole("n") }, { focus: ["a#l"], link: ["View run"], role: "status" }, "US1-15 alert to status, focused link");
    },
  },
  {
    name: 'US1-15 status to alert: a change of the host role from status to alert on an announcing notice is left to the platform alert event: no live region announces, the host an alert node',
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce role="status" tone="danger"', "Run failed"), async () => {
        await driver.setAttribute("n", "role", "alert");
      });
      announced(driver, snapshots, [], "US1-15 status to alert: announcements");
      assert.deepEqual({ role: await driver.hostRole("n"), region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { role: "alert", region: true, drawn: true }, "US1-15 status to alert");
    },
  },
  {
    name: "US1-15 note role: an announcing notice with role=\"note\" behaves as with no role: inserted, it is announced with the tone's politeness, the host a note node",
    run: async (driver, tag) => {
      const snapshots = await insertion(driver, el(tag, 'id="n" announce role="note" tone="warning"', "Disk almost full"));
      announced(driver, snapshots, [assertive("Disk almost full")], "US1-15 note role: announcements");
      assert.strictEqual(await driver.hostRole("n"), "note", "US1-15 note role: host role");
    },
  },
  {
    name: 'US1-15 alert, text set in the same task after insertion: no live region announces, the host an alert node',
    run: async (driver, tag) => {
      await driver.mount('<main id="c"></main>');
      await driver.liveCapture.start("c");
      await driver.batch([
        { op: "insert", container: "c", markup: el(tag, 'id="n" role="alert"', "") },
        { op: "text", id: "n", text: "Run failed" },
      ]);
      const snapshots = await driver.liveCapture.stop();
      assert.strictEqual(regionPresent(snapshots, "n"), true, "US1-15 alert, text after insertion: the region");
      announced(driver, snapshots, [], "US1-15 alert, text after insertion: announcements");
      assert.deepEqual({ role: await driver.hostRole("n"), region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { role: "alert", region: true, drawn: true }, "US1-15 alert, text after insertion");
    },
  },
  {
    name: 'US1-15 alert, text set in the same task after the reveal: no live region announces, the host an alert node',
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" role="alert" hidden', ""), async () => {
        await driver.batch([
          { op: "attribute", id: "n", name: "hidden", value: null },
          { op: "text", id: "n", text: "Run failed" },
        ]);
      });
      announced(driver, snapshots, [], "US1-15 alert, text after reveal: announcements");
      assert.deepEqual({ role: await driver.hostRole("n"), region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { role: "alert", region: true, drawn: true }, "US1-15 alert, text after reveal");
    },
  },
  {
    name: 'US1-15 alert, text set in the same task after the role change to alert: no live region announces, the host an alert node',
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce role="status"', "Queued"), async () => {
        await driver.batch([
          { op: "attribute", id: "n", name: "role", value: "alert" },
          { op: "text", id: "n", text: "Run failed" },
        ]);
      });
      announced(driver, snapshots, [], "US1-15 alert, text after role change: announcements");
      assert.deepEqual({ role: await driver.hostRole("n"), region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { role: "alert", region: true, drawn: true }, "US1-15 alert, text after role change");
    },
  },
  {
    name: 'US1-15 alert, tone changed in the same task after insertion: no live region announces, the host an alert node',
    run: async (driver, tag) => {
      await driver.mount('<main id="c"></main>');
      await driver.liveCapture.start("c");
      await driver.batch([
        { op: "insert", container: "c", markup: el(tag, 'id="n" role="alert" tone="info"', "Run failed") },
        { op: "property", id: "n", name: "tone", value: "danger" },
      ]);
      const snapshots = await driver.liveCapture.stop();
      assert.strictEqual(regionPresent(snapshots, "n"), true, "US1-15 alert, tone after insertion: the region");
      announced(driver, snapshots, [], "US1-15 alert, tone after insertion: announcements");
      assert.deepEqual({ role: await driver.hostRole("n"), region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { role: "alert", region: true, drawn: true }, "US1-15 alert, tone after insertion");
    },
  },
  {
    name: 'US1-15 inserted as alert, changed to status in the same task: the current text is announced politely once, the host a status node',
    run: async (driver, tag) => {
      await driver.mount('<main id="c"></main>');
      await driver.liveCapture.start("c");
      await driver.batch([
        { op: "insert", container: "c", markup: el(tag, 'id="n" role="alert"', "Run failed") },
        { op: "attribute", id: "n", name: "role", value: "status" },
      ]);
      const snapshots = await driver.liveCapture.stop();
      announced(driver, snapshots, [polite("Run failed")], "US1-15 inserted as alert, to status: announcements");
      assert.strictEqual(await driver.hostRole("n"), "status", "US1-15 inserted as alert, to status: host role");
    },
  },
  {
    name: 'US1-15 revealed as alert, changed to status in the same task: the current text is announced politely once, the host a status node',
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" role="alert" hidden', "Run failed"), async () => {
        await driver.batch([
          { op: "attribute", id: "n", name: "hidden", value: null },
          { op: "attribute", id: "n", name: "role", value: "status" },
        ]);
      });
      announced(driver, snapshots, [polite("Run failed")], "US1-15 revealed as alert, to status: announcements");
      assert.strictEqual(await driver.hostRole("n"), "status", "US1-15 revealed as alert, to status: host role");
    },
  },
  {
    name: "US1-16: in forced colours every tone's box has a border of the border width and its marker at the bar width, in CanvasText, and the text is CanvasText on Canvas",
    run: async (driver, tag) => {
      await driver.mount(tones.map((tone) => el(tag, `id="n-${tone}" tone="${tone}"`, `<span id="b-${tone}">Body</span>`)).join(""));
      const seen: Record<string, unknown> = {};
      const expected: Record<string, unknown> = {};
      for (const palette of ["light", "dark"] as const) {
        await driver.forcedColors("active", palette);
        const canvasText = await driver.resolveColour("CanvasText");
        const canvas = await driver.resolveColour("Canvas");
        for (const tone of tones) {
          seen[`${palette} ${tone}`] = {
            border: [await driver.computedIn(`n-${tone}`, ".box", "border-block-start-width"), await driver.computedIn(`n-${tone}`, ".box", "border-block-start-color")],
            marker: [await driver.computedIn(`n-${tone}`, ".box", "border-inline-start-width"), await driver.computedIn(`n-${tone}`, ".box", "border-inline-start-color")],
            ground: await driver.computedIn(`n-${tone}`, ".box", "background-color"),
            text: await driver.computed(`b-${tone}`, "color"),
          };
          expected[`${palette} ${tone}`] = { border: [px("border-width"), canvasText], marker: [px("bar-width"), canvasText], ground: canvas, text: canvasText };
        }
      }
      await driver.forcedColors("none");
      assert.deepEqual(seen, expected, "US1-16");
    },
  },
  {
    name: "US1-17 inserted hidden: a hidden notice has no box and announces nothing while hidden; removing hidden announces its current text once",
    run: async (driver, tag) => {
      await driver.mount('<main id="c"></main>');
      await driver.liveCapture.start("c");
      await driver.insert("c", el(tag, 'id="n" announce hidden', "Saved"), "innerHTML");
      await settleAnnouncement(driver);
      const hidden = { box: (await driver.box("n")).display, inner: (await driver.box("n", ".box")).height };
      await driver.setAttribute("n", "hidden", null);
      const snapshots = await driver.liveCapture.stop();
      announced(driver, snapshots, [polite("Saved")], "US1-17 inserted hidden: announcements");
      assert.deepEqual({ hidden, drawn: await visible(driver, "n") }, { hidden: { box: "none", inner: 0 }, drawn: true }, "US1-17 inserted hidden");
    },
  },
  {
    name: "US1-17 first loaded hidden: a hidden announcing notice of the page as first loaded is announced once when revealed",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce hidden', "Saved"), async () => {
        await driver.setAttribute("n", "hidden", null);
      });
      announced(driver, snapshots, [polite("Saved")], "US1-17 first loaded hidden: announcements");
    },
  },
  {
    name: "US1-17 announced, hidden and revealed with the same text: the reveal announces it again, once",
    run: async (driver, tag) => {
      await driver.mount('<main id="c"></main>');
      await driver.liveCapture.start("c");
      await driver.insert("c", announcing(tag), "innerHTML");
      await settleAnnouncement(driver);
      await driver.setAttribute("n", "hidden", "");
      await settleAnnouncement(driver);
      await driver.setAttribute("n", "hidden", null);
      const snapshots = await driver.liveCapture.stop();
      announced(driver, snapshots, [polite("Saved"), polite("Saved")], "US1-17 announced, hidden and revealed: announcements");
    },
  },
  {
    name: "US1-17 changes while hidden: text changes made while hidden are not announced on their own, only the text current at the reveal is, once",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', "A"), async () => {
        await driver.setAttribute("n", "hidden", "");
        await driver.batch([{ op: "text", id: "n", text: "B" }]);
        await settleAnnouncement(driver);
        await driver.batch([{ op: "text", id: "n", text: "C" }]);
        await settleAnnouncement(driver);
        await driver.setAttribute("n", "hidden", null);
      });
      announced(driver, snapshots, [polite("C")], "US1-17 changes while hidden: announcements");
    },
  },
  {
    name: "US1-18: slotted inline content keeps its own semantics (the link a link, reached by Tab; the labelled icon an image) and the content inherits the notice's text colour",
    run: async (driver, tag) => {
      await driver.mount(`<button id="before" type="button">Before</button>${el(tag, 'id="n"', '<ocelle-icon id="i" name="arrow-end" label="Error"></ocelle-icon> <span id="b">Run failed.</span> <a id="l" href="#run">View run</a>')}`);
      const nodes = (await driver.axSubtree("n")).filter((node) => node.role === "link" || node.role === "image").map(({ role, name }) => ({ role, name }));
      await driver.press("before", "Tab");
      assert.deepEqual({ nodes, focus: await driver.focusPath(), icon: await driver.computed("i", "color"), text: await driver.computed("b", "color") }, {
        nodes: [
          { role: "image", name: "Error" },
          { role: "link", name: "View run" },
        ],
        focus: ["a#l"],
        icon: tokenColour("color-ink", "light"),
        text: tokenColour("color-ink", "light"),
      }, "US1-18");
    },
  },
  {
    name: "US1-19: an icon label counts and an aria-hidden span does not; a link text change, aria-hidden on the link and an href change announce, announce and do not",
    run: async (driver, tag) => {
      await driver.mount('<main id="c"></main>');
      await driver.liveCapture.start("c");
      await driver.insert(
        "c",
        el(tag, 'id="n" announce', '<ocelle-icon name="arrow-end" label="Error"></ocelle-icon> Run failed. <a id="l" href="/runs/7">View run 7</a><span aria-hidden="true"> (details)</span>'),
        "innerHTML",
      );
      await settleAnnouncement(driver);
      await driver.batch([{ op: "text", id: "l", text: "View run 8" }]);
      await settleAnnouncement(driver);
      await driver.setAttribute("l", "aria-hidden", "true");
      await settleAnnouncement(driver);
      await driver.setAttribute("l", "href", "/runs/8");
      const snapshots = await driver.liveCapture.stop();
      announced(driver, snapshots, [polite("Error Run failed. View run 7"), polite("Error Run failed. View run 8"), polite("Error Run failed.")], "US1-19: announcements");
    },
  },
  {
    name: "Edge case, later task: a notice removed and inserted again in a later task is a new insertion and is announced",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', "Saved"), async () => {
        await driver.batch([{ op: "remove", id: "n" }]);
        await driver.laterTask();
        await driver.batch([{ op: "move", id: "n", to: "c" }]);
      });
      announced(driver, snapshots, [polite("Saved")], "Edge case, later task: announcements");
    },
  },
  {
    name: 'Edge case, whitespace: "Saved" changed to " Saved " announces nothing, the region present and the text visible',
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="n" announce', "Saved"), async () => {
        await driver.batch([{ op: "text", id: "n", text: " Saved " }]);
      });
      announced(driver, snapshots, [], "Edge case, whitespace: announcements");
      assert.deepEqual({ region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { region: true, drawn: true }, "Edge case, whitespace");
    },
  },
  {
    name: "Edge case, empty notice: an announcing notice with no body and no heading is a box of the regular padding only and announces nothing, its region present",
    run: async (driver, tag) => {
      const snapshots = await insertion(driver, el(tag, 'id="n" announce', ""));
      announced(driver, snapshots, [], "Edge case, empty notice: announcements");
      const box = await driver.box("n", ".box");
      assert.deepEqual({ region: regionPresent(snapshots, "n"), height: box.height, wide: box.width > 0 }, { region: true, height: 2 * Number(used("space-3")), wide: true }, "Edge case, empty notice");
    },
  },
  {
    name: "Edge case, two notices changed in one task: each announces its own text once",
    run: async (driver, tag) => {
      const snapshots = await loaded(driver, tag, fl('id="a" announce', "A1") + fl('id="b" announce tone="danger"', "B1"), async () => {
        await driver.batch([
          { op: "text", id: "a", text: "A2" },
          { op: "text", id: "b", text: "B2" },
        ]);
      });
      announced(driver, only(snapshots, ["a"]), [polite("A2", "a")], "Edge case, two notices: a");
      announced(driver, only(snapshots, ["b"]), [assertive("B2", "b")], "Edge case, two notices: b");
      assert.deepEqual(only(snapshots, ["a", "b"]).flatMap((snapshot) => snapshot.regions.map((region) => region.host)).filter((host, index, all) => all.indexOf(host) === index).sort(), ["a", "b"], "Edge case, two notices: hosts");
    },
  },
  {
    name: "Edge case, long unbroken text: a long unbroken heading and body wrap inside the box in a narrower container, the host within the container, the box growing in block size",
    run: async (driver, tag) => {
      const long = "x".repeat(120);
      await driver.mount(`<div id="w">${el(tag, 'id="n"', `<span slot="heading" id="h">${long}</span><span id="b">${long}</span>`)}</div>`);
      await driver.style("w", "inline-size", "160px");
      const container = await driver.box("w");
      const host = await driver.box("n");
      const box = await driver.box("n", ".box");
      const lines = [...(await driver.lines("h")), ...(await driver.lines("b"))];
      const inside = lines.every((line) => line.x >= box.x - 0.5 && line.x + line.width <= box.x + box.width + 0.5);
      assert.deepEqual({ within: host.x >= container.x && host.x + host.width <= container.x + container.width + 0.5, boxWithin: box.x + box.width <= container.x + container.width + 0.5, inside, wrapped: (await driver.lines("b")).length > 1 && (await driver.lines("h")).length > 1 }, { within: true, boxWithin: true, inside: true, wrapped: true }, "Edge case, long unbroken text");
    },
  },
  {
    name: "Edge case, two copies: a second class defined for the tag through the guarded registration leaves the first, and a notice created afterwards renders and announces",
    run: async (driver, tag) => {
      await driver.mount('<main id="c"></main>');
      await driver.defineSecond(tag);
      await driver.liveCapture.start("c");
      await driver.insert("c", announcing(tag), "innerHTML");
      const snapshots = await driver.liveCapture.stop();
      announced(driver, snapshots, [polite("Saved")], "Edge case, two copies: announcements");
      assert.strictEqual(await visible(driver, "n"), true, "Edge case, two copies: drawn");
    },
  },
  {
    name: 'Edge case, hidden ancestor: an announcing notice in a container with hidden, in a closed details and in a display: none panel, then shown, announces nothing, its region present and its text visible; the same with role="alert", the host an alert node',
    run: async (driver, tag) => {
      const markup = (prefix: string, attributes: string): string =>
        `<div id="${prefix}p1" hidden>${fl(`id="${prefix}1" ${attributes}`, "One")}</div>` +
        `<details id="${prefix}p2"><summary>More</summary>${fl(`id="${prefix}2" ${attributes}`, "Two")}</details>` +
        `<div id="${prefix}p3">${fl(`id="${prefix}3" ${attributes}`, "Three")}</div>`;
      const hosts = ["a1", "a2", "a3", "r1", "r2", "r3"];
      const snapshots = await loaded(driver, tag, markup("a", "announce") + markup("r", 'role="alert"'), async () => {
        await driver.style("ap3", "display", "none");
        await driver.style("rp3", "display", "none");
        await settleAnnouncement(driver);
        await driver.batch(["a", "r"].flatMap((prefix) => [
          { op: "attribute", id: `${prefix}p1`, name: "hidden", value: null } as const,
          { op: "attribute", id: `${prefix}p2`, name: "open", value: "" } as const,
        ]));
        await driver.style("ap3", "display", "block");
        await driver.style("rp3", "display", "block");
      });
      announced(driver, only(snapshots, hosts), [], "Edge case, hidden ancestor: announcements");
      assert.deepEqual({
          regions: hosts.map((host) => regionPresent(snapshots, host)),
          drawn: await Promise.all(hosts.map((host) => visible(driver, host))),
          roles: [await driver.hostRole("r1"), await driver.hostRole("r2"), await driver.hostRole("r3")],
        }, { regions: hosts.map(() => true), drawn: hosts.map(() => true), roles: ["alert", "alert", "alert"] }, "Edge case, hidden ancestor");
    },
  },
];

/** The first-load cells that need the in-process `"loading"` path (US1-10 under `registerFirstLoad` and `drive.readyState`). */
export const noticeLoadingScenario = {
  name: 'US1-10 loading: an announcing notice upgraded by the registration while document.readyState reads "loading" announces nothing, under both rules, its region present and its text visible',
  run: async (driver: Driver & { readonly readyState: (value: DocumentReadyState | null) => Promise<void> }, tag: string): Promise<void> => {
    await driver.mount('<main id="c"></main>');
    await driver.readyState("loading");
    await driver.firstLoad("c", fl('id="n" announce tone="success"', "Saved"), tag);
    const snapshots = await driver.liveCapture.stop();
    await driver.readyState(null);
    announced(driver, snapshots, [], "US1-10 loading: announcements");
    assert.deepEqual({ loading: snapshots.every((snapshot) => !snapshot.loaded), region: regionPresent(snapshots, "n"), drawn: await visible(driver, "n") }, { loading: true, region: true, drawn: true }, "US1-10 loading");
  },
} as const;

/** A scenario by name, for the plant rows. */
export function noticeScenario(prefix: string): NoticeScenario {
  const found = noticeScenarios.find((scenario) => scenario.name.startsWith(prefix));
  if (found === undefined) throw new Error(`no notice scenario ${prefix}`);
  return found;
}
