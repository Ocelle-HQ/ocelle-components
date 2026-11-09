import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { close, computed, scales, suite, themes } from "./pages.ts";
import { violations } from "./serve.ts";

// The identifier-wrap hook in Chromium (003 spec User Story 4 scenarios 1 to 4; FR-005, FR-020, FR-022, SC-005;
// research.md R-09, R-10; data-model.md § Identifier wrap; reviews/phase-2/spike.md). wrap.html holds two 300 px
// grids of two 1fr tracks (minmax(auto, 1fr)), each with a 120-character unbroken identifier in one cell and a short
// text in the other: the identifier carries the hook in the first grid and not in the second. Then an identifier with
// the undocumented value data-ocelle-wrap="true", and a hooked identifier in a span of a paragraph inside a prose
// container and inside a compact region. The page is served under the strict CSP by serve.ts, which links a plant
// stylesheet after base.css on request (`after=plants/<name>`). Every scenario runs in both themes, under
// emulateMedia({ colorScheme }) light and dark (FR-022), and the column, wrapping and containment assertions also at
// 320 px and at 200% zoom. Each guard (a "does not") shares its test with the positive assertion it guards and runs
// once more with its plant, where its helper must report the problem (SC-002, R-10). Expected values are transcribed
// by hand from the spec, never read from the token source or base.css.

/** The fixture's identifier: 120 lowercase hexadecimal characters, with no break opportunity of its own. */
const identifier = "43c5f6d836a73b5e05c4365c8c0aa95608680b8a4c259be79ab4be0ffe21dc0588a6d51b159288da679bc61ac5ad989cde682c52925da0a0a0ec9a33";
/** The sizes every layout assertion runs at: 1280 px, 320 px, and 200% zoom (half the width at scale 2). */
const sizes = [
  ["1280 px", 1280, 1],
  ["320 px", 320, 1],
  ["200%", 640, 2],
] as const;

const { open } = suite();

/** The rendered widths of the identifier's cell and of the short text's cell, the grid's two columns. */
function columns(page: Page, id: string, short: string): Promise<{ readonly id: number; readonly short: number }> {
  return page.evaluate(
    ({ id, short }) => {
      const width = (each: string): number => {
        const element = document.getElementById(each);
        if (element === null) throw new Error(`no #${each}`);
        return element.getBoundingClientRect().width;
      };
      return { id: width(id), short: width(short) };
    },
    { id, short },
  );
}

/**
 * The problems of a hooked identifier that must wrap inside its box: an ellipsis, clipped text, a single line, a line
 * outside its box (its cell or paragraph) or outside the viewport. `box` is the id of the box it must stay in.
 */
function wrapProblems(page: Page, id: string, box: string): Promise<string[]> {
  return page.evaluate(
    ({ id, box }) => {
      const element = document.getElementById(id);
      const container = document.getElementById(box)?.getBoundingClientRect();
      if (element === null || container === undefined) throw new Error(`no #${id} or no #${box}`);
      const range = document.createRange();
      range.selectNodeContents(element);
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 0);
      const style = getComputedStyle(element);
      const found: string[] = [];
      if (style.textOverflow !== "clip") found.push(`${id}: text-overflow ${style.textOverflow}`);
      if (element.scrollWidth > element.clientWidth + 1) found.push(`${id}: clipped`);
      if (new Set(rects.map((rect) => Math.round(rect.top))).size < 2) found.push(`${id}: on one line`);
      if (rects.some((rect) => rect.left < container.left - 1 || rect.right > container.right + 1)) found.push(`${id}: a line outside #${box}`);
      if (rects.some((rect) => rect.left < -1 || rect.right > window.innerWidth + 1)) found.push(`${id}: a line outside the viewport`);
      return found;
    },
    { id, box },
  );
}

describe("US4-1: the hooked identifier wraps in its 1fr cell, its column as wide as the short text's, with no ellipsis; unhooked, it widens its column (FR-020, SC-005)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 1280 px, 320 px and 200% zoom", async (theme) => {
    const found: Record<string, unknown> = {};
    const differences: number[] = [];
    for (const [label, width, scale] of sizes) {
      const page = await open("wrap.html", { colorScheme: theme, width, scale });
      const hooked = await columns(page, "hooked", "hooked-short");
      const unhooked = await columns(page, "unhooked", "unhooked-short");
      differences.push(Math.abs(hooked.id - hooked.short));
      found[label] = {
        wrap: (await computed(page, "hooked", ["overflow-wrap"]))["overflow-wrap"],
        problems: await wrapProblems(page, "hooked", "hooked"),
        hookedColumns: Math.round(hooked.id + hooked.short),
        unhookedWider: unhooked.id > unhooked.short + 100,
        violations: await violations(page),
      };
      await close(page);
    }
    const planted = await open("wrap.html?after=plants/wrap-ellipsis", { colorScheme: theme });
    const plantedProblems = await wrapProblems(planted, "hooked", "hooked");
    await close(planted);
    const expected = { wrap: "anywhere", problems: [], hookedColumns: 300, unhookedWider: true, violations: [] };
    expect(found).toEqual({ "1280 px": expected, "320 px": expected, "200%": expected });
    expect(differences.map((difference) => difference <= 1)).toEqual([true, true, true]);
    expect(plantedProblems).toEqual(["hooked: text-overflow ellipsis", "hooked: clipped", "hooked: on one line", "hooked: a line outside #hooked"]);
  });
});

/** US4-2, FR-005: the unhooked identifier and the one with data-ocelle-wrap="true" keep the initial overflow-wrap. */
async function optInProblems(page: Page): Promise<string[]> {
  const found: string[] = [];
  for (const id of ["unhooked", "wrap-true"]) {
    const wrap = (await computed(page, id, ["overflow-wrap"]))["overflow-wrap"];
    found.push(...(wrap === "normal" ? [] : [`${id}: ${String(wrap)}`]));
  }
  return found;
}

describe("US4-2: the hook is opt-in: the hooked copy wraps anywhere, the unhooked copy and data-ocelle-wrap=\"true\" keep the initial overflow-wrap (FR-020, FR-005)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("wrap.html", { colorScheme: theme });
    const hooked = await computed(page, "hooked", ["overflow-wrap"]);
    const optIn = await optInProblems(page);
    await close(page);
    const everywhere = await open("wrap.html?after=plants/wrap-all", { colorScheme: theme });
    const plantedEverywhere = await optInProblems(everywhere);
    const everywhereColumns = await columns(everywhere, "unhooked", "unhooked-short");
    await close(everywhere);
    const presence = await open("wrap.html?after=plants/wrap-presence", { colorScheme: theme });
    const plantedPresence = await optInProblems(presence);
    await close(presence);
    expect(hooked).toEqual({ "overflow-wrap": "anywhere" });
    expect(optIn).toEqual([]);
    expect(plantedEverywhere).toEqual(["unhooked: anywhere", "wrap-true: anywhere"]);
    expect(Math.abs(everywhereColumns.id - everywhereColumns.short)).toBeLessThanOrEqual(1);
    expect(plantedPresence).toEqual(["wrap-true: anywhere"]);
  });
});

/** US4-3: the hooked identifier's selected text (what a copy gives) must equal its source text. */
function copyProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const element = document.getElementById("hooked");
    const selection = window.getSelection();
    if (element === null || selection === null) throw new Error("no #hooked or no selection");
    selection.selectAllChildren(element);
    const copied = selection.toString();
    selection.removeAllRanges();
    return copied === element.textContent ? [] : ["hooked: copied text differs from the source"];
  });
}

describe("US4-3: a wrapped identifier spans more than one line, and its copied text equals the identifier exactly (FR-020)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("wrap.html", { colorScheme: theme });
    const wrap = await computed(page, "hooked", ["overflow-wrap"]);
    const lines = await page.evaluate(() => {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById("hooked") ?? document.body);
      return new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top))).size;
    });
    const source = await page.evaluate(() => document.getElementById("hooked")?.textContent ?? "");
    const copy = await copyProblems(page);
    await close(page);
    const planted = await open("wrap.html?after=plants/wrap-copy", { colorScheme: theme });
    const plantedCopy = await copyProblems(planted);
    await close(planted);
    expect(wrap).toEqual({ "overflow-wrap": "anywhere" });
    expect(lines).toBeGreaterThan(1);
    expect(source).toBe(identifier);
    expect(copy).toEqual([]);
    expect(plantedCopy).toEqual(["hooked: copied text differs from the source"]);
  });
});

describe("US4-4: in a prose paragraph and in a compact span, the hooked identifier wraps anywhere and keeps the text's size and line height (FR-020)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s, and it wraps inside its paragraph at 320 px and 200% zoom", async (theme) => {
    const page = await open("wrap.html", { colorScheme: theme });
    const wraps = { prose: await computed(page, "prose-id", ["overflow-wrap"]), compact: await computed(page, "compact-id", ["overflow-wrap"]) };
    const found = await scales(page, ["prose-p", "prose-id", "compact-p", "compact-id"]);
    await close(page);
    const narrow: Record<string, string[]> = {};
    for (const [label, width, scale] of sizes.slice(1)) {
      const each = await open("wrap.html", { colorScheme: theme, width, scale });
      narrow[label] = [...(await wrapProblems(each, "prose-id", "prose-p")), ...(await wrapProblems(each, "compact-id", "compact-p"))];
      await close(each);
    }
    expect(wraps).toEqual({ prose: { "overflow-wrap": "anywhere" }, compact: { "overflow-wrap": "anywhere" } });
    expect(found).toEqual({
      "prose-p": { fontSize: "16px", lineHeight: "26.4px" },
      "prose-id": { fontSize: "16px", lineHeight: "26.4px" },
      "compact-p": { fontSize: "14px", lineHeight: "21px" },
      "compact-id": { fontSize: "14px", lineHeight: "21px" },
    });
    expect(narrow).toEqual({ "320 px": [], "200%": [] });
  });
});
