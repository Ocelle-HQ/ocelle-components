// The ocelle-copy-field stories (014 FR-050, FR-051, US4 scenarios 1, 2, 5, 9 and 10; research.md R-07, R-12, R-15): a
// short command, a long command wrapped onto several lines, a field with a status shown, an empty field with its Copy
// control disabled, and the focused Copy control, in light and dark through the preview's theme global. The element is
// imported from the package source by relative path, as the other element stories import theirs, so the Storybook needs
// no built dist/; importing the copy field defines `ocelle-icon` too. The markup has no style attribute: the wrapped
// story's width is a rule of stories-layout.css on its data-story attribute. The status story writes `status` in its
// markup, as a host reporting an outcome; the focused story focuses the Copy control in `play`, which ends before the
// render signal, once the field has rendered. The grouped identifier stories use fictional values, and the revealed
// digest opens the same disclosure used by the compact story.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-copy-field.ts";

const meta: Meta = { title: "Elements/ocelle-copy-field" };
export default meta;

const command = "pnpm --filter @ocelle/elements run manifest";
const longCommand = "spec-kitty agent workflow implement --mission 014-selection-input --phase 5 --base main --worktree .worktrees/014-selection-input-phase-5 --no-push";
const recordId = " rec:workflow:K7M4VP2TR8CZQ6HXJ3N9FW5AY2BKD8L6C4ER7N5Q9X2TH6ZKP3MA5VD ";
const digest = " workflow-build-artifact:sha256:aB12cD34eF56Ab78Cd90Ef12aB34cD56eF78Ab90Cd12Ef34aB56cD78eF9 ";

export const Short: StoryObj = { render: () => `<ocelle-copy-field aria-label="Manifest command" value="${command}"></ocelle-copy-field>` };

export const WrappedLongCommand: StoryObj = {
  name: "Wrapped long command",
  render: () => `<div data-story="copy-field-wrapped"><ocelle-copy-field aria-label="Implement command" value="${longCommand}"></ocelle-copy-field></div>`,
};

export const WithStatus: StoryObj = {
  name: "With status",
  render: () => `<ocelle-copy-field aria-label="Manifest command" value="${command}" status="Copied to clipboard"></ocelle-copy-field>`,
};

export const EmptyDisabled: StoryObj = { name: "Empty disabled", render: () => '<ocelle-copy-field aria-label="Command"></ocelle-copy-field>' };

export const FocusedCopyControl: StoryObj = {
  name: "Focused copy control",
  render: () => `<ocelle-copy-field aria-label="Manifest command" value="${command}" copy-label="Copy command"></ocelle-copy-field>`,
  play: async ({ canvasElement }) => {
    await customElements.whenDefined("ocelle-copy-field");
    const field = canvasElement.querySelector("ocelle-copy-field") as unknown as { updateComplete?: Promise<unknown>; shadowRoot: ShadowRoot | null } | null;
    await field?.updateComplete;
    field?.shadowRoot?.querySelector<HTMLElement>('[part~="copy-control"]')?.focus({ focusVisible: true });
  },
};

export const GroupedRecordId: StoryObj = {
  name: "Grouped record ID",
  render: () => `<ocelle-copy-field grouped aria-label="Workflow record ID" copy-label="Copy record ID" value="${recordId}"></ocelle-copy-field>`,
};

function compactDigest(): string {
  return `<ocelle-copy-field grouped compact aria-label="Build artifact digest" copy-label="Copy digest" value="${digest}"></ocelle-copy-field>`;
}

export const CompactDigest: StoryObj = { name: "Compact digest", render: compactDigest };

export const RevealedDigest: StoryObj = {
  name: "Revealed digest",
  render: compactDigest,
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector("ocelle-copy-field");
    if (field === null) throw new Error("the digest copy field did not render");
    await field.updateComplete;
    const disclosure = field.shadowRoot?.querySelector('button[aria-expanded="false"]');
    if (!(disclosure instanceof HTMLButtonElement)) throw new Error("the digest disclosure did not render collapsed");
    disclosure.click();
    await field.updateComplete;
  },
};
