# Phase 2 spike (T014): a programmatically focused story in 006's pinned capture

**Question** (plan decision 27, research.md R-13): 006 has no focus parameter, so a focus story's wrapper focuses the
element itself. Does the inner control of a `delegatesFocus` host match `:focus-visible` in 006's pinned capture
(a) with a plain `host.focus()` and (b) with `host.focus({ focusVisible: true })`?

**Method** (2026-11-14, scratch files only, none committed): a scratch story file `storybook/stories/zz-spike.stories.ts`
with two scratch custom elements and no Lit (the Storybook workspace has no `lit` dependency of its own):

- `spike-host`: an open shadow root attached with `delegatesFocus: true`, one adopted stylesheet (`:host { display:
  inline-grid }`; an inner `button` with `font: inherit`, a 1 px `--ocelle-color-control-border` border; and
  `button:focus-visible` with the token ring longhands `outline-style: solid`, `outline-width:
  var(--ocelle-focus-width)`, `outline-color: var(--ocelle-color-focus)`, `outline-offset:
  var(--ocelle-focus-offset)`). It renders its inner `<button type="button"><slot></slot></button>` one microtask after
  construction, as Lit's first update does, and exposes that as `updateComplete`.
- `spike-focus`: a wrapper whose `connectedCallback` waits for `spike-host` to be defined and for its child's
  `updateComplete`, then calls `focus()` (mode `plain`), `focus({ focusVisible: true })` (mode `visible`) or nothing
  (mode `none`) on the child host.

Three stories (`spike-focus--none`, `--plain`, `--visible`), each `<p><spike-focus mode="…"><spike-host>Save</spike-host>
</spike-focus></p>`, were captured by `OCELLE_VISUAL_ENGINE=docker pnpm run visual:update` in 006's pinned container
(`mcr.microsoft.com/playwright@sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0`,
`chromium_headless_shell-1248`, 1280 × 800, reduced motion), which wrote exactly the six new captures ("wrote 6 files
(6 added, 0 changed, 0 removed)") and changed no repository baseline. The captures were then moved out of the
repository and the story file deleted. Each capture's pixels of exactly the focus colour were counted
(`--ocelle-color-focus`: light `#8F5E0F`, dark `#E0A23A`):

| Story | Light, ring pixels | Dark, ring pixels |
|---|---|---|
| `none` (no focus call) | 0 | 0 |
| `plain` (`host.focus()`) | 750 | 750 |
| `visible` (`host.focus({ focusVisible: true })`) | 750 | 750 |

The light `plain` capture, cropped, shows the 3 px ring 2 px outside the button's border on all four sides.

**Outcome**: both (a) and (b) show the token ring in the pinned capture, in both themes; with no focus call there is
none, so the count is the ring's. Per decision 27 the focus stories use **(a), plain `focus()`** (T021's button focus
story here, T054's and T063's row focus stories later). No stop-and-ask: the plan holds.
