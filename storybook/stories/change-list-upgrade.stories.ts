import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-code-block.ts";
import "../../packages/elements/src/ocelle-copy-field.ts";
import "../../packages/elements/src/ocelle-facts.ts";
import "../../packages/elements/src/ocelle-notice.ts";

const meta: Meta = { title: "Workflow Studio/Node Upgrade" };
export default meta;

const comparison = {
  previousDigest: "sha256:" + "0123456789abcdef".repeat(4),
  newDigest: "sha256:" + "fedcba9876543210".repeat(4),
  removedOutcome: "needs-review",
  addedCapability: "metrics:write",
  reviewMessage: "Review the outbound capability before upgrading.",
};

function version(title: "Previous" | "New", digest: string, clipboard: { text: string }): HTMLElement {
  const section = document.createElement("section");
  const heading = document.createElement("h2");
  heading.textContent = title;

  const code = document.createElement("ocelle-code-block");
  code.digest = true;
  code.textContent = digest;

  const field = document.createElement("ocelle-copy-field");
  const label = `${title.toLowerCase()} digest`;
  field.setAttribute("aria-label", `${title} digest`);
  field.copyLabel = `Copy ${label}`;
  field.value = digest;
  field.addEventListener("ocelle-copy-field-request", (event) => {
    const { detail } = event as CustomEvent<{ readonly text: string }>;
    clipboard.text = detail.text;
    field.status = clipboard.text === digest
      ? `Simulated copy complete for ${label}`
      : `Simulated copy failed for ${label}`;
  });

  section.append(heading, code, field);
  return section;
}

export const PinnedVersions: StoryObj = {
  render: () => {
    const article = document.createElement("article");
    article.dataset.story = "change-list-upgrade";
    const title = document.createElement("h1");
    title.textContent = "Pinned node versions";
    const clipboard = { text: "" };

    const changes = document.createElement("ocelle-facts");
    changes.setAttribute("layout", "stacked");
    const removed = document.createElement("ocelle-fact");
    removed.setAttribute("label", "Removed outcome");
    removed.textContent = comparison.removedOutcome;
    const added = document.createElement("ocelle-fact");
    added.setAttribute("label", "Added outbound capability");
    added.textContent = comparison.addedCapability;
    changes.append(removed, added);

    const notice = document.createElement("ocelle-notice");
    notice.setAttribute("tone", "info");
    notice.textContent = comparison.reviewMessage;
    article.append(title, version("Previous", comparison.previousDigest, clipboard), version("New", comparison.newDigest, clipboard), changes, notice);
    return article;
  },
};
