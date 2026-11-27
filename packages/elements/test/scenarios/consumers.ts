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
//
// The pill rows (phase 4, tasks.md T037): the consumers' `status`, badge use, `title` and slotted content are the
// pill's. With no consumer CSS each status fills the pill with `--ocelle-color-<status>-bg` and sets its text in
// `--ocelle-color-<status>` (an unknown status, beside them, the neutral pair); a badge has a `--ocelle-border-width`
// border in the status colour and no fill; a `title` stays on the host as written, where the browser's own behaviour
// applies (Assumptions: Chromium names the host's generic node by it); and the slotted content is in Chromium's tree as
// plain text under that node of no role of its own, drawn in the pill.
import { expectedTokens } from "../../../tokens/test/expected.ts";
import { tokenColour } from "./icon.ts";
import type { Driver, Palette } from "./driver.ts";
import { pillStatuses } from "./pill-tag.ts";
import { tones } from "./status-indicator.ts";

/** One SC-001 body in a theme. */
export interface ConsumerScenario {
  readonly name: string;
  readonly run: (driver: Driver, theme: Palette) => Promise<unknown>;
  readonly expected: (theme: Palette) => unknown;
}

/** `--ocelle-border-width` as the token table declares it: 1px. */
const borderWidth = expectedTokens.find((each) => each.name === "border-width")?.declared;

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
  {
    name: "SC-001, pill: `status` with no consumer CSS fills the pill with --ocelle-color-<status>-bg and sets its text in --ocelle-color-<status> for each value, and an unknown status with the neutral pair",
    run: async (driver, theme) => {
      await driver.mount([...pillStatuses, "bogus"].map((status) => `<ocelle-pill-tag id="status-${status}" status="${status}">Blocked</ocelle-pill-tag>`).join(" "));
      await driver.theme(theme);
      const looks: Record<string, unknown> = {};
      for (const status of [...pillStatuses, "bogus"]) looks[status] = { ground: await driver.computed(`status-${status}`, "background-color", '[part="pill"]'), text: await driver.computed(`status-${status}`, "color", '[part="pill"]') };
      return looks;
    },
    expected: (theme) => ({
      ...Object.fromEntries(pillStatuses.map((status) => [status, { ground: tokenColour(`color-${status}-bg`, theme), text: tokenColour(`color-${status}`, theme) }])),
      bogus: { ground: tokenColour("color-neutral-bg", theme), text: tokenColour("color-neutral", theme) },
    }),
  },
  {
    name: "SC-001, pill: badge use (`variant=\"badge\"`) with no consumer CSS has a --ocelle-border-width border in the status colour and no fill, for each value",
    run: async (driver, theme) => {
      await driver.mount(pillStatuses.map((status) => `<ocelle-pill-tag id="badge-${status}" variant="badge" status="${status}">3</ocelle-pill-tag>`).join(" "));
      await driver.theme(theme);
      const looks: Record<string, unknown> = {};
      for (const status of pillStatuses) {
        const [style] = await driver.styles(`badge-${status}`, '[part="pill"]', ["border-top-width", "border-top-style", "border-top-color", "background-color"]);
        looks[status] = style;
      }
      return looks;
    },
    expected: (theme) => Object.fromEntries(pillStatuses.map((status) => [status, { "border-top-width": borderWidth, "border-top-style": "solid", "border-top-color": tokenColour(`color-${status}`, theme), "background-color": "rgba(0, 0, 0, 0)" }])),
  },
  {
    name: "SC-001, pill: `title` and slotted content with no consumer CSS: the title stays on the host as written (the browser names the host's generic node by it), and the slotted text is in Chromium's tree as plain text under that node of no role of its own, drawn inside the pill",
    run: async (driver, theme) => {
      await driver.mount('<ocelle-pill-tag id="pill" status="warning" title="Blocked since Monday">Blocked</ocelle-pill-tag>');
      await driver.theme(theme);
      const [text] = await driver.textBoxes("pill");
      const box = await driver.box("pill", '[part="pill"]');
      return {
        title: await driver.attribute("pill", "title"),
        tree: (await driver.axSubtree("pill")).map((node) => `${node.role} ${node.name}`.trim()),
        drawn: text !== undefined && text.box.width > 0 && text.box.x >= box.x && text.box.x + text.box.width <= box.x + box.width,
        text: await driver.computed("pill", "color", '[part="pill"]'),
      };
    },
    expected: (theme) => ({ title: "Blocked since Monday", tree: ["generic Blocked since Monday", "StaticText Blocked"], drawn: true, text: tokenColour("color-warning", theme) }),
  },
];
