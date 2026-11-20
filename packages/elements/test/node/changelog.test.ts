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

// 018 (FR-007, constitution VII; tasks.md T016): the status indicator and its two tokens are a minor change, stated once
// under Unreleased in each changelog.
describe("packages/elements/CHANGELOG.md: ocelle-status-indicator is a minor change (018)", () => {
  const section = unreleased(read("CHANGELOG.md"));

  it.each(["`ocelle-status-indicator`, its attributes `tone`, `label` and `pulse` (reflected), its parts `dot` and `ring` and its entry point `@ocelle/elements/ocelle-status-indicator.js` are additions to the public surface: a minor change"])("states under Unreleased: %s", (statement) => {
    expect(section).toContain(flat(statement));
  });
});

// 018 (FR-007, constitution VII; tasks.md T027): the metric is a minor change, stated once under Unreleased; it adds no
// token (011's eyebrow tokens are used as merged, FR-042), so the tokens changelog gains nothing for it.
describe("packages/elements/CHANGELOG.md: ocelle-metric is a minor change (018)", () => {
  const section = unreleased(read("CHANGELOG.md"));

  it.each(["`ocelle-metric`, its attributes `label` and `display-value` (reflected) and `layout`, its parts `label` and `value` and its entry point `@ocelle/elements/ocelle-metric.js` are additions to the public surface: a minor change"])("states under Unreleased: %s", (statement) => {
    expect(section).toContain(flat(statement));
  });
});

describe("packages/tokens/CHANGELOG.md: the status indicator's two tokens are a minor change (018)", () => {
  const section = unreleased(read("../tokens/CHANGELOG.md"));

  it.each(["`--ocelle-size-indicator` and `--ocelle-motion-pulse`, the two tokens of `ocelle-status-indicator` of `@ocelle/elements`, are additions to the token names: a minor change"])("states under Unreleased: %s", (statement) => {
    expect(section).toContain(flat(statement));
  });
});
