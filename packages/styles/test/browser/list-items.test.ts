import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { close, suite, themes } from "./pages.ts";
import { violations } from "./serve.ts";

// base.css's block 3 for the list items (019 FR-025; research R-08, recheck Q5 (b); contracts/styles-data-table.md
// § Block 3, contracts/ocelle-event-timeline.md § Before upgrade; tasks.md T035; analysis I5: apart from the data-table
// file), in Chromium under the strict CSP, in both themes. list-items.html holds an `ocelle-event-timeline` of five
// events (the second `hidden`, the third `aria-hidden="true"`, the fifth with a slotted `<time>` written before its
// content), none of them defined (no element module is loaded), beside an event outside a timeline.
// - Before upgrade each visible event is a block whose box starts below the previous visible one's; the hidden and
//   the aria-hidden event are not shown (no client rect, display none), so the next visible event starts directly
//   below the one before it; the slotted time's text is shown before the content's; an event outside a timeline stays
//   inline. Once the elements are defined the rules no longer match.
// Since 019 phase 3 (T059) the file also holds an `ocelle-evidence-chain` of five steps (the second `hidden`, the third
// `aria-hidden="true"`, the fourth a chip), undefined, beside a step outside a chain: before upgrade each visible step
// is a block below the previous visible one, the hidden and the aria-hidden step are not shown, and a step outside a
// chain stays inline; once defined the rules no longer match.
const { open } = suite();

/** Each event's display, client rect count and block start and end, and the slotted time against its content. */
function events(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const read = (id: string): { display: string; rects: number; top: number; bottom: number } => {
      const element = document.getElementById(id);
      if (element === null) throw new Error(`no #${id}`);
      const rect = element.getBoundingClientRect();
      return { display: getComputedStyle(element).display, rects: element.getClientRects().length, top: rect.top, bottom: rect.bottom };
    };
    const [first, second, third] = [read("first"), read("second"), read("third")];
    const text = document.getElementById("third")?.lastChild;
    const range = document.createRange();
    if (text !== null && text !== undefined) range.selectNodeContents(text);
    const content = range.getClientRects()[0];
    const time = document.getElementById("slotted")?.getBoundingClientRect();
    return {
      displays: [first.display, second.display, third.display],
      below: [second.top >= first.bottom - 0.5, third.top >= second.bottom - 0.5],
      directly: Math.abs(second.top - first.bottom) <= 0.5,
      hidden: [read("hidden").display, read("hidden").rects],
      masked: [read("masked").display, read("masked").rects],
      timeFirst: time !== undefined && content !== undefined && time.width > 0 && time.right <= content.left + 0.5,
      loose: read("loose").display,
    };
  });
}

describe("ocelle-timeline-event children of an undefined ocelle-event-timeline before upgrade (019 R-08)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s: each visible event is a block below the previous one, a hidden and an aria-hidden event are not shown, a slotted time shows before the content; an event outside a timeline and every event once defined are inline", async (theme) => {
    const page = await open("list-items.html", { colorScheme: theme });
    const before = await events(page);
    await page.evaluate(() => {
      customElements.define("ocelle-event-timeline", class extends HTMLElement {});
      customElements.define("ocelle-timeline-event", class extends HTMLElement {});
    });
    const defined = await page.evaluate(() => [getComputedStyle(document.querySelector("#first") ?? document.body).display, getComputedStyle(document.querySelector("#masked") ?? document.body).display]);
    const reported = await violations(page);
    await close(page);
    expect({ before, defined, reported }).toEqual({
      before: { displays: ["block", "block", "block"], below: [true, true], directly: true, hidden: ["none", 0], masked: ["none", 0], timeFirst: true, loose: "inline" },
      defined: ["inline", "inline"],
      reported: [],
    });
  });
});

/** Each step's display, client rect count and block start and end. */
function steps(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const read = (id: string): { display: string; rects: number; top: number; bottom: number } => {
      const element = document.getElementById(id);
      if (element === null) throw new Error(`no #${id}`);
      const rect = element.getBoundingClientRect();
      return { display: getComputedStyle(element).display, rects: element.getClientRects().length, top: rect.top, bottom: rect.bottom };
    };
    const [first, second, third] = [read("c-first"), read("c-second"), read("c-third")];
    return {
      displays: [first.display, second.display, third.display],
      below: [second.top >= first.bottom - 0.5, third.top >= second.bottom - 0.5],
      directly: Math.abs(second.top - first.bottom) <= 0.5,
      hidden: [read("c-hidden").display, read("c-hidden").rects],
      masked: [read("c-masked").display, read("c-masked").rects],
      loose: read("c-loose").display,
    };
  });
}

describe("ocelle-evidence-step children of an undefined ocelle-evidence-chain before upgrade (019 R-08)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s: each visible step is a block below the previous one, a hidden and an aria-hidden step are not shown; a step outside a chain and every step once defined are inline", async (theme) => {
    const page = await open("list-items.html", { colorScheme: theme });
    const before = await steps(page);
    await page.evaluate(() => {
      customElements.define("ocelle-evidence-chain", class extends HTMLElement {});
      customElements.define("ocelle-evidence-step", class extends HTMLElement {});
    });
    const defined = await page.evaluate(() => [getComputedStyle(document.querySelector("#c-first") ?? document.body).display, getComputedStyle(document.querySelector("#c-masked") ?? document.body).display]);
    const reported = await violations(page);
    await close(page);
    expect({ before, defined, reported }).toEqual({
      before: { displays: ["block", "block", "block"], below: [true, true], directly: true, hidden: ["none", 0], masked: ["none", 0], loose: "inline" },
      defined: ["inline", "inline"],
      reported: [],
    });
  });
});
