import { describe, expect, it } from "vitest";
import { define, registering } from "../src/define.ts";
import type * as DataTableModule from "../src/ocelle-data-table.ts";
import type * as TimelineModule from "../src/ocelle-event-timeline.ts";
import type * as ChainModule from "../src/ocelle-evidence-chain.ts";
import type * as StepModule from "../src/ocelle-evidence-step.ts";
import type * as EventModule from "../src/ocelle-timeline-event.ts";

// Guarded registration (005 FR-006, research.md R-02, T014): `define` defines a free tag, and for a tag already
// defined it does nothing and throws nothing, so the first definition stays. Vitest's browser mode gives this file its
// own iframe, so its registry holds only what it defines (isolate stays on in the elements project).
class First extends HTMLElement {}
class Second extends HTMLElement {}
class Fresh extends HTMLElement {}

// The registration flag (specs/010-feedback-forms research.md R-02, FR-008; T019): `registering()` reads true only
// while a `define` call's `customElements.define` runs. This describe comes first, so its first reading is taken
// before any `define` call of the file.
describe("registering()", () => {
  it("reads false before any define call, true in a constructor the registration's upgrade runs, false after it and in a later constructor", () => {
    const before = registering();
    const seen: boolean[] = [];
    class Probe extends HTMLElement {
      constructor() {
        super();
        seen.push(registering());
      }
    }
    document.body.insertAdjacentHTML("beforeend", '<ocelle-define-probe id="probe"></ocelle-define-probe>');
    define("ocelle-define-probe", Probe);
    const after = registering();
    document.createElement("ocelle-define-probe");
    document.getElementById("probe")?.remove();
    expect({ before, seen, after }).toEqual({ before: false, seen: [true, false], after: false });
  });
});

describe("define(tag, constructor)", () => {
  it("defines a free tag with the constructor", () => {
    define("ocelle-define-fresh", Fresh);
    expect(customElements.get("ocelle-define-fresh")).toBe(Fresh);
  });

  it("keeps the first class when the tag is defined twice with two classes, and throws nothing", () => {
    define("ocelle-define-twice", First);
    expect(() => {
      define("ocelle-define-twice", Second);
    }).not.toThrow();
    expect(customElements.get("ocelle-define-twice")).toBe(First);
    expect(document.createElement("ocelle-define-twice")).toBeInstanceOf(First);
  });

  // 019 (contracts/checks.md § Bodies that the platform alone could pass, "define twice"; tasks.md T010): two copies of
  // the package's records elements. The first copy's class is defined; the second copy's `define` call is a no-op, so
  // the tag resolves to the first copy's class, and an instance renders its shadow structure. Phases 2 and 3 add the
  // timeline and the chain to this body.
  it("two copies of the records elements: the first definition wins, the tag resolves to the first copy's class, and it renders its shadow structure", async () => {
    const copy = (name: string): Promise<typeof DataTableModule> => import(/* @vite-ignore */ `../src/ocelle-data-table.ts?copy=${name}`) as Promise<typeof DataTableModule>;
    const first = await copy("first");
    const second = await copy("second");
    const element = document.createElement("ocelle-data-table");
    element.innerHTML = '<table id="t"><tbody><tr><td>WP01</td></tr></tbody></table>';
    document.body.append(element);
    await (element as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const box = element.shadowRoot?.querySelector(".region-box") ?? null;
    element.remove();
    expect({
      distinct: first.OcelleDataTable !== second.OcelleDataTable,
      dataTable: customElements.get("ocelle-data-table") === first.OcelleDataTable,
      instance: element instanceof first.OcelleDataTable,
      box: box !== null,
    }).toEqual({ distinct: true, dataTable: true, instance: true, box: true });
  });

  // 019 phase 2 (T034): the timeline and its event, as the data table above. The timeline's copies import the event
  // module by the same path, so they share one event class.
  it("two copies of the timeline and the event: the first definitions win, the tags resolve to the first copies' classes, and a timeline renders its list with the event assigned", async () => {
    const timelines = async (name: string): Promise<typeof TimelineModule> => import(/* @vite-ignore */ `../src/ocelle-event-timeline.ts?copy=${name}`) as Promise<typeof TimelineModule>;
    const events = async (name: string): Promise<typeof EventModule> => import(/* @vite-ignore */ `../src/ocelle-timeline-event.ts?copy=${name}`) as Promise<typeof EventModule>;
    const firstEvent = await events("first");
    const secondEvent = await events("second");
    const first = await timelines("first");
    const second = await timelines("second");
    const element = document.createElement("ocelle-event-timeline");
    element.innerHTML = '<ocelle-timeline-event id="ev" time="14:02">Mission created</ocelle-timeline-event>';
    document.body.append(element);
    await (element as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const assigned = element.shadowRoot?.querySelector<HTMLSlotElement>("ol > li > slot")?.assignedElements().map((each) => each.id) ?? [];
    element.remove();
    expect({
      distinct: [first.OcelleEventTimeline !== second.OcelleEventTimeline, firstEvent.OcelleTimelineEvent !== secondEvent.OcelleTimelineEvent],
      timeline: customElements.get("ocelle-event-timeline") === first.OcelleEventTimeline,
      event: customElements.get("ocelle-timeline-event") === firstEvent.OcelleTimelineEvent,
      instance: element instanceof first.OcelleEventTimeline,
      assigned,
    }).toEqual({ distinct: [true, true], timeline: true, event: true, instance: true, assigned: ["ev"] });
  });
  // 019 phase 3 (T057): the chain and its step, as the timeline above.
  it("two copies of the chain and the step: the first definitions win, the tags resolve to the first copies' classes, and a chain renders its list with the step assigned", async () => {
    const chains = async (name: string): Promise<typeof ChainModule> => import(/* @vite-ignore */ `../src/ocelle-evidence-chain.ts?copy=${name}`) as Promise<typeof ChainModule>;
    const steps = async (name: string): Promise<typeof StepModule> => import(/* @vite-ignore */ `../src/ocelle-evidence-step.ts?copy=${name}`) as Promise<typeof StepModule>;
    const firstStep = await steps("first");
    const secondStep = await steps("second");
    const first = await chains("first");
    const second = await chains("second");
    const element = document.createElement("ocelle-evidence-chain");
    element.innerHTML = '<ocelle-evidence-step id="es">Spec</ocelle-evidence-step>';
    document.body.append(element);
    await (element as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    const assigned = element.shadowRoot?.querySelector<HTMLSlotElement>("ol > li > slot")?.assignedElements().map((each) => each.id) ?? [];
    element.remove();
    expect({
      distinct: [first.OcelleEvidenceChain !== second.OcelleEvidenceChain, firstStep.OcelleEvidenceStep !== secondStep.OcelleEvidenceStep],
      chain: customElements.get("ocelle-evidence-chain") === first.OcelleEvidenceChain,
      step: customElements.get("ocelle-evidence-step") === firstStep.OcelleEvidenceStep,
      instance: element instanceof first.OcelleEvidenceChain,
      assigned,
    }).toEqual({ distinct: [true, true], chain: true, step: true, instance: true, assigned: ["es"] });
  });
});
