import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { css } from "../../tokens/src/generate.ts";
import { source } from "../../tokens/src/source.ts";
import type { OcelleStepIndicator, StepIndicatorStep } from "../src/ocelle-step-indicator.ts";

// The module is present at the scaffold, but absent on the original phase base.
import.meta.glob("../src/ocelle-step-indicator.ts", { eager: true });

const steps = [
  { label: "Review", state: "completed" },
  { label: "Choose", state: "current" },
  { label: "Confirm", state: "upcoming" },
] as const satisfies readonly StepIndicatorStep[];
const labels = ["Review", "Choose", "Confirm"];

const tokenSheet = new CSSStyleSheet();
tokenSheet.replaceSync(css(source));

async function mount(rows?: readonly StepIndicatorStep[]): Promise<OcelleStepIndicator> {
  const indicator = document.createElement("ocelle-step-indicator");
  indicator.id = "milestones";
  indicator.style.inlineSize = "40rem";
  if (rows !== undefined) indicator.steps = rows;
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, tokenSheet];
  document.body.append(indicator);
  await indicator.updateComplete;
  return indicator;
}

function items(indicator: OcelleStepIndicator): HTMLLIElement[] {
  return [...(indicator.shadowRoot?.querySelectorAll<HTMLLIElement>("ol > li") ?? [])];
}

function presentation(indicator: OcelleStepIndicator) {
  return items(indicator).map((item) => ({
    label: item.querySelector(".label")?.textContent,
    ordinal: item.querySelector(".marker")?.textContent ?? "",
    current: item.getAttribute("aria-current"),
    markerHidden: item.querySelector(".marker")?.getAttribute("aria-hidden"),
    completed: item.querySelector(".completion")?.textContent.trim() ?? null,
  }));
}

const progress = [
  { label: "Review", ordinal: "", current: null, markerHidden: "true", completed: "Completed" },
  { label: "Choose", ordinal: "2", current: "step", markerHidden: "true", completed: null },
  { label: "Confirm", ordinal: "3", current: null, markerHidden: "true", completed: null },
];

async function spokenProgress() {
  const tree = await commands.axTree("milestones", "subtree") as { role: string; name: string }[];
  return {
    roles: tree.filter(({ role }) => role === "list" || role === "listitem").map(({ role }) => role),
    text: tree.filter(({ role }) => role === "StaticText").map(({ name }) => name.trim()),
  };
}

const spoken = {
  roles: ["list", "listitem", "listitem", "listitem"],
  text: ["Review", "Completed", "Choose", "Confirm"],
};

afterEach(async () => {
  document.body.replaceChildren();
  document.adoptedStyleSheets = document.adoptedStyleSheets.filter((sheet) => sheet !== tokenSheet);
  delete document.documentElement.dataset.theme;
  await commands.emulateForcedColors("none");
});

describe("ocelle-step-indicator", () => {
  it("shows the check, source order and ordinal of the supplied steps, and identifies the current step", async () => {
    const indicator = await mount(steps);
    expect(presentation(indicator)).toEqual(progress);
    expect(indicator.shadowRoot?.querySelector("ol")?.getAttribute("role")).toBe("list");
    const check = indicator.shadowRoot?.querySelector(".check");
    expect(check?.parentElement?.getAttribute("aria-hidden")).toBe("true");
    expect(check?.getBoundingClientRect().width ?? 0).toBeGreaterThan(0);
  });

  it("begins empty and accepts populated, property-only steps with no current step", async () => {
    const indicator = await mount([]);
    expect(indicator.steps).toEqual([]);
    expect(indicator.shadowRoot?.querySelector("ol") ?? null).toBeNull();

    indicator.setAttribute("steps", '[{"label":"Not host data","state":"current"}]');
    expect(indicator.steps).toEqual([]);
    indicator.steps = [
      { label: "Review", state: "upcoming" },
      { label: "Choose", state: "upcoming" },
      { label: "Confirm", state: "completed" },
    ];
    await indicator.updateComplete;

    const rendered = items(indicator);
    expect(rendered.map((item) => item.querySelector(".label")?.textContent)).toEqual(labels);
    expect(rendered.map((item) => item.getAttribute("aria-current"))).toEqual([null, null, null]);
    expect(rendered.map((item) => item.querySelector(".marker")?.textContent)).toEqual(["1", "2", ""]);

    indicator.steps = [];
    await indicator.updateComplete;
    expect(indicator.shadowRoot?.querySelector("ol") ?? null).toBeNull();
    expect(indicator.getAttribute("steps")).toBe('[{"label":"Not host data","state":"current"}]');
  });

  it("updates from frozen host data and marks only the first current step in the new order", async () => {
    const indicator = await mount(steps);
    expect(presentation(indicator)).toEqual(progress);
    const replacement = Object.freeze([
      Object.freeze({ label: "Review", state: "upcoming" }),
      Object.freeze({ label: "Publish", state: "current" }),
      Object.freeze({ label: "Verify", state: "current" }),
    ] as const);

    indicator.steps = replacement;
    await indicator.updateComplete;

    expect(presentation(indicator)).toEqual([
      { label: "Review", ordinal: "1", current: null, markerHidden: "true", completed: null },
      { label: "Publish", ordinal: "2", current: "step", markerHidden: "true", completed: null },
      { label: "Verify", ordinal: "3", current: null, markerHidden: "true", completed: null },
    ]);
    expect(indicator.steps).toBe(replacement);
    expect(indicator.hasAttribute("steps")).toBe(false);
  });

  it("keeps all labels and completion in the accessible list when the other labels compact", async () => {
    const indicator = await mount(steps);
    expect(await spokenProgress()).toEqual(spoken);
    const widths = () => items(indicator).map((item) => item.querySelector(".label")?.getBoundingClientRect().width ?? 0);
    expect(widths().every((width) => width > 1)).toBe(true);

    indicator.style.inlineSize = "16rem";
    const [complete, current, upcoming] = widths();
    expect(complete).toBeLessThanOrEqual(1);
    expect(current).toBeGreaterThan(1);
    expect(upcoming).toBeLessThanOrEqual(1);
    expect(await spokenProgress()).toEqual(spoken);
  });

  it("leaves Tab stops and actions with the host even when a real pointer gesture hits a marker", async () => {
    const indicator = await mount(steps);
    expect(presentation(indicator)).toEqual(progress);

    const before = document.createElement("button");
    before.textContent = "Previous pane";
    const after = document.createElement("button");
    after.textContent = "Continue";
    indicator.before(before);
    indicator.after(after);
    const targets: EventTarget[] = [];
    const actions: string[] = [];
    indicator.addEventListener("click", (event) => { targets.push(...event.composedPath().slice(0, 1)); });
    after.addEventListener("click", () => { actions.push(after.textContent); });

    before.focus();
    await commands.press("Tab");
    expect(document.activeElement).toBe(after);
    await commands.press("Tab", ["Shift"]);
    expect(document.activeElement).toBe(before);

    await commands.pointer("click", "milestones", { inner: "li:nth-child(2) .marker" });
    expect(targets).toEqual([items(indicator)[1]?.querySelector(".marker")]);
    expect(actions).toEqual([]);
    expect(presentation(indicator)).toEqual(progress);
    expect(indicator.shadowRoot?.activeElement).toBeNull();

    after.focus();
    await commands.press("Enter");
    expect(actions).toEqual(["Continue"]);
  });

  it.each(["light", "dark"] as const)("fills only the current marker with ochre in %s mode", async (theme) => {
    document.documentElement.dataset.theme = theme;
    const indicator = await mount(steps);
    const markers = [...(indicator.shadowRoot?.querySelectorAll(".marker") ?? [])].map((marker) => getComputedStyle(marker));
    const [completed, current, upcoming] = markers;
    expect(markers.map(({ backgroundColor }) => backgroundColor)).toEqual([
      "rgba(0, 0, 0, 0)", "rgb(198, 138, 30)", "rgba(0, 0, 0, 0)",
    ]);
    expect(current?.color).toBe("rgb(21, 19, 15)");
    expect(current?.outlineStyle).toBe("solid");
    expect(completed?.outlineStyle).toBe("none");
    expect(upcoming?.outlineStyle).toBe("none");
  });

  it.each(["light", "dark"] as const)("keeps a check and an outlined current step in forced %s colours", async (palette) => {
    await commands.emulateForcedColors("active", palette);
    const indicator = await mount(steps);
    const check = indicator.shadowRoot?.querySelector(".check");
    const current = indicator.shadowRoot?.querySelector('[aria-current="step"] .marker');
    expect(presentation(indicator)).toEqual(progress);
    const stroke = check == null ? undefined : getComputedStyle(check).stroke;
    const marker = current == null ? undefined : getComputedStyle(current);
    expect(stroke).toMatch(/^rgb\(/);
    expect(stroke).not.toBe(marker?.backgroundColor);
    expect(marker?.outlineStyle).toBe("solid");
    expect(marker?.outlineColor).not.toBe(marker?.backgroundColor);
  });
});
