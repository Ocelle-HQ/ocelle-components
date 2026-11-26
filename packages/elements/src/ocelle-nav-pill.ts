import { LitElement, css, html, nothing } from "lit";
import { linkHref } from "./control.ts";
import { define } from "./define.ts";
import { accessibleName } from "./naming.ts";

export interface NavPillItem {
  readonly label: string;
  readonly href: string;
  readonly current?: boolean;
}

/**
 * A named, wrapping group of native destination links.
 *
 * @tagname ocelle-nav-pill
 * @csspart list - The ordered list of destination links.
 * @csspart link - A destination's native link.
 */
export class OcelleNavPill extends LitElement {
  static override properties = { label: {}, items: { attribute: false } };

  static override styles = css`
    :host {
      display: block;
      min-inline-size: 0;
    }

    ol {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ocelle-space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      min-inline-size: 0;
      max-inline-size: 100%;
    }

    a {
      display: grid;
      align-content: center;
      box-sizing: border-box;
      min-block-size: var(--ocelle-target-min);
      padding-inline: var(--ocelle-space-3);
      padding-block: var(--ocelle-space-1);
      border-radius: var(--ocelle-radius-2);
      color: var(--ocelle-color-link);
      font-weight: var(--ocelle-font-weight-regular);
      overflow-wrap: anywhere;
      text-decoration: none;
    }

    a:hover {
      color: var(--ocelle-color-link-hover);
      background: var(--ocelle-color-hover-bg);
      text-decoration: underline;
    }

    [aria-current="page"] {
      color: var(--ocelle-color-ink);
      background: var(--ocelle-color-accent-low);
      font-weight: var(--ocelle-font-weight-strong);
      text-decoration: underline;
    }

    a:focus-visible {
      outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
      outline-offset: var(--ocelle-focus-offset-inset);
    }

    @media (forced-colors: active) {
      a,
      a:hover,
      [aria-current="page"] {
        color: LinkText;
      }

      a:focus-visible {
        outline-color: Highlight;
      }
    }
  `;

  /** Localized name for the navigation landmark. */
  declare label: string;
  /** Destinations in host-supplied order. The first valid current destination owns the current-page state. */
  declare items: readonly NavPillItem[];

  constructor() {
    super();
    this.label = "Navigation";
    this.items = [];
  }

  protected override render(): unknown {
    const destinations = this.items.flatMap((item) => {
      const href = linkHref(item.href, this.baseURI);
      return href === undefined ? [] : [{ ...item, href }];
    });
    if (destinations.length === 0) return nothing;
    const current = destinations.findIndex((item) => item.current === true);
    return html`<nav aria-label=${accessibleName(this.label, null) ?? "Navigation"}>
      <ol role="list" part="list">
        ${destinations.map(({ href, label }, index) => html`
          <li><a part="link" href=${href} aria-current=${index === current ? "page" : nothing}>${label}</a></li>
        `)}
      </ol>
    </nav>`;
  }
}

define("ocelle-nav-pill", OcelleNavPill);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-nav-pill": OcelleNavPill;
  }
}
