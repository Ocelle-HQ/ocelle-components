// The ocelle-evidence-chain stories (019 FR-050; contracts/checks.md § Stories; analysis C1 (c); phase 3 spike Q1 (b)):
// the 14 states of the evidence chain and its step, the standalone steps among them, in light and dark through the
// preview's theme global. The element is imported from the package source by relative path, as the other element
// stories import theirs. Widths are data-story rules of .storybook/stories-layout.css (calc() over tokens, each capped
// at the viewport); the markup has no style attribute and no class, all text is Latin script, and no story declares a
// pointer state.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-evidence-chain.ts";

const meta: Meta = { title: "Elements/ocelle-evidence-chain" };
export default meta;

/** An unbroken 26-character identifier. */
const identifier = "01JD8X2K7Q9M4N6P3R5T0V2W8Y";

/** An `ocelle-evidence-step`. */
const st = (attributes: string, content: string): string => `<ocelle-evidence-step${attributes}>${content}</ocelle-evidence-step>`;

/** The six steps of the review screen; the third and fifth chips when `chips`. */
const names = ["Spec", "Plan", "Tasks", "Red commit", "Green commit", "Review"];
const six = (chips: boolean): string[] => names.map((name, at) => st(chips && (at === 2 || at === 4) ? ' variant="chip"' : "", name));

/** A chain in a story wrapper. */
const story = (wrapper: string, attributes: string, steps: readonly string[]): string => `<div data-story="${wrapper}"><ocelle-evidence-chain${attributes}>${steps.join("")}</ocelle-evidence-chain></div>`;

export const SixSteps: StoryObj = { render: () => story("evidence-chain", ' label="Evidence"', six(false)) };

export const Wrapped320: StoryObj = { render: () => story("evidence-chain-narrow", ' label="Evidence"', six(false)) };

export const MixedChips: StoryObj = { render: () => story("evidence-chain", ' label="Evidence"', six(true)) };

export const AllChips: StoryObj = { render: () => story("evidence-chain", ' label="Evidence"', names.map((name) => st(' variant="chip"', name))) };

export const TwentySteps: StoryObj = { render: () => story("evidence-chain", ' label="Evidence"', Array.from({ length: 20 }, (_, at) => st("", `Step ${String(at + 1)}`))) };

export const LongStep: StoryObj = {
  render: () => story("evidence-chain-narrow", ' label="Evidence"', [st("", "Spec"), st("", "The plan was approved by the operator after two rounds of review"), st("", "Review")]),
};

export const WrapAnywhere: StoryObj = { render: () => story("evidence-chain-narrow", ' label="Evidence"', [st("", "Spec"), st(' wrap="anywhere"', `Commit ${identifier}${identifier}`), st("", "Review")]) };

export const HiddenStep: StoryObj = { render: () => story("evidence-chain", ' label="Evidence"', names.map((name, at) => st(at === 2 ? " hidden" : "", name))) };

export const RightToLeft: StoryObj = { render: () => `<div dir="rtl">${story("evidence-chain-narrow", ' label="Evidence"', six(true))}</div>` };

export const Unnamed: StoryObj = { render: () => story("evidence-chain", "", six(false)) };

export const Empty: StoryObj = { render: () => story("evidence-chain", ' label="Evidence"', [st(" hidden", "Spec")]) };

export const StandaloneSteps: StoryObj = { render: () => `<div data-story="evidence-chain">${st("", "Spec")} ${st(' variant="chip"', "3 checks")}</div>` };

export const NamedByHostAriaLabel: StoryObj = { render: () => story("evidence-chain", ' aria-label="Proof" label="Evidence"', six(false)) };

export const BlankHostAriaLabel: StoryObj = { render: () => story("evidence-chain", ' aria-label="  " label="Evidence"', six(false)) };
