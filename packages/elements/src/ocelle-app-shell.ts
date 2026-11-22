import { LitElement, css, html, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { define } from "./define.ts";
import { deepActive, walk } from "./focusable.ts";
import { accessibleName } from "./naming.ts";
import { OcelleContextSidebar, setContextSidebarCompact } from "./ocelle-context-sidebar.ts";
import { OcelleDrawer } from "./ocelle-drawer.ts";
import { OcelleNavItem, setNavItemPresentation } from "./ocelle-nav-item.ts";
import { setOverlayInitialFocus } from "./overlay.ts";
import { CompactSections } from "./shell-compact-sections.ts";
import { below, parseLength, resolveLength } from "./tiers.ts";
import "./ocelle-top-bar.ts";

export type AppShellTier = "expanded" | "collapsed" | "narrow";

type Layout = "mission" | "project" | "personal";
type DrawerState = "closed" | "open" | "closing";
type Region = "rail" | "sidebar";
type PresentationElement = OcelleNavItem | OcelleContextSidebar;

const narrowToken = "--ocelle-app-shell-narrow-below";
const collapseToken = "--ocelle-app-shell-collapse-below";
const landmark = "nav:not([role]), [role=navigation], ocelle-context-sidebar:not([role]), ocelle-personal-rail:not([role])";
const contentWrappers = "nav, [role=navigation], ocelle-context-sidebar, ocelle-personal-rail, div, span, p, ul, ol, li, section, article, aside";
// Tokens let the most recent owner be identified without retaining the shell.
const presentationOwners = new WeakMap<PresentationElement, symbol>();

function assignedRegion(host: HTMLElement, name: Region | "actions"): Element[] {
  return [...host.children].filter((child) => child.getAttribute("slot") === name);
}

function navItems(elements: readonly Element[]): OcelleNavItem[] {
  return elements.flatMap((element) => element instanceof OcelleNavItem ? [element] : [...element.querySelectorAll("ocelle-nav-item")]);
}

function hasContent(node: Node): boolean {
  if (node instanceof Text) return node.data.trim() !== "";
  if (!(node instanceof Element) || node.matches("[hidden], template, script")) return false;
  if (!node.matches(contentWrappers)) return true;
  return [...node.childNodes].some(hasContent);
}

/** A composed parent follows assignment first, then an ordinary parent or the host of an open shadow root. */
function composedParent(node: Element): Element | null {
  const root = node.getRootNode();
  return node.assignedSlot ?? node.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
}

function composedWithin(target: Element, root: Element): boolean {
  for (let node: Element | null = target; node !== null; node = composedParent(node)) {
    if (node === root) return true;
  }
  return false;
}

function visible(target: Element): boolean {
  return target.getClientRects().length > 0 && getComputedStyle(target).visibility === "visible";
}

/** Resolves a candidate using the shared length grammar, without accepting a numeric overflow. */
function length(value: string | undefined, rootFont: number, hostFont: number): number | undefined {
  const parsed = parseLength(value);
  if (parsed === undefined) return undefined;
  const pixels = resolveLength(parsed, rootFont, hostFont);
  return Number.isFinite(pixels) ? pixels : undefined;
}

/**
 * App frame with top bar, mission rail, context or personal sidebar, and one stable content destination.
 *
 * @tagname ocelle-app-shell
 * @slot skip-link - Optional keyboard shortcut to the main content.
 * @slot actions - The top bar's host-owned actions.
 * @slot rail - Mission destinations.
 * @slot sidebar - Context, project or personal destinations.
 * @slot - Main content.
 * @csspart main - The main content destination and its padding.
 * @csspart navigation - A visible rail or sidebar wrapper.
 * @fires {CustomEvent<{ tier: AppShellTier; previousTier: AppShellTier }>} ocelle-app-shell-tier-change -
 * Dispatched after the navigation changes tier. Bubbles and is composed.
 */
export class OcelleAppShell extends LitElement {
  static override properties = {
    layout: {},
    productName: { attribute: "product-name" },
    menuLabel: { attribute: "menu-label" },
    drawerLabel: { attribute: "drawer-label" },
    closeLabel: { attribute: "close-label" },
    railLabel: { attribute: "rail-label" },
    sidebarLabel: { attribute: "sidebar-label" },
    narrowBelow: { attribute: "narrow-below" },
    collapseBelow: { attribute: "collapse-below" },
    flushBlockEnd: { type: Boolean, attribute: "flush-block-end" },
    flushInlineEnd: { type: Boolean, attribute: "flush-inline-end" },
  };

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      contain: inline-size;
      min-inline-size: 0;
    }

    :host([hidden]),
    [part="navigation"][hidden] {
      display: none;
    }

    .frame {
      display: grid;
      grid-template-columns: auto auto minmax(0, 1fr);
      grid-template-areas: "rail sidebar main";
    }

    .rail {
      grid-area: rail;
      inline-size: var(--ocelle-shell-rail-width);
    }

    .sidebar {
      grid-area: sidebar;
      inline-size: var(--ocelle-shell-sidebar-width);
    }

    .frame[data-compact-sidebar] .sidebar {
      inline-size: var(--ocelle-shell-rail-width);
    }

    .drawer-navigation [part="navigation"] {
      inline-size: auto;
      min-inline-size: 0;
      overflow-wrap: anywhere;
    }

    [part="main"] {
      grid-area: main;
      box-sizing: border-box;
      min-inline-size: 0;
      padding: var(--ocelle-gutter);
      overflow-wrap: anywhere;
    }

    [part="main"]:focus-visible {
      outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
      outline-offset: var(--ocelle-focus-offset-inset);
    }

    @media (forced-colors: active) {
      [part="main"]:focus-visible {
        outline-color: Highlight;
      }
    }

    [part="main"].flush-block-end {
      padding-block-end: 0;
    }

    [part="main"].flush-inline-end {
      padding-inline-end: 0;
    }

    @media not (forced-colors: active) {
      .rail {
        color-scheme: dark;
        background: var(--ocelle-color-chrome);
        color: var(--ocelle-color-chrome-ink);
        --ocelle-color-link: var(--ocelle-color-chrome-ink);
        --ocelle-color-link-hover: var(--ocelle-color-chrome-ink);
      }

      .sidebar {
        background: var(--ocelle-color-rail);
      }
    }
  `;

  /** Mission, project or personal. Mission is the default for missing or unsupported values. */
  declare layout: string | undefined;
  /** Product name passed to the top bar. */
  declare productName: string;
  /** Accessible name of the top bar menu. */
  declare menuLabel: string;
  /** Localized name of the navigation drawer. */
  declare drawerLabel: string;
  /** Localized name of the drawer close control. */
  declare closeLabel: string;
  /** Localized landmark name for bare rail destinations. */
  declare railLabel: string;
  /** Localized landmark name for bare sidebar destinations. */
  declare sidebarLabel: string;
  /** Explicit lower bound in px, rem or em, or zero. Falls back to the `--ocelle-app-shell-narrow-below` token. */
  declare narrowBelow: string | undefined;
  /** Explicit upper bound in px, rem or em, or zero. Falls back to the `--ocelle-app-shell-collapse-below` token. */
  declare collapseBelow: string | undefined;
  /** Omits block-end content padding. */
  declare flushBlockEnd: boolean;
  /** Omits inline-end content padding. */
  declare flushInlineEnd: boolean;

  #tier: AppShellTier = "expanded";
  #layout: Layout = "mission";
  // Lit runs willUpdate before the first read of slot presence in render.
  #rail!: boolean;
  #sidebar!: boolean;
  #actions!: boolean;
  #settlement: symbol | undefined;
  #focusSource: Element | undefined;
  #announcedTier: AppShellTier | undefined;
  #drawerState: DrawerState = "closed";
  #drawerFocus: Element | undefined;
  #restoreDrawerFocus = false;
  readonly #presentationOwner = Symbol();
  #managedPresentation = new Set<PresentationElement>();
  readonly #compactSections = new CompactSections();

  readonly #resize = new ResizeObserver(() => {
    this.remeasure();
  });

  readonly #children = new MutationObserver(() => {
    this.requestUpdate();
  });

  constructor() {
    super();
    this.productName = "";
    this.menuLabel = "Open navigation";
    this.drawerLabel = "Navigation";
    this.closeLabel = "Close navigation";
    this.railLabel = "Account";
    this.sidebarLabel = "Workspace";
    this.flushBlockEnd = false;
    this.flushInlineEnd = false;
  }

  /** Current measured layout tier. */
  get tier(): AppShellTier {
    return this.#tier;
  }

  /** The stable programmatically focusable main content, available after rendering. */
  get contentTarget(): HTMLElement | null {
    return this.shadowRoot?.querySelector<HTMLElement>("main") ?? null;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#resize.observe(this, { box: "border-box" });
    this.#children.observe(this, {
      attributes: true,
      attributeFilter: ["slot", "hidden", "role"],
      childList: true,
      characterData: true,
      subtree: true,
    });
    this.requestUpdate();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#resize.disconnect();
    this.#children.disconnect();
    this.#settlement = undefined;
    this.#focusSource = undefined;
    this.#drawerFocus = undefined;
    this.#drawerState = "closed";
    this.#restoreDrawerFocus = false;
    this.#setPresentation([], []);
  }

  /** Rereads CSS thresholds and the current logical inline size. */
  remeasure(): void {
    if (this.isConnected) this.requestUpdate();
  }

  protected override willUpdate(): void {
    const source = deepActive();
    if (!this.#drawerProjected && source !== null
      && (source === this.#menu() || this.#regions().some((region) => composedWithin(source, region)))) {
      this.#focusSource = source;
    }
    const rail = assignedRegion(this, "rail");
    const sidebar = assignedRegion(this, "sidebar");

    this.#tier = this.#measureTier();
    this.#layout = this.layout === "project" || this.layout === "personal" ? this.layout : "mission";
    this.#rail = this.#layout === "mission" && rail.some(hasContent);
    this.#sidebar = sidebar.some(hasContent);
    this.#actions = assignedRegion(this, "actions").some(hasContent);
    if (this.#drawerOpen && (this.#tier !== "narrow" || !this.#hasNavigation)) this.#drawerState = "closing";

    const managed = this.#layout === "personal" ? [] : sidebar;
    this.#setPresentation(this.#rail ? rail : [], managed);
  }

  get #sidebarCompact(): boolean {
    return !this.#drawerProjected && this.#layout !== "personal" && this.#tier === "collapsed";
  }

  get #drawerOpen(): boolean {
    return this.#drawerState === "open";
  }

  get #drawerProjected(): boolean {
    return this.#drawerState !== "closed";
  }

  get #hasNavigation(): boolean {
    return this.#rail || this.#sidebar;
  }

  protected override render(): unknown {
    return html`
      <slot name="skip-link"></slot>
      <ocelle-top-bar .productName=${this.productName} .menuLabel=${this.menuLabel}
        .showMenu=${this.#tier === "narrow" && this.#hasNavigation} .menuExpanded=${this.#drawerOpen}
        @ocelle-top-bar-menu-request=${this.#openDrawer}>
        ${this.#actions ? html`<slot name="actions" slot="actions"></slot>` : nothing}
      </ocelle-top-bar>
      <div class="frame" ?data-compact-sidebar=${this.#sidebarCompact}>
        ${this.#drawerProjected ? nothing : this.#navigation(false)}
        <main part="main" tabindex="-1"
          class=${classMap({ "flush-block-end": this.flushBlockEnd, "flush-inline-end": this.flushInlineEnd })}>
          <slot></slot>
        </main>
      </div>
      <ocelle-drawer .open=${this.#drawerOpen}
        .label=${accessibleName(this.drawerLabel, null) ?? "Navigation"}
        .closeLabel=${accessibleName(this.closeLabel, null) ?? "Close navigation"}
        @focusin=${this.#recordDrawerFocus}
        @ocelle-drawer-close-request=${this.#syncDrawerClose}
        @ocelle-drawer-close=${this.#drawerClosed}>
        ${this.#drawerProjected ? html`<div class="drawer-navigation">${this.#navigation(true)}</div>` : nothing}
      </ocelle-drawer>
    `;
  }

  #navigation(inDrawer: boolean): unknown {
    return html`
      ${this.#region("rail", this.#rail, this.railLabel, inDrawer)}
      ${this.#region("sidebar", this.#sidebar, this.sidebarLabel, inDrawer)}
    `;
  }

  protected override firstUpdated(): void {
    const drawer = this.renderRoot.querySelector("ocelle-drawer");
    if (drawer !== null) setOverlayInitialFocus(drawer, () => this.#destinations()[0]);
  }

  readonly #openDrawer = (event: CustomEvent<{ expanded: boolean }>): void => {
    if (event.composedPath()[0] !== event.currentTarget) return;
    event.stopPropagation();
    if (!event.detail.expanded || this.#drawerProjected || this.#tier !== "narrow" || !this.#hasNavigation) return;
    this.#drawerFocus = undefined;
    this.#drawerState = "open";
    this.requestUpdate();
  };

  readonly #recordDrawerFocus = (event: FocusEvent): void => {
    const target = event.composedPath()[0];
    if (this.#drawerOpen && target instanceof Element) this.#drawerFocus = target;
  };

  readonly #syncDrawerClose = (event: Event): void => {
    const drawer = event.currentTarget;
    if (!(drawer instanceof OcelleDrawer)) return;
    queueMicrotask(() => {
      if (!this.#drawerOpen || drawer.open) return;
      this.#drawerState = "closing";
      this.requestUpdate();
    });
  };

  readonly #drawerClosed = (event: Event): void => {
    const drawer = event.currentTarget;
    if (!(drawer instanceof OcelleDrawer) || event.composedPath()[0] !== drawer || !this.#drawerProjected) return;
    const active = deepActive();
    this.#restoreDrawerFocus = active === null || composedWithin(active, drawer);
    this.#drawerState = "closed";
    this.requestUpdate();
  };

  #drawerPanel(): HTMLDialogElement | null | undefined {
    return this.renderRoot.querySelector("ocelle-drawer")?.shadowRoot?.querySelector("dialog");
  }

  #drawerCloseButton(): HTMLButtonElement | null | undefined {
    return this.#drawerPanel()?.querySelector<HTMLButtonElement>('[part="close-button"]');
  }

  protected override updated(): void {
    void this.#settle();
  }

  #regions(): HTMLElement[] {
    return [...this.renderRoot.querySelectorAll<HTMLElement>('[part="navigation"]')];
  }

  #menu(): HTMLButtonElement | null | undefined {
    return this.renderRoot.querySelector("ocelle-top-bar")?.shadowRoot?.querySelector("button");
  }

  #region(name: Region, populated: boolean, label: string, inDrawer: boolean): unknown {
    const supplied = assignedRegion(this, name).some((element) => hasContent(element) && (
      element.matches(landmark) || [...element.querySelectorAll(landmark)].some((node) =>
        hasContent(node) && node.closest("[hidden]") === null)
    ));
    const bare = populated && !supplied;
    return html`
      <div part="navigation" class=${name}
        ?hidden=${!populated || (!inDrawer && this.#tier === "narrow")}
        role=${bare ? "navigation" : nothing}
        aria-label=${bare ? accessibleName(label, null) ?? (name === "rail" ? "Account" : "Workspace") : nothing}>
        <slot name=${name}></slot>
      </div>
    `;
  }

  #measureTier(): AppShellTier {
    if (this.getClientRects().length === 0) return this.#tier;
    const style = getComputedStyle(this);
    const inline = Number.parseFloat(style.inlineSize);
    if (!Number.isFinite(inline)) return this.#tier;
    const edges = [style.paddingInlineStart, style.paddingInlineEnd, style.borderInlineStartWidth, style.borderInlineEndWidth];
    const measured = style.boxSizing === "border-box" ? inline : inline + edges.reduce((sum, edge) => sum + Number.parseFloat(edge), 0);
    const rootFont = Number.parseFloat(getComputedStyle(this.ownerDocument.documentElement).fontSize);
    const hostFont = Number.parseFloat(style.fontSize);
    const defaultNarrow = 45 * rootFont;
    const defaultCollapse = 68.75 * rootFont;
    let narrow = length(this.narrowBelow, rootFont, hostFont) ?? length(style.getPropertyValue(narrowToken), rootFont, hostFont) ?? defaultNarrow;
    let collapse = length(this.collapseBelow, rootFont, hostFont) ?? length(style.getPropertyValue(collapseToken), rootFont, hostFont) ?? defaultCollapse;
    if (narrow > collapse) [narrow, collapse] = [defaultNarrow, defaultCollapse];
    if (below(measured, narrow)) return "narrow";
    return below(measured, collapse) ? "collapsed" : "expanded";
  }

  #setPresentation(rail: readonly Element[], assigned: readonly Element[]): void {
    const compact = this.#sidebarCompact;
    const sidebars = assigned.filter((element) => element instanceof OcelleContextSidebar);
    const sections = assigned.flatMap((element) => element instanceof OcelleContextSidebar
      ? [...element.children].filter((child) => !child.getAttribute("slot"))
      : [element]);
    const railItems = new Set(navItems(rail));
    const sidebarItems = new Set(navItems(sections));
    const items = new Set([...railItems, ...sidebarItems]);
    const presentation = new Set([...items, ...sidebars]);
    for (const element of this.#managedPresentation) {
      if (presentation.has(element) || presentationOwners.get(element) !== this.#presentationOwner) continue;
      if (element instanceof OcelleContextSidebar) {
        setContextSidebarCompact(element, false);
      } else {
        setNavItemPresentation(element, undefined, false);
      }
    }
    this.#managedPresentation = presentation;

    for (const item of items) {
      presentationOwners.set(item, this.#presentationOwner);
      setNavItemPresentation(item, sidebarItems.has(item) ? compact : undefined, railItems.has(item));
    }
    for (const sidebar of sidebars) {
      presentationOwners.set(sidebar, this.#presentationOwner);
      setContextSidebarCompact(sidebar, compact);
    }

    this.#compactSections.update(this, compact ? sections : []);
  }

  async #settle(): Promise<void> {
    if (!this.isConnected) return;
    const settlement = Symbol();
    this.#settlement = settlement;
    const tier = this.#tier;
    await Promise.all([
      this.renderRoot.querySelector("ocelle-top-bar")?.updateComplete,
      ...[...this.#managedPresentation].map((element) => element.updateComplete),
    ]);
    if (settlement !== this.#settlement) return;
    const active = deepActive();
    if (this.#drawerProjected) {
      if (!this.#drawerOpen) return;
      if (this.#drawerFocus !== undefined && !visible(this.#drawerFocus)
        && (active === null || active === this.#drawerPanel() || !visible(active))) {
        (this.#destinations()[0] ?? this.#drawerCloseButton())?.focus();
      }
    } else {
      const source = this.#focusSource;
      const fromDrawer = this.#drawerFocus;
      const restore = this.#restoreDrawerFocus;
      this.#focusSource = undefined;
      this.#drawerFocus = undefined;
      this.#restoreDrawerFocus = false;
      if (restore && (active === null || !visible(active))) {
        const destinations = this.#destinations();
        const original = destinations.find((element) => element === fromDrawer);
        const target = tier === "narrow" ? this.#menu() : original ?? destinations[0];
        (target ?? this.contentTarget)?.focus();
      } else if (source !== undefined && !visible(source) && (active === null || !visible(active))) {
        const destination = tier === "narrow" ? this.#menu() : this.#destinations()[0];
        (destination ?? this.contentTarget)?.focus();
      }
    }
    const previousTier = this.#announcedTier;
    this.#announcedTier = tier;
    if (previousTier !== undefined && tier !== previousTier) {
      this.dispatchEvent(new CustomEvent("ocelle-app-shell-tier-change", {
        detail: { tier, previousTier },
        bubbles: true,
        composed: true,
      }));
    }
  }

  #destinations(): HTMLElement[] {
    return this.#regions().flatMap((region) => walk(region).order).filter(({ element, kind }) => {
      if (kind === "opaque" && (element.tabIndex < 0 || !visible(element))) return false;
      for (let node: Element | null = element; node !== null && node !== this; node = composedParent(node)) {
        if (node.matches("ocelle-context-sidebar > [slot=head], ocelle-context-sidebar > [slot=footer]")) return false;
      }
      return true;
    }).map(({ element }) => element);
  }
}

define("ocelle-app-shell", OcelleAppShell);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-app-shell": OcelleAppShell;
  }
}
