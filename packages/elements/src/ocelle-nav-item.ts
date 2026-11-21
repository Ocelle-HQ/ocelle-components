import { LitElement, css, html, nothing } from "lit";
import { linkHref } from "./control.ts";
import { define } from "./define.ts";
import "./ocelle-tooltip.ts";

const compactPresentation = new WeakMap<OcelleNavItem, boolean | undefined>();
const chromeItems = new WeakSet<OcelleNavItem>();

/** @internal The shell's temporary presentation, separate from the owner's standalone setting. */
export function setNavItemCompact(item: OcelleNavItem, compact: boolean | undefined): void {
  compactPresentation.set(item, compact);
  item.requestUpdate();
}

/** @internal Sets the shell rail's chrome colors without exposing a host input. */
export function setNavItemChrome(item: OcelleNavItem, chrome: boolean): void {
  if (chrome === chromeItems.has(item)) return;
  if (chrome) chromeItems.add(item);
  else chromeItems.delete(item);
  item.requestUpdate();
}

/**
 * A vertical destination link. Compact mode keeps the accessible label and provides a visual label bubble.
 *
 * @tagname ocelle-nav-item
 * @slot icon - A decorative destination icon.
 * @csspart link - The native link, when a destination is supplied.
 * @csspart label - The visible label, hidden while the link is compact.
 * @csspart bubble - The compact label bubble.
 */
export class OcelleNavItem extends LitElement {
  static override properties = {
    href: {},
    label: {},
    current: {},
    compact: { type: Boolean },
  };

  static override styles = css`
    :host {
      display: block;
      min-inline-size: 0;
    }

    :host([hidden]),
    [part="label"][hidden] {
      display: none;
    }

    .destination {
      display: flex;
      align-items: center;
      gap: var(--ocelle-space-2);
      box-sizing: border-box;
      min-block-size: var(--ocelle-size-rail-item);
      padding-block: var(--ocelle-space-1);
      padding-inline: var(--ocelle-space-2);
      border-inline-start: var(--ocelle-focus-width) solid transparent;
      border-radius: var(--ocelle-radius-2);
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-sm);
      line-height: var(--ocelle-line-height-normal);
      overflow-wrap: anywhere;
    }

    .compact {
      justify-content: center;
      inline-size: var(--ocelle-size-rail-item);
      max-inline-size: 100%;
      padding-inline: var(--ocelle-space-1);
    }

    .icon {
      display: inline-flex;
      flex: none;
    }

    slot[name="icon"]::slotted(*) {
      inline-size: var(--ocelle-icon-size);
      block-size: var(--ocelle-icon-size);
      color: inherit;
    }

    [part="link"] {
      text-decoration: none;
    }

    [part="link"]:focus-visible {
      outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
      outline-offset: var(--ocelle-focus-offset-inset);
    }

    @media not (forced-colors: active) {
      [part="link"] {
        color: var(--ocelle-color-link);
      }

      [part="link"]:hover {
        background: var(--ocelle-color-hover-bg);
      }

      [part="link"][aria-current] {
        border-inline-start-color: var(--ocelle-color-current);
        background: var(--ocelle-color-accent-low);
      }
    }

    @media not (forced-colors: active) {
      [part="link"].on-chrome {
        color: var(--ocelle-color-chrome-ink);
      }

      [part="link"].on-chrome:hover,
      [part="link"].on-chrome[aria-current] {
        background: var(--ocelle-color-chrome-hover);
      }
    }

    @media (forced-colors: active) {
      [part="link"][aria-current] {
        border-inline-start-color: Highlight;
        font-weight: var(--ocelle-font-weight-strong);
      }

      [part="link"]:focus-visible {
        outline-color: Highlight;
      }
    }
  `;

  /** The native destination. An absent or unusable destination renders text. */
  declare href: string | undefined;

  /** The visible and accessible destination name. */
  declare label: string;

  /** `page` or `true` marks the link current. Other values omit the state. */
  declare current: string | undefined;

  /** Standalone preference for icon-only presentation. */
  declare compact: boolean;

  constructor() {
    super();
    this.label = "";
    this.compact = false;
  }

  protected override render(): unknown {
    const href = linkHref(this.href, this.baseURI);
    const compact = href !== undefined && (compactPresentation.get(this) ?? this.compact);
    const current = this.current === "page" || this.current === "true" ? this.current : nothing;
    const contents = html`
      <span class="icon" aria-hidden="true"><slot name="icon"></slot></span>
      <span part="label" ?hidden=${compact}>${this.label}</span>
    `;
    if (href === undefined) return html`<span class="destination">${contents}</span>`;
    return html`
      <ocelle-tooltip placement="bottom" exportparts="bubble" .text=${this.label} .disabled=${!compact}>
        <a class=${["destination", compact ? "compact" : "", chromeItems.has(this) ? "on-chrome" : ""].join(" ")} part="link" href=${href}
          aria-label=${this.label || nothing} aria-current=${current}>${contents}</a>
      </ocelle-tooltip>
    `;
  }
}

define("ocelle-nav-item", OcelleNavItem);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-nav-item": OcelleNavItem;
  }
}
