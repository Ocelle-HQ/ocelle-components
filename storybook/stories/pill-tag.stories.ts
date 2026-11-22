// The ocelle-pill-tag stories (018 FR-004, US3, US4; research.md R-12; plan decision 9). Static (user story 3):
// `Statuses`, one pill per status of the vocabulary; `Badge`, one count badge per status; `Compact`, the five pills and
// the five badges in the compact density; `WithIcon`, pills with a leading icon, a compact one and a badge among them;
// and `LongTextWraps`, a long pill and a long compact badge in a narrow block, each wrapping onto further lines inside
// the pill. Interactive (user story 4): `Button`, one interactive pill per status and an interactive badge; `Pressed`,
// a pill and a badge with `aria-pressed="true"` beside their `"false"` twins; `Link`, a link-mode pill and badge;
// `Disabled`, a disabled button-mode pill, link-mode pill and badge; `Focus`, one pill focused by a story-only wrapper
// that calls its plain `focus()` once it has rendered, as `ocelle-button`'s `Focused` story does; and `PillHovered`,
// `BadgeHovered`, `PillActive` and `BadgeActive`, one pill each, hovered or pressed by 006's pointer parameter. The links
// point at fragments of the story page, so a capture never navigates. All in light and dark through the preview's theme
// global. The element is imported from the package source by relative path, as the other element stories are. No
// markup has a style attribute, and all text is Latin script.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-icon.ts";
import "../../packages/elements/src/ocelle-pill-tag.ts";

const meta: Meta = { title: "Elements/ocelle-pill-tag" };
export default meta;

/** A story-only wrapper that focuses the `ocelle-pill-tag` it holds once that has rendered (plan decision 16's pattern). */
class StoryPillFocus extends HTMLElement {
  connectedCallback(): void {
    void customElements.whenDefined("ocelle-pill-tag").then(async () => {
      const pill = this.querySelector("ocelle-pill-tag");
      if (pill === null) return;
      await pill.updateComplete;
      pill.focus();
    });
  }
}
if (customElements.get("story-pill-focus") === undefined) customElements.define("story-pill-focus", StoryPillFocus);

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

export const Button: StoryObj = {
  render: () => row([...labels.map(([status, text]) => pill(status, text, " interactive")), pill("info", "3", ' interactive variant="badge"')]),
};

export const Pressed: StoryObj = {
  render: () =>
    row([pill("info", "Mine", ' interactive aria-pressed="true"'), pill("info", "Mine", ' interactive aria-pressed="false"'), pill("info", "3", ' interactive variant="badge" aria-pressed="true"'), pill("info", "3", ' interactive variant="badge" aria-pressed="false"')]),
};

export const Link: StoryObj = { render: () => row([pill("warning", "Blocked", ' href="#blocked"'), pill("warning", "1", ' variant="badge" href="#blocked"')]) };

export const Disabled: StoryObj = {
  render: () => row([pill("info", "Mine", " interactive disabled"), pill("warning", "Blocked", ' href="#blocked" disabled'), pill("info", "3", ' interactive variant="badge" disabled')]),
};

export const Focus: StoryObj = { render: () => `<p><story-pill-focus>${pill("info", "Mine", " interactive")}</story-pill-focus></p>` };

export const PillHovered: StoryObj = {
  name: "Pill, hovered",
  parameters: { ocelle: { pointer: { hover: "ocelle-pill-tag" } } },
  render: () => row([pill("info", "Mine", " interactive")]),
};

export const BadgeHovered: StoryObj = {
  name: "Badge, hovered",
  parameters: { ocelle: { pointer: { hover: "ocelle-pill-tag" } } },
  render: () => row([pill("info", "3", ' interactive variant="badge"')]),
};

export const PillActive: StoryObj = {
  name: "Pill, active",
  parameters: { ocelle: { pointer: { press: "ocelle-pill-tag" } } },
  render: () => row([pill("info", "Mine", " interactive")]),
};

export const BadgeActive: StoryObj = {
  name: "Badge, active",
  parameters: { ocelle: { pointer: { press: "ocelle-pill-tag" } } },
  render: () => row([pill("info", "3", ' interactive variant="badge"')]),
};
