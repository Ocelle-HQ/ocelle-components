import { describe, expect, it } from "vitest";
import * as root from "../src/index.ts";

// The package root (005 FR-002, US1 scenario 17's runtime half; research.md R-02, T014, T052; 011 FR-001, T014;
// specs/010-feedback-forms T015, T033, T051; 013 contracts/elements.md § Modules and exports, T006, T025): importing
// only src/index.ts defines every element of the package, each as the class the root exports (analysis F1 (a): the
// mark joins in 005 phase 5): `ocelle-icon`, `ocelle-brand-mark`; since 009 (T017) `ocelle-scroller`, since 009 phase 3
// (T034) `ocelle-workflow-board` and `ocelle-workflow-lane`, and since 009 phase 4 (T051) `ocelle-list-detail`; since
// 011 `ocelle-card`, `ocelle-section-header`, `ocelle-page-header` (T027), `ocelle-context-sidebar` (T034) and
// `ocelle-personal-rail` (T042); since 010 `ocelle-notice` (phase 2), `ocelle-form-input` (phase 3) and
// `ocelle-form-select` (phase 4); and since 013 `ocelle-facts`, `ocelle-fact`, `ocelle-empty-state` and
// `ocelle-progress`. This file's own iframe (Vitest browser mode, isolate on) holds only what this import defines.
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

  it("defines ocelle-icon, ocelle-brand-mark, ocelle-scroller, ocelle-workflow-board, ocelle-workflow-lane, ocelle-list-detail, ocelle-card, ocelle-section-header, ocelle-page-header, ocelle-context-sidebar and ocelle-personal-rail as the OcelleIcon, OcelleBrandMark, OcelleScroller, OcelleWorkflowBoard, OcelleWorkflowLane, OcelleListDetail, OcelleCard, OcelleSectionHeader, OcellePageHeader, OcelleContextSidebar and OcellePersonalRail it exports", () => {
    const exported = root as Record<string, unknown>;
    expect(
      [
        exported.OcelleIcon,
        exported.OcelleBrandMark,
        exported.OcelleScroller,
        exported.OcelleWorkflowBoard,
        exported.OcelleWorkflowLane,
        exported.OcelleListDetail,
        exported.OcelleCard,
        exported.OcelleSectionHeader,
        exported.OcellePageHeader,
        exported.OcelleContextSidebar,
        exported.OcellePersonalRail,
      ].map((each) => typeof each),
    ).toEqual(["function", "function", "function", "function", "function", "function", "function", "function", "function", "function", "function"]);
    expect({
      icon: customElements.get("ocelle-icon"),
      mark: customElements.get("ocelle-brand-mark"),
      scroller: customElements.get("ocelle-scroller"),
      board: customElements.get("ocelle-workflow-board"),
      lane: customElements.get("ocelle-workflow-lane"),
      listDetail: customElements.get("ocelle-list-detail"),
      card: customElements.get("ocelle-card"),
      header: customElements.get("ocelle-section-header"),
      page: customElements.get("ocelle-page-header"),
      sidebar: customElements.get("ocelle-context-sidebar"),
      rail: customElements.get("ocelle-personal-rail"),
    }).toEqual({
      icon: exported.OcelleIcon,
      mark: exported.OcelleBrandMark,
      scroller: exported.OcelleScroller,
      board: exported.OcelleWorkflowBoard,
      lane: exported.OcelleWorkflowLane,
      listDetail: exported.OcelleListDetail,
      card: exported.OcelleCard,
      header: exported.OcelleSectionHeader,
      page: exported.OcellePageHeader,
      sidebar: exported.OcelleContextSidebar,
      rail: exported.OcellePersonalRail,
    });
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
