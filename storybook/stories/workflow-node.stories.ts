import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-workflow-node.ts";

const meta: Meta = { title: "Elements/ocelle-workflow-node" };
export default meta;

const review = {
  nodeId: "review-12",
  label: "Security review",
  kind: "Approval",
  accountableRole: "Reviewer",
  outcomes: ["Approved", "Rejected"],
};

const planning = {
  nodeId: "plan-8",
  label: "Plan rollout",
  kind: "Planning",
  accountableRole: "Coordinator",
  outcomes: ["Plan ready"],
};

function step(data = review, selected = false, focused = false): HTMLElement {
  const frame = document.createElement("div");
  frame.dataset.frame = "S";
  const node = Object.assign(document.createElement("ocelle-workflow-node"), data, { selected });
  frame.append(node);
  if (focused) void node.updateComplete.then(() => { node.focus(); });
  return frame;
}

export const SecurityReview: StoryObj = { render: () => step() };

export const Planning: StoryObj = { render: () => step(planning) };

export const Selected: StoryObj = { render: () => step(review, true) };

export const Focused: StoryObj = { render: () => step(review, false, true) };
