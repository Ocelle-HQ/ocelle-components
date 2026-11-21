// The static ocelle-pill-tag stories (018 FR-004, US3; research.md R-12): `Statuses`, one pill per status of the
// vocabulary; `Badge`, one count badge per status; `Compact`, the five pills and the five badges in the compact
// density; `WithIcon`, pills with a leading icon, a compact one and a badge among them; and `LongTextWraps`, a long
// pill and a long compact badge in a narrow block, each wrapping onto further lines inside the pill. All in light and
// dark through the preview's theme global. Every pill here is static (no `interactive`, no `href`): the interactive
// stories are user story 4's. The element is imported from the package source by relative path, as the other element
// stories are. No markup has a style attribute, no story declares a pointer state, and all text is Latin script.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-icon.ts";
import "../../packages/elements/src/ocelle-pill-tag.ts";

const meta: Meta = { title: "Elements/ocelle-pill-tag" };
export default meta;

const labels = [
  ["info", "Running"],
  ["success", "Done"],
  ["warning", "Blocked"],
  ["danger", "Failed"],
  ["neutral", "Draft"],
] as const;

const counts = [
  ["info", "3"],
  ["success", "12"],
  ["warning", "1"],
  ["danger", "7"],
  ["neutral", "128"],
] as const;

const icon = '<ocelle-icon slot="icon" name="folder"></ocelle-icon>';

/** One pill of `status` with `text`, its other attributes as given. */
function pill(status: string, text: string, attributes = "", content = ""): string {
  return `<ocelle-pill-tag status="${status}"${attributes}>${content}${text}</ocelle-pill-tag>`;
}

/** The pills, side by side as inline content. */
function row(pills: readonly string[]): string {
  return `<p>${pills.join(" ")}</p>`;
}

export const Statuses: StoryObj = { render: () => row(labels.map(([status, text]) => pill(status, text))) };

export const Badge: StoryObj = { render: () => row(counts.map(([status, text]) => pill(status, text, ' variant="badge"'))) };

export const Compact: StoryObj = {
  render: () => row(labels.map(([status, text]) => pill(status, text, ' density="compact"'))) + row(counts.map(([status, text]) => pill(status, text, ' variant="badge" density="compact"'))),
};

export const WithIcon: StoryObj = {
  render: () => row(labels.map(([status, text]) => pill(status, text, "", icon))) + row([pill("info", "Running", ' density="compact"', icon), pill("success", "12", ' variant="badge"', icon)]),
};

export const LongTextWraps: StoryObj = {
  render: () =>
    `<div data-story="pill-narrow">${row([pill("warning", "Blocked by the review of the scheduler pipeline")])}${row([pill("info", "Waiting for the nightly integration run", ' variant="badge" density="compact"')])}</div>`,
};
