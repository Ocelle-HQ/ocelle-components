# Workflow canvas verification

## Shipped renderer

The signed Phase 3 base `552da3b40b74bea4759ed0c69590e0a517b4df01` and Phase 4 product `7c38d775e7deba4a04e8280f7e7317c03907f4d7` were built separately with the pinned production Vite browser configuration. The standalone browser aggregate, `packages/elements/dist/browser/ocelle-elements.js`, loaded the actual canvas and native workflow-node elements. The two builds use the same lockfile. The changes in the aggregate's build inputs are in the workflow-canvas source.

| Revision | Minified aggregate | Gzip level 9 |
| --- | ---: | ---: |
| Phase 3 `552da3b4` | 303,831 B | 67,573 B |
| Phase 4 `7c38d775` | 307,136 B | 68,381 B |
| Phase 4 difference | +3,305 B | +808 B |

The renderer research supplied the same four-column layouts and forward-plus-branch edges for 12 nodes and 14 edges and for 96 nodes and 126 edges. This run mounted the shipped canvas in a 980 × 660 CSS-pixel host in a 1060 × 780 headless Chromium viewport with device pixel ratio 1. Each build and fixture used three fresh Chromium pages, with build order reversed for the middle trial. [Renderer research](research.md#r1--native-vector-rendering)

Each page selected step 1 by pointer and step 2 by ArrowRight and Enter, and accepted one native Pan right request. The timed viewport sequence applied 50 host-supplied viewport values and sampled from property assignment through Lit update completion and an SVG geometry read. The timed drag used a trusted pointer press, 50 moves and one release on step 2's SVG handle. It sampled from pointer capture-phase delivery through Lit update completion and a geometry read. The first ten samples of each sequence were warmup. Every sampled projection and the ordered selection, viewport and position requests were checked.

| Revision | Nodes / edges | Viewport update median | Viewport update p95 | Viewport frame interval p95 | Native drag update median | Native drag update p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `552da3b4` | 12 / 14 | 1.4–1.7 ms | 2.8–4.3 ms | 19–20.5 ms | 1.5–1.7 ms | 3.6–4.7 ms |
| `552da3b4` | 96 / 126 | 6.3–8.4 ms | 10.1–11.7 ms | 25.2–37.6 ms | 7–7.6 ms | 10.8–15.5 ms |
| `7c38d775` | 12 / 14 | 1.6 ms | 3.1–4.4 ms | 19.1–20.8 ms | 1.5–1.7 ms | 2.5–3.3 ms |
| `7c38d775` | 96 / 126 | 6.3–8.2 ms | 8.8–14.3 ms | 29.1–47.4 ms | 6.5–7.7 ms | 8.5–15.2 ms |

Every fixture drew all of its edges. At the initial viewport, the browser exposed 12 native node actions for Phase 3 and 8 for Phase 4. The Phase 4 host reserves part of the same outer size for outcome connections, so the measured work includes each build’s visible layout.

Values span the three per-page statistics. The fixture used Node v26.13.0, Vite 8.3.5, Playwright 1.64.1 and headless Chromium 156.0.8078.4 on shared linux x64 hardware (AMD EPYC 9V74 80-Core Processor). Local mutation testing shared the workspace's four-CPU quota during the interleaved trials. Frame intervals include browser and host scheduling. The drag interval also includes driver pacing. These observations describe the synthetic fixture on this host. Paint latency and other devices require separate measurements.

Every page used the strict-CSP fixture policy `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'`. Only the fixed same-origin fixture and bundle assets loaded, including the vendored font. Every run recorded zero additional requests during interaction, CSP violations, page or console errors and inline style nodes.

## Spec Kit worktree pilot

The Phase 1 records time worktree setup, worker activity and staging separately. The draft workers overlapped for 88.312 s. The production workers overlapped for 46.226 s. The two production worktrees and staging were prepared in 1.727 s as a batch. Production dispatch to the first combined helper green took 168.860 s, of which the focused Unit command used 2.822 s. The interval from the first draft dispatch to the combined checkpoint was 779.558 s and included the serial browser draft, red proof and handoffs. Both intervals come from the concurrent run. A serial comparison requires its own measurement. [Worktree receipts](reviews/phase-1/worktree-pilot.md#observed-timing)

The complete Phase 1 local replay took 312.298 s across ordered stages. Its unchanged repeat reused all 18 stages in 2.090 s. The exact hosted Phase 1 verification took 55m 06s. That elapsed time includes hosted work outside the focused worktree checkpoint. [Phase 1 replay and hosted receipts](reviews/phase-1/worktree-pilot.md#whole-phase-green)
