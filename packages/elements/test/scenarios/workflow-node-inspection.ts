export const recordedStatus = "Passed in the recorded run";
export const replacementStatus = "Awaiting the recorded decision";
export const editedStatus = "Recorded decision available";

type StatusChange = "add" | "add-hidden" | "replace" | "edit" | "empty" | "remove" | "reveal" | "hide";

export async function changeRecordedStatus([change, text = ""]: readonly [StatusChange, string?]): Promise<void> {
  const node = document.querySelector<HTMLElementTagNameMap["ocelle-workflow-node"]>("#review");
  if (node === null) throw new Error("the review node must be mounted");
  const current = node.querySelector<HTMLElement>('[slot="status"]');
  if (change === "add" || change === "add-hidden" || change === "replace") {
    const status = document.createElement("span");
    status.id = "recorded-status";
    status.slot = "status";
    status.hidden = change === "add-hidden";
    status.textContent = text;
    if (current === null) node.append(status);
    else current.replaceWith(status);
  } else {
    if (current === null) throw new Error("the status fixture must be mounted before it changes");
    if (change === "remove") current.remove();
    else if (change === "reveal" || change === "hide") current.hidden = change === "hide";
    else current.textContent = change === "empty" ? "" : text;
  }
  await node.updateComplete;
  await new Promise<void>((resolve) => requestAnimationFrame(() => { resolve(); }));
}

export function recordedStep(): {
  readonly target: string | null;
  readonly outsideAction: boolean;
  readonly associated: boolean;
  readonly status: readonly { text: string; visible: boolean }[];
  readonly actionCount: number;
  readonly outcomes: readonly string[];
} {
  const node = document.querySelector("ocelle-workflow-node");
  const root = node?.shadowRoot;
  const action = root?.querySelector("button");
  const slot = root?.querySelector<HTMLSlotElement>('slot[name="status"]');
  const assigned = slot?.assignedElements() ?? [];
  return {
    target: slot?.name ?? null,
    outsideAction: slot != null && action != null && !action.contains(slot),
    associated: slot != null && (action?.ariaDescribedByElements?.some((description) => description.contains(slot)) ?? false),
    status: assigned.map((status) => {
      const text = status.textContent.trim();
      const visible = text !== "" && status.getBoundingClientRect().height > 0 && getComputedStyle(status).visibility === "visible";
      return { text, visible };
    }),
    actionCount: root?.querySelectorAll("button, a, [role=button], [tabindex]").length ?? 0,
    outcomes: [...(root?.querySelectorAll("li") ?? [])].map((item) => item.textContent.trim()),
  };
}
