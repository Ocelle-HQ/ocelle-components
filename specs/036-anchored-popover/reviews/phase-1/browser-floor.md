# Phase 1 browser-floor evidence

Candidate `62e511da5edf70a065c72c6e2c70de130f40f34d` was exercised on Linux x64 against the same packaged fixture. The strict fixture and product inputs match the package build at `fadf86fdf7f9e87ab345f64c1327281857d859f3`. The later commit changed only the compatibility driver. Each runner preflighted its loopback fixture URL for HTTP 200 and the complete `default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'` header. Both checked the accessible native trigger, Enter and Space, forward and reverse Tab, Escape, outside dismissal, trusted profile activation, asset loading and zero CSP violations.

| Engine | Exact browser or revision | Client | Result |
| --- | --- | --- | --- |
| Chromium | Chrome for Testing headless shell `135.0.7049.114`, archive SHA-256 `edc2f6118c68f3c369f0dde3c2c31e400806308ab02ba3e2901e742212246e2e` | Playwright `1.64.1` | Pass, exit 0 |
| WebKit | `17.4`, revision `1992`, Jammy x64 archive SHA-256 `714ce8b1b8861fb846e77f3756e3ad9d3387cf4966231d63e3fb799d3229f9d1` | Playwright `1.43.1` | Pass, exit 0 on the workspace host |

The initial WebKit run reached the final profile trigger and Playwright reported the slotted initials as an interception. A trusted physical click at the named button's center then opened the profile panel. The corrected shared driver passed in both browsers.

The WebKit binary ran on the Debian workspace host with matching EGL, Mesa and software rendering libraries staged from verified layers of the pinned Playwright Jammy image. The dependency validator was skipped for this temporary library layout. The browser launch, version assertion, HTTP preflight and all interaction checks ran. The prescribed disposable Jammy container run remains pending because local Docker image storage could not accommodate the pinned image.
