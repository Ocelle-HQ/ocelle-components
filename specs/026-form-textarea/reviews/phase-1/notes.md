# Phase 1 verification

Active pickup was 2026-11-22T16:56:07Z. The inert scaffold records the public entry, its registry wiring, and its matching generated manifest.

- The test-only red commit recorded 19 failing assertions in seven focused files in 21.727 seconds. The built browser and in-process projects both ran before-render submission checks. No setup or missing import qualified as red.
- The same seven files passed on the implementation, 1,064 tests in 14.90 seconds. They include the strict-CSP fixture, real URL-encoded form submission, native LF data and narrow-dialog keyboard editing.
- Four stories in two themes were captured twice with the pinned Docker visual runner. All eight pairs matched byte for byte. The committed baselines cover editable, invalid, read-only and disabled.

The review replay and CI checks will run on the committed implementation. The required Visual regression check also compares Docker and Podman.
