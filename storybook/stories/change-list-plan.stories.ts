import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-facts.ts";

interface PlanRevisionArgs {
  readonly requiresReview: boolean;
}

const meta: Meta<PlanRevisionArgs> = {
  title: "Workflow Studio/Plan Revision",
  args: { requiresReview: true },
  argTypes: { requiresReview: { control: "boolean" } },
};
export default meta;

const reviewedPlan = {
  previousRetention: "24 hours",
  newRetention: "one hour",
  owner: "Platform team",
};

export const ReviewedPlan: StoryObj<PlanRevisionArgs> = {
  render: ({ requiresReview }) => `
    <article data-story="change-list-plan" aria-labelledby="reviewed-plan-heading">
      <h1 id="reviewed-plan-heading">Reviewed plan revision</h1>
      <ocelle-facts layout="stacked">
        <ocelle-fact label="Previous retention">${reviewedPlan.previousRetention}</ocelle-fact>
        <ocelle-fact label="New retention">${reviewedPlan.newRetention}</ocelle-fact>
        <ocelle-fact label="Retention review">${requiresReview ? "Review required" : "Review not required"}</ocelle-fact>
        <ocelle-fact label="Unchanged owner">${reviewedPlan.owner}</ocelle-fact>
      </ocelle-facts>
    </article>
  `,
};
