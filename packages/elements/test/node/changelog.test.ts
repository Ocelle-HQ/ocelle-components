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
// Replaced by 030 US2 (T025; FR-005, research.md R-09): the first release turns the Unreleased content into the dated
// 1.0.0 entry, so each statement is read from the `## 1.0.0 - <YYYY-MM-DD>` section, whose heading must exist in that
// form; the statements are the same (reviews/phase-2/replaced-tests.md).
/** The first release's entry of a changelog, flattened: "" unless its heading is `## 1.0.0 - <YYYY-MM-DD>`. */
const firstRelease = (text: string): string => flat(/^## 1\.0\.0 - \d{4}-\d{2}-\d{2}\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(text)?.[1] ?? "");

describe("packages/elements/CHANGELOG.md: the workflow layouts are a minor change (FR-035)", () => {
  const released = firstRelease(read("CHANGELOG.md"));

  it.each([
    "`ocelle-scroller`, `ocelle-workflow-board`, `ocelle-workflow-lane` and `ocelle-list-detail`, their attributes, properties, slots and entry points, `remeasure()`, the overflow-region module convention and the container-tier convention are additions to the public surface: a minor change",
  ])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

describe("packages/tokens/CHANGELOG.md: the five layout tokens are a minor change (FR-035)", () => {
  const released = firstRelease(read("../tokens/CHANGELOG.md"));

  it.each([
    "`--ocelle-lane-min-width`, `--ocelle-list-track-width`, `--ocelle-list-detail-collapse`, `--ocelle-list-detail-inspector-collapse` and `--ocelle-scroller-fade-size`, the five tokens of the workflow layouts of `@ocelle/elements`, are additions to the token names: a minor change",
  ])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

describe("packages/elements/CHANGELOG.md: the data records are a minor change (019 FR-057, T075)", () => {
  const text = read("CHANGELOG.md");
  const released = firstRelease(text);
  /** The data table's entry under Unreleased / Added, flattened: from its bullet to the next bullet or heading. */
  const entry = flat(/^- `ocelle-data-table`:[\s\S]*?(?=^- |^#|(?![\s\S]))/m.exec(text)?.[0] ?? "");

  it.each([
    "`ocelle-data-table`, `ocelle-event-timeline`, `ocelle-timeline-event`, `ocelle-evidence-chain` and `ocelle-evidence-step`, their properties (`label`, `wrap`, `stickyHeader` as `sticky-header`, `striped`, `time` and `variant`), the event's `time` slot, the parts `list`, `time` and `content`, their entry points and the base-style hook `--data-table-box-size` and `--data-table-end-fade` are additions to the public surface: a minor change",
    "None of them dispatches an event, and no token is added",
  ])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });

  it.each(["`wrap` (reflected)", "the property `stickyHeader` as `sticky-header` (reflected)"])("gives, in the data table's entry, %s", (statement) => {
    expect(entry).toContain(flat(statement));
  });
});

// 012 plan decision 33 (phase 2 review round 5, O3-01; tasks.md T029b): the slot convention's label sits on the text
// baseline, stated once under Unreleased.
describe("packages/elements/CHANGELOG.md: a one-line control on the slot convention sits on the text's baseline (012 plan decision 33)", () => {
  const released = firstRelease(read("CHANGELOG.md"));

  it.each(["A one-line control on the slot convention, such as `ocelle-button`, now sits on the surrounding text's baseline"])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

// 018 (FR-007, constitution VII; tasks.md T016): the status indicator and its two tokens are a minor change, stated once
// under Unreleased in each changelog.
describe("packages/elements/CHANGELOG.md: ocelle-status-indicator is a minor change (018)", () => {
  const released = firstRelease(read("CHANGELOG.md"));

  it.each(["`ocelle-status-indicator`, its attributes `tone`, `label` and `pulse` (reflected), its parts `dot` and `ring` and its entry point `@ocelle/elements/ocelle-status-indicator.js` are additions to the public surface: a minor change"])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

// 018 (FR-007, constitution VII; tasks.md T027): the metric is a minor change, stated once under Unreleased; it adds no
// token (011's eyebrow tokens are used as merged, FR-042), so the tokens changelog gains nothing for it.
describe("packages/elements/CHANGELOG.md: ocelle-metric is a minor change (018)", () => {
  const released = firstRelease(read("CHANGELOG.md"));

  it.each(["`ocelle-metric`, its attributes `label` and `display-value` (reflected) and `layout`, its parts `label` and `value` and its entry point `@ocelle/elements/ocelle-metric.js` are additions to the public surface: a minor change"])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

// 018 (FR-007, constitution VII; tasks.md T038): the static pill tag is a minor change, stated once under Unreleased in
// the elements changelog, and its token `--ocelle-line-height-snug` once in the tokens changelog.
describe("packages/elements/CHANGELOG.md: ocelle-pill-tag is a minor change (018)", () => {
  const released = firstRelease(read("CHANGELOG.md"));

  it.each(["`ocelle-pill-tag`, its attributes `status`, `variant` and `density`, `interactive`, `href` and `disabled` (reflected) and `label`, its default and `icon` slots, its part `pill` and its entry point `@ocelle/elements/ocelle-pill-tag.js` are additions to the public surface: a minor change"])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

// 018 phase 5 (FR-007, constitution VII; tasks.md T048): the interactive pill is a minor change, stated once under
// Unreleased in the elements changelog, and its token `--ocelle-target-small` once in the tokens changelog.
describe("packages/elements/CHANGELOG.md: the interactive ocelle-pill-tag is a minor change (018 phase 5)", () => {
  const released = firstRelease(read("CHANGELOG.md"));

  it.each([
    "The interactive `ocelle-pill-tag`, in button mode with `interactive` and in link mode with an `href`, its moved attributes `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-current`, `aria-pressed` and `title` with their `data-ocelle-moved-*` mirrors, its methods `focus()` and `click()`, its event `ocelle-pill-tag-activate`, its custom states `pressed` and `current` and its part `control` are additions to the public surface: a minor change",
  ])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

// 020 phase 1 (T007, T011; FR-056, constitution VII): the disclosure is an addition, a minor change, stated once under
// Unreleased; its names are asserted one by one in `readme.test.ts`.
describe("packages/elements/CHANGELOG.md: ocelle-disclosure is a minor change (020 FR-056)", () => {
  const released = firstRelease(read("CHANGELOG.md"));

  it.each([
    "`ocelle-disclosure`, its property `open`, its moved attributes and their mirrors, the mapped `aria-expanded`, its slots `summary` and `icon` and its default slot, its parts `details`, `summary` and `panel`, the event `ocelle-disclosure-toggle`, the state `open` and its entry point are additions to the public surface: a minor change",
  ])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

// 018 phase 6 (FR-007, constitution VII; tasks.md T057): truncation and the full-text tooltip, and the entry point that
// now also defines `ocelle-tooltip`, are a minor change, stated once under Unreleased; no token is added.
describe("packages/elements/CHANGELOG.md: the truncating ocelle-pill-tag is a minor change (018 phase 6)", () => {
  const released = firstRelease(read("CHANGELOG.md"));

  it.each([
    "An enabled interactive `ocelle-pill-tag` truncates a text that does not fit with an ellipsis and shows its full text in `ocelle-tooltip` on hover and keyboard focus, a disabled one wraps it, and the entry point `@ocelle/elements/ocelle-pill-tag.js` also defines `ocelle-tooltip`: a minor change",
  ])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

// 020 phase 2 (T027, T031; FR-056, constitution VII): the code block is an addition, a minor change, stated once under
// Unreleased; its names are asserted one by one in `readme.test.ts`.
describe("packages/elements/CHANGELOG.md: ocelle-code-block is a minor change (020 FR-056)", () => {
  const released = firstRelease(read("CHANGELOG.md"));

  it.each([
    "`ocelle-code-block`, its properties `overflow`, `label` and `digest`, its parts `block` and `code` and its entry point are additions to the public surface: a minor change",
    "The README's element conventions gain the digest rule: a prefix to the last colon, groups of four code points with a `--ocelle-space-1` gap, copied and read text unbroken",
  ])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

describe("packages/tokens/CHANGELOG.md: the interactive pill tag's target is a minor change (018 phase 5)", () => {
  const released = firstRelease(read("../tokens/CHANGELOG.md"));

  it.each(["`--ocelle-target-small`, the 24 px minimum target of an interactive `ocelle-pill-tag` of `@ocelle/elements`, is an addition to the token names: a minor change"])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

describe("packages/tokens/CHANGELOG.md: the status indicator's two tokens are a minor change (018)", () => {
  const released = firstRelease(read("../tokens/CHANGELOG.md"));

  it.each(["`--ocelle-size-indicator` and `--ocelle-motion-pulse`, the two tokens of `ocelle-status-indicator` of `@ocelle/elements`, are additions to the token names: a minor change"])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});

describe("packages/tokens/CHANGELOG.md: the pill tag's line height is a minor change (018)", () => {
  const released = firstRelease(read("../tokens/CHANGELOG.md"));

  it.each(["`--ocelle-line-height-snug`, the compact line height of `ocelle-pill-tag` of `@ocelle/elements`, is an addition to the token names: a minor change"])("states in the dated 1.0.0 entry: %s", (statement) => {
    expect(released).toContain(flat(statement));
  });
});
