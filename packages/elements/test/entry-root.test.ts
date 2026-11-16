import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014, T052; specs/010-feedback-forms
// T015, T033, T051; 013 contracts/elements.md § Modules and exports, T006, T025): importing only src/index.ts defines
// every element of the package, `ocelle-icon`, `ocelle-brand-mark`, `ocelle-notice`, `ocelle-form-input`,
// `ocelle-form-select`, `ocelle-facts`, `ocelle-fact`, `ocelle-empty-state` and `ocelle-progress`, each as the class the
// root exports (analysis F1 (a): the mark joins in phase 5; the notice in 010 phase 2, the input in 010 phase 3, the
// select in 010 phase 4; the facts, the empty state and the progress in 013). This file's own iframe (Vitest browser
// mode, isolate on) holds only what this import defines.
describe("importing src/index.ts", () => {
  it("defines ocelle-icon, ocelle-brand-mark, ocelle-notice, ocelle-form-input and ocelle-form-select as the OcelleIcon, OcelleBrandMark, OcelleNotice, OcelleFormInput and OcelleFormSelect it exports", () => {
    const exported = root as Record<string, unknown>;
    expect([exported.OcelleIcon, exported.OcelleBrandMark, exported.OcelleNotice, exported.OcelleFormInput, exported.OcelleFormSelect].map((each) => typeof each)).toEqual([
      "function",
      "function",
      "function",
      "function",
      "function",
    ]);
    expect({
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      notice: customElements.get("ocelle-notice"),
      input: customElements.get("ocelle-form-input"),
      select: customElements.get("ocelle-form-select"),
    }).toEqual({ icon: exported.OcelleIcon, mark: exported.OcelleBrandMark, notice: exported.OcelleNotice, input: exported.OcelleFormInput, select: exported.OcelleFormSelect });
  });

  it("defines ocelle-facts and ocelle-fact as the OcelleFacts and OcelleFact it exports, and a sheet renders its pair (013)", async () => {
    const exported = root as Record<string, unknown>;
    document.body.innerHTML = '<ocelle-facts id="s"><ocelle-fact label="Owner">Ada</ocelle-fact></ocelle-facts>';
    await (document.getElementById("s") as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect({
      facts: customElements.get("ocelle-facts"),
      fact: customElements.get("ocelle-fact"),
      term: document.getElementById("s")?.shadowRoot?.querySelector("dt")?.textContent,
    }).toEqual({ facts: exported.OcelleFacts, fact: exported.OcelleFact, term: "Owner" });
  });

  it("defines ocelle-empty-state as the OcelleEmptyState it exports, and an empty state renders its heading slot (013)", async () => {
    const exported = root as Record<string, unknown>;
    document.body.innerHTML = '<ocelle-empty-state id="e"><h2 slot="heading">No missions yet</h2></ocelle-empty-state>';
    await (document.getElementById("e") as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect({
      type: typeof exported.OcelleEmptyState,
      state: customElements.get("ocelle-empty-state"),
      heading: document.getElementById("e")?.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="heading"]')?.assignedElements().map((each) => each.textContent),
    }).toEqual({ type: "function", state: exported.OcelleEmptyState, heading: ["No missions yet"] });
  });

  it("defines ocelle-progress as the OcelleProgress it exports, and a bar renders its track (013 phase 3)", async () => {
    const exported = root as Record<string, unknown>;
    document.body.innerHTML = '<ocelle-progress id="p" value="7" max="12" label="Tasks done"></ocelle-progress>';
    await (document.getElementById("p") as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect({
      type: typeof exported.OcelleProgress,
      progress: customElements.get("ocelle-progress"),
      track: document.getElementById("p")?.shadowRoot?.querySelector('[part="track"]') !== null && document.getElementById("p")?.shadowRoot !== null,
    }).toEqual({ type: "function", progress: exported.OcelleProgress, track: true });
  });
});
