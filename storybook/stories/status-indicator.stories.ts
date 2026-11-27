// The ocelle-status-indicator stories (018 FR-004, US1; research.md R-12): `Tones`, every tone of the status
// vocabulary in a row without `pulse` and a row with it, each indicator beside text naming its state (an unlabelled
// indicator is hidden from the accessibility tree, so the text names the state); and `Labelled`, every tone named by
// `label`, the success one pulsing. Both in light and dark through the preview's theme global. #10's capture and axe
// contexts reduce motion, so the `pulse` row shows the solid dot and carries the axe and state coverage of `pulse`;
// the pulse itself is proven by the US1-4 browser scenarios. The element is imported from the package source by
// relative path, as the other element stories are. No markup has a style attribute, no story declares a pointer state,
// and all text is Latin script.
import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-status-indicator.ts";

const meta: Meta = { title: "Elements/ocelle-status-indicator" };
export default meta;

const tones = [
  ["info", "Info"],
  ["success", "Success"],
  ["warning", "Warning"],
  ["danger", "Danger"],
  ["neutral", "Neutral"],
] as const;

/** One row of indicators, each beside the text that names its tone. */
function row(pulse: boolean): string {
  return `<p>${tones.map(([tone, text]) => `<span><ocelle-status-indicator tone="${tone}"${pulse ? " pulse" : ""}></ocelle-status-indicator> ${text}</span>`).join(" ")}</p>`;
}

export const Tones: StoryObj = { render: () => `${row(false)}${row(true)}` };

const labels = [
  ["info", "Queued"],
  ["success", "Running"],
  ["warning", "Blocked"],
  ["danger", "Failed"],
  ["neutral", "Draft"],
] as const;

export const Labelled: StoryObj = {
  render: () => `<p>${labels.map(([tone, label]) => `<ocelle-status-indicator tone="${tone}" label="${label}"${tone === "success" ? " pulse" : ""}></ocelle-status-indicator>`).join(" ")}</p>`,
};
