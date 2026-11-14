// The ocelle-context-sidebar stories (011 FR-033, FR-038, US3; research.md R-14; T039): a story per state User Story 3
// names, the full sidebar (a head, three sections and a footer), no head, no footer, one section, text in the default
// slot, empty sections (a head and a footer only) and hidden sections, and one story per naming case of US3-12, each
// rendering that one landmark alone: a host `aria-label` only, `label` and a host `aria-label`, a blank host
// `aria-label` with `label`, and neither. Every other story renders one landmark with a distinct `label`. In light and
// dark through the preview's theme global. The elements are imported from the package source by relative path, as the
// other element stories import theirs. The markup has no style attribute (the csp gate's Storybook check).
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-context-sidebar.ts";
import "../../packages/elements/src/ocelle-section-header.ts";

const meta: Meta = { title: "Elements/ocelle-context-sidebar" };
export default meta;

const head = '<p slot="head">Kitty team</p>';
const links = '<ul><li><a href="#missions">Missions</a></li><li><a href="#runs">Runs</a></li></ul>';
const projects = '<ocelle-section-header><h2 slot="heading">Projects</h2></ocelle-section-header>';
const members = "<p>Six members, two away this week.</p>";
const footer = '<p slot="footer">3 of 5 missions done</p>';
const sections = links + projects + members;

/** A sidebar with `attributes` holding `inner`. */
const sidebar = (attributes: string, inner: string): string => `<ocelle-context-sidebar${attributes}>${inner}</ocelle-context-sidebar>`;

export const Full: StoryObj = { render: () => sidebar(' label="Team navigation"', head + sections + footer) };

export const NoHead: StoryObj = { name: "No head", render: () => sidebar(' label="Team sections"', sections + footer) };

export const NoFooter: StoryObj = { name: "No footer", render: () => sidebar(' label="Team links"', head + sections) };

export const OneSection: StoryObj = { name: "One section", render: () => sidebar(' label="Team missions"', head + links + footer) };

export const TextInTheSlot: StoryObj = { name: "Text in the slot", render: () => sidebar(' label="Team notes"', `${head}${links}Loose text between two sections${members}${footer}`) };

export const EmptySections: StoryObj = { name: "Empty sections", render: () => sidebar(' label="Team summary"', head + footer) };

export const HiddenSections: StoryObj = { name: "Hidden sections", render: () => sidebar(' label="Team overview"', `${head}${links}<p hidden>A hidden section.</p>${members}${footer}`) };

export const HostAriaLabel: StoryObj = { name: "Host aria-label", render: () => sidebar(' aria-label="Team"', head + sections + footer) };

export const LabelAndHostAriaLabel: StoryObj = { name: "Label and host aria-label", render: () => sidebar(' label="Projects" aria-label="Other"', head + sections + footer) };

export const BlankHostAriaLabel: StoryObj = { name: "Blank host aria-label", render: () => sidebar(' label="Projects" aria-label=""', head + sections + footer) };

export const Unnamed: StoryObj = { render: () => sidebar("", head + sections + footer) };
