# Ocelle console v2 design tokens

Source: `prototype/css/tokens.css` (console-prototype-v2 mission, WP01 + WP06 additions). Light is the default whatever the system setting; dark applies only with `data-theme="dark"` on `<html>`. Reduced motion sets `--motion-fast` and `--motion-base` to 0ms.

Rules: no monospace anywhere (ids and digests use the sans with tabular figures, digests in groups of four); ochre text never on bone (use `--color-link` #84560D for links); `--color-rule` is decorative only; contrast ratios in the notes are WCAG 2.x against the surface named.

| Token | Light | Dark | Note |
|---|---|---|---|
| `--color-canvas` | `#F1EEE8` | `#15130F` | bone, the page ground |
| `--color-sheet` | `#FBFAF7` | `#211E18` | field white: facts sheet, cards, inputs |
| `--color-rail` | `#E9E5DD` | `#1C1A15` | top bar, icon rail, context sidebar (docsite nav) |
| `--color-inset` | `#E2DDD3` | `#302B23` | wells, code and digest backgrounds |
| `--color-inspector` | `#F1EEE8` | `#15130F` | right inspector sits on bone, ruled off |
| `--color-ink` | `#15130F` | `#EDE9E1` | rosette black: 16.0 on canvas, 17.8 on sheet, 14.8 on rail |
| `--color-ink-muted` | `#5E584F` | `#A39D92` | 6.1 on canvas, 6.7 on sheet, 5.6 on rail |
| `--color-ink-soft` | `#3F3A33` | `#CFC9BE` | secondary headings, 10:1 on canvas |
| `--color-rule` | `#D9D3C7` | `#3A342B` | decorative dividers only (not a control boundary) |
| `--color-rule-strong` | `#B9B1A2` | `#4D463A` |  |
| `--color-control-border` | `#8A8276` | `#7A7264` | inputs, buttons, chips: 3.6 on sheet (non-text 3:1) |
| `--color-chrome` | `#15130F` | `#0D0C0A` |  |
| `--color-chrome-ink` | `#EDE9E1` | `#EDE9E1` | 15.3 on chrome |
| `--color-chrome-muted` | `#A39D92` | `#A39D92` | 6.9 on chrome: inactive rail icons, clock |
| `--color-chrome-hover` | `#2A261F` | `#24211B` | hover and current item; ink on it 12.6, muted 5.6 |
| `--color-pane` | `#FFFFFF` | `#1C1A15` | the detail reading pane, edge to edge |
| `--color-panel` | `#F1EEE8` | `#15130F` | inbox and inspector panels (bone) |
| `--color-accent` | `#C68A1E` | `#C68A1E` | ochre fill: primary button, the rosette spot |
| `--color-on-accent` | `#15130F` | `#15130F` | black on ochre 6.2. Never ochre text on bone (2.6) |
| `--color-accent-low` | `#F1E1C0` | `#3A2B10` | selected rows and current nav background; ink on it 14.4 |
| `--color-accent-strong` | `#8F5E0F` | `#E0A23A` | deep ochre: current-item bar, focus ring; 4.8 on canvas, 4.4 on rail |
| `--color-focus` | `#8F5E0F` | `#E0A23A` | focus ring, 3px: 5.3 on sheet, 4.4 on rail |
| `--color-link` | `#84560D` | `#E0A23A` | docsite link ochre: 5.5 on canvas, 6.1 on sheet, 5.0 on rail |
| `--color-link-hover` | `#15130F` | `#F7F4EE` |  |
| `--color-current` | `#8F5E0F` | `#E0A23A` | rail and sidebar current item: 3px bar + accent-low fill + 600 weight |
| `--color-hover-bg` | `#E2DDD3` | `#2A261F` |  |
| `--color-disabled-ink` | `#6F685D` | `#8C8579` | 4.4 on rail, 4.2 on neutral bg |
| `--color-disabled-bg` | `#E6E1D8` | `#2A261F` |  |
| `--color-overlay` | `rgb(21 19 15 / 0.5)` | `rgb(0 0 0 / 0.65)` | ---------- colour: states (docsite semantic pairs, text on its own bg) ---------- |
| `--color-danger` | `#A8322C` | `#E97373` |  |
| `--color-danger-bg` | `#F6E2E0` | `#2E1616` | 5.3 |
| `--color-warning` | `#7A5205` | `#E0A23A` |  |
| `--color-warning-bg` | `#F4E6C8` | `#2E2410` | 5.6 |
| `--color-success` | `#2F6B3A` | `#8FCB8F` |  |
| `--color-success-bg` | `#E4EFE3` | `#15241A` | 5.4 |
| `--color-info` | `#2C5E86` | `#A9C7E8` |  |
| `--color-info-bg` | `#E6EDF3` | `#14202E` | 5.8 |
| `--color-neutral` | `#5E584F` | `#A39D92` |  |
| `--color-neutral-bg` | `#E6E1D8` | `#2A261F` |  |
| `--color-proto` | `#F1EEE8` | `#15130F` |  |
| `--color-proto-bg` | `#15130F` | `#E0A23A` | "Prototype" badge: bone on black, 16.0 |
| `--font-sans` | `"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif` | `(same)` |  |
| `--font-display` | `"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif` | `(same)` |  |
| `--figures` | `tabular-nums` | `(same)` |  |
| `--font-size-xs` | `0.75rem` | `(same)` | small print, inbox meta |
| `--font-size-sm` | `0.875rem` | `(same)` | rail tooltips, sidebar rows, inspector values |
| `--font-size-md` | `1rem` | `(same)` |  |
| `--font-size-fact` | `1.0625rem` | `(same)` | fact values: the site's body step |
| `--font-size-lg` | `1.25rem` | `(same)` |  |
| `--font-size-xl` | `1.5rem` | `(same)` |  |
| `--font-size-2xl` | `1.875rem` | `(same)` | decision title in the main pane |
| `--line-height-tight` | `1.15` | `(same)` |  |
| `--line-height-normal` | `1.45` | `(same)` |  |
| `--line-height-relaxed` | `1.55` | `(same)` |  |
| `--font-weight-regular` | `400` | `(same)` |  |
| `--font-weight-medium` | `500` | `(same)` |  |
| `--font-weight-strong` | `600` | `(same)` |  |
| `--font-weight-display` | `800` | `(same)` | wordmark and decision title, tracking -0.03em |
| `--tracking-display` | `-0.03em` | `(same)` | ---------- space: 4px base (kitty desktop) ---------- |
| `--space-1` | `0.25rem` | `(same)` |  |
| `--space-2` | `0.5rem` | `(same)` |  |
| `--space-3` | `0.75rem` | `(same)` |  |
| `--space-4` | `1rem` | `(same)` |  |
| `--space-5` | `1.25rem` | `(same)` |  |
| `--space-6` | `1.5rem` | `(same)` |  |
| `--space-7` | `2rem` | `(same)` |  |
| `--space-8` | `2.5rem` | `(same)` |  |
| `--space-9` | `3rem` | `(same)` |  |
| `--space-10` | `4rem` | `(same)` | ---------- shell (kitty desktop structure) ---------- |
| `--shell-topbar-height` | `3.25rem` | `(same)` | 52px: wordmark, "Prototype" badge |
| `--shell-rail-width` | `3.25rem` | `(same)` | 52px icon rail: Approvals, History, Admin |
| `--shell-sidebar-width` | `20rem` | `(same)` | 320px context sidebar: the inbox list, or admin sub-nav |
| `--shell-inspector-width` | `19rem` | `(same)` | 304px right inspector (E-30: the mockup's 16rem is too narrow for the facts) |
| `--shell-main-max` | `48rem` | `(same)` | facts sheet measure inside the main pane |
| `--shell-collapse-inspector` | `75rem` | `(same)` | below 1200px the inspector stacks under the main pane |
| `--shell-collapse-sidebar` | `45rem` | `(same)` | below 720px the sidebar becomes a list screen of its own |
| `--measure-sheet` | `var(--shell-main-max)` | `(same)` |  |
| `--measure-page` | `100%` | `(same)` |  |
| `--gutter` | `var(--space-4)` | `(same)` | ---------- shape: the brand's single radius ---------- |
| `--radius-1` | `2px` | `(same)` |  |
| `--radius-2` | `4px` | `(same)` | buttons, cards, chips: Ocelle's one radius (not kitty's 16px) |
| `--radius-3` | `4px` | `(same)` |  |
| `--radius-pill` | `999px` | `(same)` | state pills only |
| `--border-width` | `1px` | `(same)` |  |
| `--focus-width` | `3px` | `(same)` |  |
| `--focus-offset` | `2px` | `(same)` |  |
| `--bar-width` | `3px` | `(same)` | current-item bar on rail and sidebar |
| `--target-min` | `2.75rem` | `(same)` |  |
| `--icon-size` | `1.25rem` | `(same)` |  |
| `--size-visually-hidden` | `1px` | `(same)` | ---------- elevation: flat, ruled (brand), shadow only for the dialog ---------- |
| `--elevation-sheet` | `0 0 0 1px var(--color-rule)` | `0 0 0 1px var(--color-rule)` |  |
| `--elevation-raised` | `0 2px 4px rgb(21 19 15 / 0.10), 0 12px 32px rgb(21 19 15 / 0.16)` | `0 0 0 1px var(--color-rule-strong)` | ---------- motion ---------- |
| `--motion-fast` | `120ms` | `(same)` |  |
| `--motion-base` | `200ms` | `(same)` |  |
| `--easing-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | `(same)` | the site's ease-out |
| `--footer-h` | `4.5rem` | `(same)` | decision bar and inbox footer minimum block size |
| `--shell-height` | `100dvh` | `(same)` | the one 100dvh literal (PD-22) |
| `--radius-shell` | `10px` | `(same)` | the .work top-left corner |
| `--font-size-ui` | `0.8125rem` | `(same)` | mockup UI text |
| `--font-size-body` | `0.9375rem` | `(same)` | mockup body text |
| `--font-size-title` | `1.75rem` | `(same)` | mockup decision title |
| `--size-dot` | `0.45rem` | `(same)` | new dot, timeline dot |
| `--size-step` | `1.4rem` | `(same)` | step marker |
| `--size-avatar` | `1.6rem` | `(same)` | avatar circle |
| `--size-rail-item` | `2.5rem` | `(same)` | rail item box (40px, kept; PE-47) |
| `--measure-sentence` | `var(--shell-main-max)` | `(same)` | 48rem; departs from the mockup's 52rem (NFR-007) |
| `--dialog-max-inline` | `calc(100vw - 2 * var(--gutter))` | `(same)` |  |
| `--dialog-max-block` | `calc(100dvh - 2 * var(--gutter))` | `(same)` |  |
| `--bar-block-narrow` | `calc(2 * var(--target-min) + 3 * var(--space-2))` | `(same)` | narrow decision bar offset (PE-57) |
| `--elevation-row` | `0 0 0 1px var(--color-control-border), 0 2px 8px rgb(21 19 15 / 0.08)` | `0 0 0 1px var(--color-control-border)` | selected row, mockup line 70 |
| `--elevation-seg` | `0 0 0 1px var(--color-control-border), 0 1px 2px rgb(21 19 15 / 0.08)` | `0 0 0 1px var(--color-control-border)` | pressed filter segment, mockup line 63 |
| `--elevation-bar` | `0 -6px 16px rgb(21 19 15 / 0.05)` | `none` | decision bar, mockup line 104 |
| `--radius-row` | `6px` | `(same)` | inbox row, history row and card corner (mockup 6px; R-6, WP06) |
| `--ring-step` | `1.5px` | `(same)` | step marker ring width (mockup inset 1.5px; R-6, WP06) |

Font: Schibsted Grotesk, variable weight 400–900, vendored as `prototype/fonts/SchibstedGrotesk-wght.woff2` (OFL) from schibsted/schibsted-grotesk@d485f61f.
