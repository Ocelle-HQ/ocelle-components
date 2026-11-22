# Phase 5 T064: the select's `:focus-visible` ring after a programmatic focus

- **Date**: 2026-11-16
- **Story**: `elements-ocelle-form-select--focused` (`storybook/stories/form-select.stories.ts`), focused by script after
  render (research R-08): the wrapper `ocelle-story-focus-select` waits for `customElements.whenDefined("ocelle-form-select")`
  and the element's `updateComplete`, then calls `.focus()` on the host, which focuses the inner `<select part="control">`
  (`delegatesFocus`). No `autofocus`.
- **Where measured**: the pinned container's capture (`pnpm run visual:update`, docker, image
  `mcr.microsoft.com/playwright@sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0`), the committed
  baselines `storybook/baselines/elements-ocelle-form-select--focused.{light,dark}.png`, compared pixel by pixel with the
  Hover story's baselines (same select, same options and choice, not focused; the hover changes no pixel). The same
  comparison for the input (`--focused` against `--empty`) is given beside it.

| Capture | Pixels that differ from the unfocused story | Box of the difference | Ring colour (count) | Left edge, middle row (x = 11 to 18) |
|---------|------|------|------|------|
| select, light | 7841 | x 11-1268, y 35-88 | `#8f5e0f` (7742) | 3 px `#8f5e0f`, 2 px ground `#f1eee8`, boundary `#8a8276`, field `#fbfaf7` |
| select, dark | 7841 | x 11-1268, y 35-88 | `#e0a23a` (7740) | 3 px `#e0a23a`, 2 px ground `#15130f`, boundary `#7a7264`, field `#211e18` |
| input, light | 7841 | x 11-1268, y 35-88 | `#8f5e0f` (7742) | same as the select |
| input, dark | 7841 | x 11-1268, y 35-88 | `#e0a23a` (7740) | same as the select |

The remaining differing pixels (8 per capture) are the ring's anti-aliased corners.

**Result: the ring shows.** After the programmatic focus the select's control matches `:focus-visible` and draws the
token focus ring: `--ocelle-color-focus` (`--ocelle-color-accent-strong`, `#8F5E0F` light, `#E0A23A` dark), 3 px wide
(`--ocelle-focus-width`) at a 2 px offset (`--ocelle-focus-offset`), around the whole control, the same ring as the
input's focused story. Not a stop. The story test (`elements-stories.test.ts`) also asserts, in the host Chromium, that
the focused stories' inner control is the focused element and matches `:focus-visible`.
