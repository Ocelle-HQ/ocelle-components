type Variant = "primary-only" | "secondary-and-primary" | "back-and-primary" | "empty";
type Screen = "overview" | "review" | "choose" | "confirm" | "published" | "empty";

const labels = ["Review", "Choose", "Confirm"];
const starts: Record<Variant, Screen> = {
  "primary-only": "overview",
  "secondary-and-primary": "choose",
  "back-and-primary": "choose",
  empty: "empty",
};

interface Pane {
  readonly heading: string;
  readonly description: string;
  readonly action: string;
  readonly next?: Screen;
  readonly previous?: Screen;
  readonly completed: number;
  readonly current?: number;
}

const panes: Record<Screen, Pane> = {
  overview: {
    heading: "Workflow review",
    description: "The request details have been reviewed. Continue to choose the approval route.",
    action: "Continue",
    next: "choose",
    completed: 1,
  },
  review: {
    heading: "Review",
    description: "Check which requests will enter this workflow before choosing who approves them.",
    action: "Continue to Choose",
    next: "choose",
    current: 0,
    completed: 0,
  },
  choose: {
    heading: "Choose",
    description: "Send new access requests to the service team for approval.",
    action: "Continue to Confirm",
    next: "confirm",
    previous: "review",
    current: 1,
    completed: 1,
  },
  confirm: {
    heading: "Confirm",
    description: "Publish this approval route for future requests.",
    action: "Finish",
    next: "published",
    previous: "choose",
    current: 2,
    completed: 2,
  },
  published: {
    heading: "Workflow published",
    description: "New access requests will follow this workflow.",
    action: "Start again",
    previous: "confirm",
    completed: 3,
  },
  empty: {
    heading: "No steps configured",
    description: "Finish setting up the request workflow without any approval steps.",
    action: "Continue",
    next: "published",
    completed: 0,
  },
};

function button(variant: "primary" | "secondary" | "quiet"): HTMLElementTagNameMap["ocelle-button"] {
  const control = document.createElement("ocelle-button");
  control.setAttribute("variant", variant);
  return control;
}

/** Mounts a fictional pane host. The host owns workflow state, labels and navigation. */
export function renderPaneActionFooter(variant: Variant): HTMLElement {
  const article = document.createElement("article");
  article.id = "pane-action-footer";
  article.dataset.story = "pane-action-footer";
  article.setAttribute("aria-label", "Access request workflow");
  article.innerHTML = `
    <section class="pane-action-footer__pane" aria-labelledby="pane-action-footer-stage">
      <div class="pane-action-footer__body">
        <h2 id="pane-action-footer-stage"></h2>
        <p></p>
      </div>
      <footer data-pane-footer="active">
        <ocelle-step-indicator></ocelle-step-indicator>
        <div data-pane-actions role="group" aria-label="Workflow actions"></div>
      </footer>
    </section>
    <section class="pane-action-footer__pane pane-action-footer__pane--adjacent" aria-labelledby="pane-action-footer-details">
      <div class="pane-action-footer__body">
        <h2 id="pane-action-footer-details">Workflow details</h2>
        <dl>
          <dt>Trigger</dt>
          <dd>New access request</dd>
          <dt>Owner</dt>
          <dd>Service team</dd>
        </dl>
      </div>
      <footer data-pane-footer="adjacent">
        <p>Draft workflow</p>
      </footer>
    </section>
  `;

  const heading = article.querySelector("#pane-action-footer-stage");
  const description = article.querySelector(".pane-action-footer__body > p");
  const indicator = article.querySelector("ocelle-step-indicator");
  const actions = article.querySelector("[data-pane-actions]");
  const status = article.querySelector('[data-pane-footer="adjacent"] > p');
  if (heading === null || description === null || indicator === null || actions === null || status === null) {
    // Stryker disable next-line StringLiteral: the fixed template supplies every selector, as verified by storybook/test/unit/browser/pane-action-footer.test.ts.
    throw new Error("The workflow pane is missing required markup.");
  }

  const primary = button("primary");
  let screen = starts[variant];
  const show = (next: Screen): void => {
    screen = next;
    const pane = panes[screen];
    heading.textContent = pane.heading;
    description.textContent = pane.description;
    status.textContent = screen === "published" ? "Published workflow" : "Draft workflow";
    primary.textContent = pane.action;
    indicator.steps = variant === "empty" ? [] : labels.map((label, index) => ({
      label,
      state: index === pane.current ? "current" : index < pane.completed ? "completed" : "upcoming",
    }));
  };

  if (variant === "secondary-and-primary" || variant === "back-and-primary") {
    const auxiliary = button(variant === "back-and-primary" ? "quiet" : "secondary");
    auxiliary.textContent = variant === "back-and-primary" ? "Back" : "Review options";
    auxiliary.addEventListener("ocelle-button-activate", () => {
      show(variant === "back-and-primary" ? panes[screen].previous ?? screen : "review");
    });
    actions.append(auxiliary);
  }
  primary.addEventListener("ocelle-button-activate", () => {
    show(panes[screen].next ?? starts[variant]);
  });
  actions.append(primary);
  show(screen);
  return article;
}
