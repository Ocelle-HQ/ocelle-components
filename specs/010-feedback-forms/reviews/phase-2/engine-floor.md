# Phase 2 engine floor check (T024)

The README's floor (`packages/elements/README.md` § Engines): Chromium 120+ and WebKit 16.4+. The features phase 2
adds, each compared with that floor (plan decision 2; analysis I8):

| Feature | Where | Chromium | WebKit | Against the floor |
|---|---|---|---|---|
| `ElementInternals` through `attachInternals()` | `ocelle-notice`'s host (`src/ocelle-notice.ts`, constructor) | 77 | 16.4 | at or below |
| `ElementInternals.ariaLive` (ARIA reflection on the internals) | `setupInternals()`, `internals.ariaLive = "off"` | 83 | 16.4 | at or below |
| `MessageChannel` | `src/live.ts`, `afterTask()` (move and first-load detection, the alert path's end-of-task step) | 4 | 5 | below |
| `forced-color-adjust` | the announcer region's style (`.announcer`), keeping its transparent text transparent in forced colours | 89 | not supported; WebKit has no forced-colours mode, so the declaration has nothing to act on | at or below |

Sources: `MessageChannel` from caniuse-lite 1.0.30001819 (the copy in this repository's `node_modules`, feature
`channel-messaging`: Chrome 4, Safari 5); the others from MDN browser-compat-data (`api.ElementInternals`,
`api.ElementInternals.ariaLive`, `css.properties.forced-color-adjust`), not re-measured here. Only Chromium is measured
(README § Engines); the suites ran on Chromium 153 (build 1243).

No feature is newer than the floor, so the floor is unchanged and no operator stop is needed.
