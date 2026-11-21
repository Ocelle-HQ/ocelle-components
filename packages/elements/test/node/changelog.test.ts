import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The changelogs of the workflow layouts (009 FR-035, constitution VII; T063). The elements changelog's names of the
// four elements, their attributes, properties, slots and entry points, `remeasure()`, the overflow-region module
// convention and the container-tier convention are asserted one by one in `readme.test.ts` (009 phases 2 to 4), and
// the tokens changelog's names of every token, the six included, in `packages/tokens/test/readme.test.ts`. This file
// adds what those do not: each changelog says, in one statement under Unreleased, that this surface is an addition, a
// minor change (FR-035), naming the four elements and the two conventions, or the six tokens. Whitespace is
// normalised, so a statement may wrap across lines.
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

// 012 plan decision 33 (phase 2 review round 5, O3-01; tasks.md T029b): the slot convention's label sits on the text
// baseline, stated once under Unreleased.
describe("packages/elements/CHANGELOG.md: a one-line control on the slot convention sits on the text's baseline (012 plan decision 33)", () => {
  const section = unreleased(read("CHANGELOG.md"));

  it.each(["A one-line control on the slot convention, such as `ocelle-button`, now sits on the surrounding text's baseline"])("states under Unreleased: %s", (statement) => {
    expect(section).toContain(flat(statement));
  });
});

// 020 phase 1 (T007, T011; FR-056, constitution VII): the disclosure is an addition, a minor change, stated once under
// Unreleased; its names are asserted one by one in `readme.test.ts`.
describe("packages/elements/CHANGELOG.md: ocelle-disclosure is a minor change (020 FR-056)", () => {
  const section = unreleased(read("CHANGELOG.md"));

  it.each([
    "`ocelle-disclosure`, its property `open`, its moved attributes and their mirrors, the mapped `aria-expanded`, its slots `summary` and `icon` and its default slot, its parts `details`, `summary` and `panel`, the event `ocelle-disclosure-toggle`, the state `open` and its entry point are additions to the public surface: a minor change",
  ])("states under Unreleased: %s", (statement) => {
    expect(section).toContain(flat(statement));
  });
});

// 020 phase 2 (T027, T031; FR-056, constitution VII): the code block is an addition, a minor change, stated once under
// Unreleased; its names are asserted one by one in `readme.test.ts`.
describe("packages/elements/CHANGELOG.md: ocelle-code-block is a minor change (020 FR-056)", () => {
  const section = unreleased(read("CHANGELOG.md"));

  it.each([
    "`ocelle-code-block`, its properties `overflow`, `label` and `digest`, its parts `block` and `code` and its entry point are additions to the public surface: a minor change",
    "The README's element conventions gain the digest rule: a prefix to the last colon, groups of four code points with a `--ocelle-space-1` gap, copied and read text unbroken",
  ])("states under Unreleased: %s", (statement) => {
    expect(section).toContain(flat(statement));
  });
});
