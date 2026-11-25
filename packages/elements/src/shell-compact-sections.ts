import { css } from "lit";

const marker = "data-ocelle-shell-compact-section";

// A shadow stylesheet cannot reach the descendants of a slotted section. Scope an adopted sheet in
// that section's root to shell-marked sections, leaving their authored hidden state and styles intact.
const compactSections = css`
  :where([data-ocelle-shell-compact-section]):is(ul, ol),
  :where([data-ocelle-shell-compact-section]) :is(ul, ol) {
    margin-block: 0;
    padding-inline: 0;
    list-style: none;
  }

  :where([data-ocelle-shell-compact-section]):is(h1, h2, h3, h4, h5, h6, [role="heading"], ocelle-section-header),
  :where([data-ocelle-shell-compact-section]) :is(h1, h2, h3, h4, h5, h6, [role="heading"], ocelle-section-header) {
    display: none !important;
  }
`;

type StyleRoot = Document | ShadowRoot;
const users = new WeakMap<StyleRoot, number>();
const owners = new WeakMap<Element, symbol>();

export class CompactSections {
  readonly #owner = Symbol();
  #sections = new Set<Element>();
  #root: StyleRoot | undefined;

  update(host: HTMLElement, sections: readonly Element[]): void {
    const next = new Set(sections);
    for (const section of this.#sections) {
      if (next.has(section) || owners.get(section) !== this.#owner) continue;
      section.removeAttribute(marker);
    }
    for (const section of next) {
      owners.set(section, this.#owner);
      section.toggleAttribute(marker, true);
    }
    this.#sections = next;

    const root = host.getRootNode();
    const nextRoot = next.size > 0 && (root instanceof Document || root instanceof ShadowRoot) ? root : undefined;
    if (this.#root === nextRoot) return;
    if (this.#root !== undefined) this.#release(this.#root);
    this.#root = nextRoot;
    if (nextRoot !== undefined) this.#adopt(nextRoot);
  }

  #adopt(root: StyleRoot): void {
    const count = users.get(root) ?? 0;
    const sheet = compactSections.styleSheet;
    if (count === 0 && sheet !== undefined) root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    users.set(root, count + 1);
  }

  #release(root: StyleRoot): void {
    const remaining = (users.get(root) ?? 1) - 1;
    if (remaining > 0) {
      users.set(root, remaining);
      return;
    }
    const sheet = compactSections.styleSheet;
    root.adoptedStyleSheets = root.adoptedStyleSheets.filter((each) => each !== sheet);
    users.delete(root);
  }
}
