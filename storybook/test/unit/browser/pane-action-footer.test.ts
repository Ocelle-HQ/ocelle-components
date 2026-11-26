/// <reference types="vite/client" />
import { afterEach, describe, expect, it } from "vitest";
import type { StepIndicatorStep } from "../../../../packages/elements/src/ocelle-step-indicator.ts";

type RecipeModule = typeof import("../../../stories/pane-action-footer.ts");
type Variant = Parameters<RecipeModule["renderPaneActionFooter"]>[0];
type Button = HTMLElementTagNameMap["ocelle-button"];
type Indicator = HTMLElementTagNameMap["ocelle-step-indicator"];

const recipes = import.meta.glob<RecipeModule>("../../../stories/pane-action-footer.ts");
const labels = ["Review", "Choose", "Confirm"];

interface ExpectedPane {
  readonly heading: string;
  readonly description: string;
  readonly action: string;
  readonly status: string;
  readonly progress: readonly StepIndicatorStep["state"][];
}

const views = {
  overview: {
    heading: "Workflow review",
    description: "The request details have been reviewed. Continue to choose the approval route.",
    action: "Continue",
    status: "Draft workflow",
    progress: ["completed", "upcoming", "upcoming"],
  },
  review: {
    heading: "Review",
    description: "Check which requests will enter this workflow before choosing who approves them.",
    action: "Continue to Choose",
    status: "Draft workflow",
    progress: ["current", "upcoming", "upcoming"],
  },
  choose: {
    heading: "Choose",
    description: "Send new access requests to the service team for approval.",
    action: "Continue to Confirm",
    status: "Draft workflow",
    progress: ["completed", "current", "upcoming"],
  },
  confirm: {
    heading: "Confirm",
    description: "Publish this approval route for future requests.",
    action: "Finish",
    status: "Draft workflow",
    progress: ["completed", "completed", "current"],
  },
  published: {
    heading: "Workflow published",
    description: "New access requests will follow this workflow.",
    action: "Start again",
    status: "Published workflow",
    progress: ["completed", "completed", "completed"],
  },
  empty: {
    heading: "No steps configured",
    description: "Finish setting up the request workflow without any approval steps.",
    action: "Continue",
    status: "Draft workflow",
    progress: [],
  },
} as const satisfies Record<string, ExpectedPane>;

interface MountedPane {
  readonly article: HTMLElement;
  readonly indicator: Indicator;
  readonly actions: HTMLElement;
  readonly primary: Button;
}

let mounted: HTMLElement | undefined;
afterEach(() => {
  mounted?.remove();
  mounted = undefined;
});

function required<T extends Element>(element: T | null, description: string): T {
  if (element === null) throw new Error(`Missing pane fixture element: ${description}`);
  return element;
}

async function mount(variant: Variant): Promise<MountedPane> {
  expect(typeof document, "the host test runs in the Chromium project").toBe("object");
  const loadRecipe = recipes["../../../stories/pane-action-footer.ts"];
  expect(loadRecipe, "the shared pane footer host is implemented").toBeTypeOf("function");
  if (loadRecipe === undefined) throw new Error("The shared pane footer host is missing.");
  const [{ renderPaneActionFooter }] = await Promise.all([
    loadRecipe(),
    import("../../../../packages/elements/src/ocelle-button.ts"),
    import("../../../../packages/elements/src/ocelle-step-indicator.ts"),
  ]);

  const article = renderPaneActionFooter(variant);
  mounted = article;
  document.body.append(article);
  const actions = required(article.querySelector<HTMLElement>("[data-pane-actions]"), "action group");
  const primary = required(actions.querySelector<Button>('ocelle-button[variant="primary"]'), "primary action");
  const indicator = required(article.querySelector("ocelle-step-indicator"), "step indicator");
  await Promise.all([...actions.querySelectorAll("ocelle-button")].map((button) => button.updateComplete));
  return { article, indicator, actions, primary };
}

function buttonOrder({ actions }: MountedPane): (string | null)[][] {
  return [...actions.querySelectorAll("ocelle-button")].map((button) => [
    button.getAttribute("variant"),
    button.textContent,
  ]);
}

async function expectPane({ article, indicator, primary }: MountedPane, expected: ExpectedPane): Promise<void> {
  await indicator.updateComplete;
  const active = required(article.querySelector('[data-pane-footer="active"]'), "active footer");
  const adjacent = required(article.querySelector('[data-pane-footer="adjacent"]'), "adjacent footer");
  expect(active.previousElementSibling?.querySelector("h2")?.innerText).toBe(expected.heading);
  expect(active.previousElementSibling?.querySelector("p")?.innerText).toBe(expected.description);
  expect(adjacent.querySelector("p")?.innerText).toBe(expected.status);
  expect(primary.innerText).toBe(expected.action);

  const expectedSteps = expected.progress.map((state, index) => ({ label: labels[index], state }));
  expect(indicator.steps).toEqual(expectedSteps);
  const rows = [...(indicator.shadowRoot?.querySelectorAll("li") ?? [])];
  expect(rows.map((step) => ({
    label: step.querySelector(".label")?.textContent,
    current: step.getAttribute("aria-current"),
    completion: step.querySelector(".completion")?.textContent ?? null,
  }))).toEqual(expectedSteps.map(({ label, state }) => ({
    label,
    current: state === "current" ? "step" : null,
    completion: state === "completed" ? "Completed" : null,
  })));
}

describe("the shared pane action footer host", () => {
  it("labels the two panes, places the indicator before the primary, and advances a primary-only workflow in place", async () => {
    const fixture = await mount("primary-only");
    const { article, indicator, actions, primary } = fixture;
    expect([article.localName, article.id, article.dataset.story, article.getAttribute("aria-label")])
      .toEqual(["article", "pane-action-footer", "pane-action-footer", "Access request workflow"]);

    const sections = [...article.querySelectorAll("section")];
    expect(sections.map((section) => section.getAttribute("aria-labelledby"))).toEqual([
      "pane-action-footer-stage",
      "pane-action-footer-details",
    ]);
    expect(sections.map((section) => section.querySelector("h2")?.id)).toEqual([
      "pane-action-footer-stage",
      "pane-action-footer-details",
    ]);
    expect(article.querySelector("#pane-action-footer-details")?.textContent).toBe("Workflow details");
    expect([...article.querySelectorAll("dl > *")].map((entry) => [entry.localName, entry.textContent])).toEqual([
      ["dt", "Trigger"],
      ["dd", "New access request"],
      ["dt", "Owner"],
      ["dd", "Service team"],
    ]);
    expect([actions.getAttribute("role"), actions.getAttribute("aria-label")]).toEqual(["group", "Workflow actions"]);
    expect(indicator.nextElementSibling).toBe(actions);
    expect(actions.parentElement?.localName).toBe("footer");
    expect(buttonOrder(fixture)).toEqual([["primary", "Continue"]]);
    await expectPane(fixture, views.overview);

    const activations: (EventTarget | null)[] = [];
    article.addEventListener("ocelle-button-activate", (event) => activations.push(event.target));
    const native = primary.shadowRoot?.querySelector("button");
    expect(native?.type).toBe("button");
    native?.focus();
    expect(document.activeElement).toBe(primary);

    for (const pane of [views.choose, views.confirm, views.published, views.overview]) {
      primary.click();
      await expectPane(fixture, pane);
      expect(actions.lastElementChild).toBe(primary);
      expect(primary.shadowRoot?.querySelector("button")).toBe(native);
      expect(primary.shadowRoot?.activeElement).toBe(native);
    }
    expect(activations).toEqual([primary, primary, primary, primary]);
  });

  it("uses the secondary action to review options even after reaching Confirm", async () => {
    const fixture = await mount("secondary-and-primary");
    const secondary = required(fixture.actions.querySelector<Button>('ocelle-button[variant="secondary"]'), "secondary action");
    expect(buttonOrder(fixture)).toEqual([["secondary", "Review options"], ["primary", "Continue to Confirm"]]);
    await expectPane(fixture, views.choose);

    fixture.primary.click();
    await expectPane(fixture, views.confirm);
    secondary.click();
    await expectPane(fixture, views.review);
    fixture.primary.click();
    await expectPane(fixture, views.choose);
    expect(fixture.actions.firstElementChild).toBe(secondary);
  });

  it("uses Back to reach the previous pane, keeps Review at the beginning, and restarts from its variant", async () => {
    const fixture = await mount("back-and-primary");
    const back = required(fixture.actions.querySelector<Button>('ocelle-button[variant="quiet"]'), "Back action");
    expect(buttonOrder(fixture)).toEqual([["quiet", "Back"], ["primary", "Continue to Confirm"]]);
    await expectPane(fixture, views.choose);

    back.click();
    await expectPane(fixture, views.review);
    back.click();
    await expectPane(fixture, views.review);

    fixture.primary.click();
    await expectPane(fixture, views.choose);
    fixture.primary.click();
    await expectPane(fixture, views.confirm);
    back.click();
    await expectPane(fixture, views.choose);

    fixture.primary.click();
    await expectPane(fixture, views.confirm);
    fixture.primary.click();
    await expectPane(fixture, views.published);
    back.click();
    await expectPane(fixture, views.confirm);
    fixture.primary.click();
    await expectPane(fixture, views.published);
    fixture.primary.click();
    await expectPane(fixture, views.choose);
  });

  it("keeps the no-steps story empty through publication and restart", async () => {
    const fixture = await mount("empty");
    expect(buttonOrder(fixture)).toEqual([["primary", "Continue"]]);
    await expectPane(fixture, views.empty);
    expect(fixture.indicator.shadowRoot?.querySelector("ol")).toBeNull();

    fixture.primary.click();
    await expectPane(fixture, { ...views.published, progress: [] });
    expect(fixture.indicator.shadowRoot?.querySelector("ol")).toBeNull();
    fixture.primary.click();
    await expectPane(fixture, views.empty);
  });
});
