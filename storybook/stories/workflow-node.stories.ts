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

const narrowReview = {
  ...review,
  label: "Review the complete security evidence for the next privileged deployment",
  accountableRole: "Reviewer accountable for authentication and release readiness",
  outcomes: ["Approved for the staged production rollout", "EscalateToReleaseTeamForIndependentProductionVerification"],
};

interface State {
  readonly selected?: boolean;
  readonly waiting?: boolean;
  readonly invalid?: boolean;
  readonly focused?: boolean;
  readonly status?: string;
}

function step(data = review, { focused = false, status, ...state }: State = {}): HTMLElement {
  const frame = document.createElement("div");
  frame.dataset.frame = "S";
  const node = Object.assign(document.createElement("ocelle-workflow-node"), data, state);
  if (status !== undefined) {
    const indicator = document.createElement("span");
    indicator.slot = "status";
    indicator.textContent = status;
    node.append(indicator);
  }
  frame.append(node);
  if (focused) void node.updateComplete.then(() => { node.focus(); });
  return frame;
}

export const SecurityReview: StoryObj = { render: () => step() };

export const Planning: StoryObj = { render: () => step(planning) };

export const Selected: StoryObj = { render: () => step(review, { selected: true }) };

export const Focused: StoryObj = { render: () => step(review, { focused: true }) };

export const Waiting: StoryObj = { render: () => step(review, { waiting: true }) };

export const Invalid: StoryObj = { render: () => step(review, { invalid: true }) };

export const Narrow: StoryObj = { render: () => step(narrowReview) };

export const CombinedFocused: StoryObj = { render: () => step(narrowReview, { selected: true, waiting: true, invalid: true, focused: true }) };

export const ReadOnlyInspection: StoryObj = { name: "Read-only inspection", render: () => step(review, { status: "Passed in the recorded run" }) };
