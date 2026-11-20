// The shared bodies of SC-001 (018 spec SC-001, Consumers; contracts/checks.md § Scenarios, SC-001 rows; tasks.md T014,
// extended by T025 and T036): every attribute and slot kitty-mission-ui uses today has an equivalent in this feature's
// interface, rendered with no consumer CSS (the page holds only the token stylesheet). Each body returns one
// observation; `test/consumers.test.ts` asserts it equals `expected`, in light and dark. Colours come from the token
// table of packages/tokens/test/expected.ts (`tokenColour`), never from the element source.
//
// The indicator row (phase 2): the consumers' `tone` is the indicator's `tone`; each value of the vocabulary fills the
// dot with its `--ocelle-color-<tone>`, and an unknown tone, beside them, fills it with the neutral value.
//
// The metric row (phase 3, tasks.md T026): the consumers' `label` and `display-value` are the metric's; with no consumer
// CSS Chromium's tree holds the term named by the label and its definition holding the value, and both texts are
// visible: each has a box wider and taller than 0, in a colour other than the page's ground (`color-eyebrow` and
// `color-ink`, from the token table), and the value is in Schibsted Grotesk though the page sets no family (FR-023).
import { expectedTokens } from "../../../tokens/test/expected.ts";
import { tokenColour } from "./icon.ts";
import type { Driver, Palette } from "./driver.ts";
import { tones } from "./status-indicator.ts";

/** One SC-001 body in a theme. */
export interface ConsumerScenario {
  readonly name: string;
  readonly run: (driver: Driver, theme: Palette) => Promise<unknown>;
  readonly expected: (theme: Palette) => unknown;
}

/** `--ocelle-font-sans` as the token table declares it: Schibsted Grotesk first. */
const fontSans = expectedTokens.find((each) => each.name === "font-sans")?.declared;

export const consumerScenarios: readonly ConsumerScenario[] = [
  {
    name: "SC-001, indicator: `tone` with no consumer CSS fills the dot with --ocelle-color-<tone> for each value, and an unknown tone with the neutral value",
    run: async (driver, theme) => {
      await driver.mount([...tones, "bogus"].map((tone) => `<ocelle-status-indicator id="tone-${tone}" tone="${tone}"></ocelle-status-indicator>`).join(""));
      await driver.theme(theme);
      const fills: Record<string, string> = {};
      for (const tone of [...tones, "bogus"]) fills[tone] = await driver.computed(`tone-${tone}`, "background-color", '[part="dot"]');
      return fills;
    },
    expected: (theme) => ({ ...Object.fromEntries(tones.map((tone) => [tone, tokenColour(`color-${tone}`, theme)])), bogus: tokenColour("color-neutral", theme) }),
  },
  {
    name: "SC-001, metric: `label` and `display-value` with no consumer CSS give a term named by the label and its definition with the value in Chromium's tree, and both texts are visible",
    run: async (driver, theme) => {
      await driver.mount('<ocelle-metric id="metric" label="Open missions" display-value="12"></ocelle-metric>');
      await driver.theme(theme);
      const tree = (await driver.axSubtree("metric")).filter((node) => node.role === "term" || node.role === "definition" || node.role === "StaticText").map((node) => `${node.role} ${node.name}`.trim());
      const shown = (await driver.textBoxes("metric")).filter((_, at) => at !== 1).map((text) => ({ text: text.text, drawn: text.box.width > 0 && text.box.height > 0 }));
      return {
        tree,
        shown,
        label: await driver.computed("metric", "color", '[part="label"] .eyebrow'),
        value: await driver.computed("metric", "color", '[part="value"]'),
        family: await driver.computed("metric", "font-family", '[part="value"]'),
      };
    },
    expected: (theme) => ({
      tree: ["term Open missions", "StaticText Open missions", "definition", "StaticText 12"],
      shown: [
        { text: "Open missions", drawn: true },
        { text: "12", drawn: true },
      ],
      label: tokenColour("color-eyebrow", theme),
      value: tokenColour("color-ink", theme),
      family: fontSans,
    }),
  },
];
