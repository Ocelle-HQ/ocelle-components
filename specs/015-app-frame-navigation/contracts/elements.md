# Public element contracts — app frame and navigation

All names below are proposed for plan review. String properties use the corresponding kebab-case attribute. Boolean attributes use presence. Consumers load any primitive through its individual module or the existing package entry.

| Element | Inputs | Slots | Parts |
| --- | --- | --- | --- |
| `ocelle-app-shell` | `layout`, `productName`, `menuLabel`, `drawerLabel`, `closeLabel`, `narrowBelow`, `collapseBelow`, `flushBlockEnd`, `flushInlineEnd` | `skip-link`, `actions`, `rail`, `sidebar`, default main content | `main`, `navigation` where navigation is present |
| `ocelle-top-bar` | `productName`, `showMenu`, `menuLabel`, `menuExpanded` | `actions` | `bar`, `brand`, `actions`, `menu-button` |
| `ocelle-nav-item` | `href`, `label`, `current`, `compact` | `icon` | `link`, `label`, `bubble` |
| `ocelle-nav-pill` | `href`, `label`, `current` | — | `link` |
| `ocelle-breadcrumbs` | `label`, property-only `items` | — | `list`, `item`, `link`, `current` |
| `ocelle-skip-link` | property-only `target`, `targetSelector` | Default localized label | `control` |

- Shell tokens `--ocelle-app-shell-narrow-below` and `--ocelle-app-shell-collapse-below` default to 45rem and 68.75rem. The explicit settings take priority when valid. `remeasure()` rereads bounds after a style-only change that does not change the observed box. Tier is observable via read-only `tier`. A bubbling composed `ocelle-app-shell-tier-change` carries `{ tier, previousTier }` after a change and after navigation is presented in the new tier. Initial measurement reports no transition.
- The top-bar menu uses one native button, a localized name, and `aria-expanded`. It dispatches one bubbling composed `ocelle-top-bar-menu-request` with `{ expanded: boolean }` giving the requested next state. The standalone host reflects the state back through `menuExpanded`. The shell consumes its own nested top-bar request.
- Shell consumers supply the appropriate sidebar for the layout and an optional mission rail. The shell presents nav items compact within a collapsed project or mission sidebar while retaining their labels in the accessibility tree. Personal remains full in the collapsed tier. Document the supported composition for tier styling and any necessary host integration via the public `tier` interface.
- Both destination links accept `current="page"` or `current="true"`. Other values omit current state. Activation follows the native link, without a duplicate custom activation event. A missing destination renders its label without a focusable link. Icon content is decorative when the nav item already has a label.
- Breadcrumbs take a readonly ordered array of `{ label: string; href?: string }`. The final item is current text, even if a URL is supplied. Ancestors with URLs are links. An empty trail exposes no navigation landmark. Separators are decorative and the landmark has a localizable name.
- The skip control has a localized fallback label. The explicit reference wins over `target-selector`. The selector searches its current root and uses the first match. A failed focus attempt leaves the control focused. The shell supports targeting its main through a public `contentTarget` reference after render, keeping IDs local to their own roots.
