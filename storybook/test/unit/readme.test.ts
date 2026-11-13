import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The contributor note (006 FR-025, US4 scenario 6, SC-005; plan.md § Phases 5; research.md R-10, R-11): an element
// issue's author reads storybook/README.md and knows where stories go, that each variant and state is one story (a
// hover or press state through the pointer parameter, with its viewport rule), that the harness captures both themes,
// that elements use open shadow roots and render every surface inside their own host, that an element's shadow styles
// set the font of its form controls, how to produce, inspect and commit baselines with the one command, that an arm64
// host runs the linux/amd64 image under emulation, that CI's captures are committed when a local run and CI disagree,
// how plant baselines are made (the plant mode and the Plants job's artifact) and what `pass-second-render`'s record is,
// that a baseline change needs a pull request description saying why, and that element packages prove run-time
// strict CSP in their own browser tests. Whitespace is normalised, so a fragment may wrap across lines.
const url = new URL("../../README.md", import.meta.url);
/** The note's text with runs of whitespace collapsed; empty while it does not exist, so each fragment is reported. */
const note = (existsSync(url) ? readFileSync(url, "utf8") : "").replace(/\s+/g, " ");
const flat = (text: string): string => text.replace(/\s+/g, " ");

const fragments = [
  // where stories go
  "Stories go in `storybook/stories/<name>.stories.ts`",
  // one story per variant and state; pointer states and their viewport rule (FR-031)
  "Each variant and each state of an element is one story",
  "A hover or press state is declared with the pointer parameter, `parameters: { ocelle: { pointer: { hover: \"<selector>\" } } }` or `{ press: \"<selector>\" }`: exactly one key, its selector matching exactly one element the story renders",
  "The target's box must lie wholly inside the initial 1280 × 800 viewport at scroll position 0, 0; otherwise the visual and axe gates fail the story with `pointer-target`",
  // themes captured by the harness
  "The harness captures every story in light and in dark and runs axe on both, so a story is not written twice, once per theme",
  // open shadow roots, surfaces inside the host (FR-014, FR-027)
  "Elements use open shadow roots: a closed shadow root fails the visual and axe gates with `closed-shadow-root`, since axe cannot audit its text",
  "Elements render every surface (menus, popovers, dialogs, tooltips) inside their own host: an element a story adds outside the story root fails the axe gate with `outside-root`",
  // the font of form controls (FR-027)
  "An element's shadow styles set the font of its form controls (`font: inherit`), since the document's base rule does not reach them: text drawn in any face other than Schibsted Grotesk fails the visual gate with `font`",
  // element run-time CSP (FR-023)
  "Each element package proves run-time strict CSP in its own browser tests, not in the Storybook: the Storybook is not served under a CSP, and the `csp` gate covers the packages' built output only",
  // produce, inspect and commit baselines; the one command (FR-008, FR-010)
  "Baselines are committed in `storybook/baselines/`, one file per story and theme, named `<story-id>.<theme>.png`",
  "One command produces them: `pnpm run visual:update`",
  "To inspect a difference, run `pnpm run gate:visual`: it keeps each differing capture and an image marking the differing pixels in `storybook/.visual/` (ignored)",
  "Commit the files `pnpm run visual:update` writes in `storybook/baselines/` with the change that moved them",
  // arm64 under emulation
  "On an arm64 host the capture runs the linux/amd64 image under emulation and is slower",
  // CI's captures as the record (FR-005)
  "CI's captures are the record: when a local capture and CI's disagree, take the files of the `baselines/` folder of the \"Visual regression\" job's artifact `visual` and commit them in `storybook/baselines/`",
  // baseline change reasons (constitution V)
  "A pull request that changes a baseline says why in its description",
  // plant baselines: the plant mode and the Plants job's artifact (research.md R-11)
  "A change that moves a plant story's pixels (a token value, `base.css`, the pinned container) regenerates the `visual` pass plants' own baselines with the plant mode: `pnpm run visual:update -- --plant visual/<name>`, which writes them to `gates/plants/visual/<name>/tree/storybook/baselines/`",
  "When a CI \"Plants shard\" job fails on such a plant, its artifact `plants-<k>` holds the captures at `gates/plants/visual/<name>/tree/storybook/baselines/`; commit them at those paths",
  // pass-second-render's record
  "`pass-second-render`'s baselines are captures made alone, one single-story-theme request per theme: `pnpm run visual:update -- --plant visual/pass-second-render --story <id>`, and its artifact holds captures made alone, never the full run's",
];

describe("storybook/README.md, the contributor note (006 FR-025, SC-005)", () => {
  it("holds every item of FR-025 and plan.md § Phases 5", () => {
    expect(fragments.filter((fragment) => !note.includes(flat(fragment)))).toEqual([]);
  });
});
