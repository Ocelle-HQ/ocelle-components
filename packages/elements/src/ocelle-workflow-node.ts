import { LitElement } from "lit";
import { define } from "./define.ts";

/** @tagname ocelle-workflow-node */
export class OcelleWorkflowNode extends LitElement {
  declare nodeId: string;
  declare label: string;
  declare kind: string;
  declare accountableRole: string;
  declare outcomes: readonly string[];
  declare selected: boolean;
}

define("ocelle-workflow-node", OcelleWorkflowNode);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-workflow-node": OcelleWorkflowNode;
  }
}
