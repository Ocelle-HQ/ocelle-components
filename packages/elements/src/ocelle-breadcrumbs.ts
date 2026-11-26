import { LitElement, css, html, nothing } from "lit";
import { linkHref } from "./control.ts";
import { define } from "./define.ts";
import { accessibleName } from "./naming.ts";

export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

/**
 * A named breadcrumb trail with a text current page.
 *
 * @tagname ocelle-breadcrumbs
 * @csspart list - The ordered breadcrumb list.
 * @csspart item - A breadcrumb list item.
 * @csspart link - An ancestor's native link.
 * @csspart current - The current page's text.
 */
export class OcelleBreadcrumbs extends LitElement {
  static override properties = { label: {}, items: { attribute: false } };

  static override styles = css`
    :host {
      display: block;
      min-inline-size: 0;
    }

    ol {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ocelle-space-1) var(--ocelle-space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: baseline;
      gap: var(--ocelle-space-2);
      min-inline-size: 0;
      max-inline-size: 100%;
      overflow-wrap: anywhere;
    }

    a {
      min-inline-size: 0;
      color: var(--ocelle-color-link);
    }

    a:hover {
      color: var(--ocelle-color-link-hover);
    }

    a:focus-visible {
      outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
      outline-offset: var(--ocelle-focus-offset-inset);
    }

    [part="current"] {
      color: var(--ocelle-color-ink);
      font-weight: var(--ocelle-font-weight-strong);
    }

    @media (forced-colors: active) {
      a,
      a:hover {
        color: LinkText;
      }

      a:focus-visible {
        outline-color: Highlight;
      }
    }
  `;

  /** Localized name for the breadcrumb landmark. */
  declare label: string;
  /** Ancestors in order followed by the current page. */
  declare items: readonly BreadcrumbItem[];

  constructor() {
    super();
    this.label = "Breadcrumb";
    this.items = [];
  }

  protected override render(): unknown {
    if (this.items.length === 0) return nothing;
    return html`<nav aria-label=${accessibleName(this.label, null) ?? "Breadcrumb"}>
      <ol role="list" part="list">
        ${this.items.map((item, index) => html`
          <li part="item">
            ${index === 0 ? nothing : html`<span aria-hidden="true">/</span>`}
            ${this.#crumb(item, index === this.items.length - 1)}
          </li>
        `)}
      </ol>
    </nav>`;
  }

  #crumb(item: BreadcrumbItem, current: boolean): unknown {
    if (current) return html`<span part="current" aria-current="page">${item.label}</span>`;
    const href = linkHref(item.href, this.baseURI);
    return href === undefined
      ? html`<span data-ancestor>${item.label}</span>`
      : html`<a part="link" href=${href}>${item.label}</a>`;
  }
}

define("ocelle-breadcrumbs", OcelleBreadcrumbs);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-breadcrumbs": OcelleBreadcrumbs;
  }
}
