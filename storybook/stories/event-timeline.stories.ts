// The ocelle-event-timeline stories (019 FR-050; contracts/checks.md § Stories; analysis C1 (c); phase 2 spike Q1 (b)):
// the 13 states of the event timeline and its event, the standalone event among them, in light and dark through the
// preview's theme global. The element is imported from the package source by relative path, as the other element
// stories import theirs. Widths are data-story rules of .storybook/stories-layout.css (calc() over tokens, each capped
// at the viewport); the markup has no style attribute and no class, all text is Latin script, and no story declares a
// pointer state.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-event-timeline.ts";

const meta: Meta = { title: "Elements/ocelle-event-timeline" };
export default meta;

/** An unbroken 26-character identifier. */
const identifier = "01JD8X2K7Q9M4N6P3R5T0V2W8Y";

/** An `ocelle-timeline-event`. */
const ev = (attributes: string, content: string): string => `<ocelle-timeline-event${attributes}>${content}</ocelle-timeline-event>`;

/** The three events of the mission history. */
const three = [ev(' time="14:02"', "Mission created"), ev(' time="14:20"', "Plan approved"), ev(' time="14:41"', "Review requested")];

/** A timeline in a story wrapper. */
const story = (wrapper: string, attributes: string, events: readonly string[]): string => `<div data-story="${wrapper}"><ocelle-event-timeline${attributes}>${events.join("")}</ocelle-event-timeline></div>`;

export const ThreeEvents: StoryObj = { render: () => story("event-timeline", ' label="Mission history"', three) };

export const WithoutTime: StoryObj = {
  render: () => story("event-timeline", ' label="Mission history"', [ev(' time="14:02"', "Mission created"), ev("", "Note added by the reviewer"), ev(' time="14:41"', "Review requested")]),
};

export const MarkedUpTimes: StoryObj = {
  render: () =>
    story("event-timeline", ' label="Mission history"', [
      ev("", '<time slot="time" datetime="2026-11-15T14:02">14:02</time>Mission created'),
      ev(' time="09:00"', 'Plan approved<time slot="time" datetime="2026-11-15T14:20">14:20</time>'),
      ev("", '<time slot="time" datetime="2026-11-15T14:41">14:41</time>Review requested'),
    ]),
};

export const LongIdentifierWrap: StoryObj = {
  render: () => story("event-timeline-narrow", ' label="Mission history"', [ev(' time="14:02"', "Mission created"), ev(' time="14:20" wrap="anywhere"', `Deployed ${identifier}${identifier}`), ev(' time="14:41"', "Review requested")]),
};

export const LinkInEvent: StoryObj = {
  render: () => story("event-timeline", ' label="Mission history"', [ev(' time="14:02"', "Mission created"), ev(' time="14:20"', 'Opened <a href="#pull-request-42">pull request 42</a>'), ev(' time="14:41"', "Review requested")]),
};

export const OneEvent: StoryObj = { render: () => story("event-timeline", ' label="Mission history"', [ev(' time="14:02"', "Mission created")]) };

export const HiddenEvent: StoryObj = {
  render: () => story("event-timeline", ' label="Mission history"', [ev(' time="14:02"', "Mission created"), ev(' time="14:20" hidden', "Plan approved"), ev(' time="14:41"', "Review requested")]),
};

export const RightToLeft: StoryObj = { render: () => `<div dir="rtl">${story("event-timeline-narrow", ' label="Mission history"', three)}</div>` };

export const Width320: StoryObj = { render: () => story("event-timeline-narrow", ' label="Mission history"', [...three, ev(' time="14:50" wrap="anywhere"', `Deployed ${identifier}`)]) };

export const Empty: StoryObj = { render: () => story("event-timeline", ' label="Mission history"', [ev(' time="14:02" hidden', "Mission created")]) };

export const StandaloneEvents: StoryObj = {
  render: () => `<div data-story="event-timeline">${ev(' time="14:02"', "Mission created")}${ev("", 'Review requested<time slot="time" datetime="2026-11-15T14:41">14:41</time>')}</div>`,
};

export const NamedByHostAriaLabel: StoryObj = { render: () => story("event-timeline", ' aria-label="History" label="Mission history"', three) };

export const BlankHostAriaLabel: StoryObj = { render: () => story("event-timeline", ' aria-label="  " label="Mission history"', three) };
