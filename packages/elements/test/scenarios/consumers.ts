// The shared bodies of SC-001 (018 spec SC-001, Consumers; contracts/checks.md § Scenarios, SC-001 rows; tasks.md T014,
// extended by T025 and T036): every attribute and slot kitty-mission-ui uses today has an equivalent in this feature's
// interface, rendered with no consumer CSS (the page holds only the token stylesheet). Each body returns one
// observation; `test/consumers.test.ts` asserts it equals `expected`, in light and dark. Colours come from the token
// table of packages/tokens/test/expected.ts (`tokenColour`), never from the element source.
//
// The indicator row (phase 2): the consumers' `tone` is the indicator's `tone`; each value of the vocabulary fills the
// dot with its `--ocelle-color-<tone>`, and an unknown tone, beside them, fills it with the neutral value.
import { tokenColour } from "./icon.ts";
import type { Driver, Palette } from "./driver.ts";
import { tones } from "./status-indicator.ts";

/** One SC-001 body in a theme. */
export interface ConsumerScenario {
  readonly name: string;
  readonly run: (driver: Driver, theme: Palette) => Promise<unknown>;
  readonly expected: (theme: Palette) => unknown;
}

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
];
