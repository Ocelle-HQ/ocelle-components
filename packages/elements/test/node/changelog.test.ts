import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The changelogs of the workflow layouts (009 FR-035, constitution VII; T063). The elements changelog's names of the
// four elements, their attributes, properties, slots and entry points, `remeasure()`, the overflow-region module
// convention and the container-tier convention are asserted one by one in `readme.test.ts` (009 phases 2 to 4), and
// the tokens changelog's names of every token, the six included, in `packages/tokens/test/readme.test.ts`. This file
// adds what those do not: each changelog says, in one statement under Unreleased, that this surface is an addition, a
// minor change (FR-035), naming the four elements and the two conventions, or the six tokens. Whitespace is
// normalised, so a statement may wrap across lines. 019 phase 4's review round 1 (R1-02; T075) adds the data records'
// statement: the five elements, their properties, slot, parts, entry points and base-style hook are a minor change, with
// no event and no token; and the data table's entry gives `wrap` as reflected and the property `stickyHeader` as
// `sticky-header`, as the manifest has them.
/** A file's text, relative to the package; empty while it does not exist, so each assertion reports what is missing. */
function read(file: string): string {
  const url = new URL(`../../${file}`, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}
const flat = (text: string): string => text.replace(/\s+/g, " ");
/** The Unreleased section of a changelog, flattened. */
const unreleased = (text: string): string => flat(/^## Unreleased\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(text)?.[1] ?? "");

describe("packages/elements/CHANGELOG.md: the workflow layouts are a minor change (FR-035)", () => {
  const section = unreleased(read("CHANGELOG.md"));

  it.each([
    "`ocelle-scroller`, `ocelle-workflow-board`, `ocelle-workflow-lane` and `ocelle-list-detail`, their attributes, properties, slots and entry points, `remeasure()`, the overflow-region module convention and the container-tier convention are additions to the public surface: a minor change",
  ])("states under Unreleased: %s", (statement) => {
    expect(section).toContain(flat(statement));
  });
});

describe("packages/tokens/CHANGELOG.md: the five layout tokens are a minor change (FR-035)", () => {
  const section = unreleased(read("../tokens/CHANGELOG.md"));

  it.each([
    "`--ocelle-lane-min-width`, `--ocelle-list-track-width`, `--ocelle-list-detail-collapse`, `--ocelle-list-detail-inspector-collapse` and `--ocelle-scroller-fade-size`, the five tokens of the workflow layouts of `@ocelle/elements`, are additions to the token names: a minor change",
  ])("states under Unreleased: %s", (statement) => {
    expect(section).toContain(flat(statement));
  });
});

describe("packages/elements/CHANGELOG.md: the data records are a minor change (019 FR-057, T075)", () => {
  const text = read("CHANGELOG.md");
  const section = unreleased(text);
  /** The data table's entry under Unreleased / Added, flattened: from its bullet to the next bullet or heading. */
  const entry = flat(/^- `ocelle-data-table`:[\s\S]*?(?=^- |^#|(?![\s\S]))/m.exec(text)?.[0] ?? "");

  it.each([
    "`ocelle-data-table`, `ocelle-event-timeline`, `ocelle-timeline-event`, `ocelle-evidence-chain` and `ocelle-evidence-step`, their properties (`label`, `wrap`, `stickyHeader` as `sticky-header`, `striped`, `time` and `variant`), the event's `time` slot, the parts `list`, `time` and `content`, their entry points and the base-style hook `--data-table-box-size` and `--data-table-end-fade` are additions to the public surface: a minor change",
    "None of them dispatches an event, and no token is added",
  ])("states under Unreleased: %s", (statement) => {
    expect(section).toContain(flat(statement));
  });

  it.each(["`wrap` (reflected)", "the property `stickyHeader` as `sticky-header` (reflected)"])("gives, in the data table's entry, %s", (statement) => {
    expect(entry).toContain(flat(statement));
  });
});
