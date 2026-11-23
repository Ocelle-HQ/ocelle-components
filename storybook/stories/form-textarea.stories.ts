import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-form-textarea.ts";

const meta: Meta = { title: "Elements/ocelle-form-textarea" };
export default meta;

const field = (state = ""): string => `<ocelle-form-textarea
  name="answer" label="Decision" description="Explain the rationale"
  value="Approve the plan.&#10;&#10;Confirm the deployment window."${state}
></ocelle-form-textarea>`;

export const Editable: StoryObj = { render: () => field() };

export const Invalid: StoryObj = { render: () => field(' error="Explain the rollback plan."') };

export const ReadOnly: StoryObj = { name: "Read-only", render: () => field(" readonly") };

export const Disabled: StoryObj = { render: () => field(" disabled") };
