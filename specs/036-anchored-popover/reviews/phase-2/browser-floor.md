# Phase 2 exact browser floors

Candidate `3ff4e940ae544b0010d0b091602685c858b03823`

| Engine | Exact version | Playwright | Result |
| --- | --- | --- | --- |
| Chromium | 135.0.7049.114 | 1.64.1 | Pass |
| WebKit | 17.4 | 1.43.1 | Pass |

Both browser clients checked HTTP 200 and the complete `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'` response policy in their own network namespaces. The packaged fixture checks real mouse wheel and hits outside transformed clipping at both 320 CSS px edges, measured 200% text at a fixed viewport and native Tab through every enlarged action. Both reported zero CSP violations. [Browser-floor job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162402315/job/141032406450) · [Receipts](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46162402315/artifacts/15270645598)
