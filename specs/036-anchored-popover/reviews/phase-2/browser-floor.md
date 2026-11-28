# Phase 2 exact browser floors

Candidate `f4fc2e8bbf2ab1c30b2513fbb0078bfe81440a5f`

| Engine | Exact version | Playwright | Result |
| --- | --- | --- | --- |
| chromium | 135.0.7049.114 | 1.64.1 | Pass |
| webkit | 17.4 | 1.43.1 | Pass |

The two clients checked HTTP 200 and `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'` in their own network namespaces. Both ran the actual packaged fixture, including trusted mouse wheel and hits outside transformed clipping at both 320 CSS px edges, measured 200% text at a fixed viewport, and native Tab through every enlarged action. Both reported zero CSP violations. The WebKit polling correction uses the same geometry predicate with Node-side timing.

[Browser-floor job and captured runtime pins](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46158714296/job/141020981121) · [Receipts](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46158714296/artifacts/15268627083)
