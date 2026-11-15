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

describe("packages/tokens/CHANGELOG.md: the six layout tokens are a minor change (FR-035)", () => {
  const section = unreleased(read("../tokens/CHANGELOG.md"));

  it.each([
    "`--ocelle-lane-min-width`, `--ocelle-list-track-width`, `--ocelle-list-detail-collapse`, `--ocelle-list-detail-inspector-collapse`, `--ocelle-scroller-fade-size` and `--ocelle-tracking-caps`, the six tokens of the workflow layouts of `@ocelle/elements`, are additions to the token names: a minor change",
  ])("states under Unreleased: %s", (statement) => {
    expect(section).toContain(flat(statement));
  });
});
