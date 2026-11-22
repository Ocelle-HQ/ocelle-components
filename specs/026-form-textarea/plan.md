# Implementation plan for ocelle-form-textarea

[Specification](spec.md) · [Approved triage](../../triage/026-form-textarea.md)

## Design

Add a form-associated ocelle-form-textarea backed by a native shadow textarea. Reuse FormControl for association, dirty/default/reset/restore behavior, label and error handling, and token styling. Widen the base class's native-control type for the textarea. Keep synchronous name, constraint reflection and validity local to the textarea, using the approach in [research](research.md). The shared base retains its existing behavior for input and select. Use the form input's public naming conventions and keep the [contract](contracts/element.md) to the controls required by #74.

## Technical context

TypeScript and Lit with zero new runtime dependencies. Playwright/Chromium exercises Vitest browser mode and the strict-CSP fixture. Vitest browser-mode tests exercise changed TypeScript under Stryker. Storybook uses the existing capture container, axe and forced-colour checks.

## Implementation and evidence

1. Add a registration scaffold to make the public entry and fixture loadable before the red commit. Keep it inert as a form control. Assert the presence of the native shadow editing control before operations that need it, so a missing control on the scaffold fails a named observable contract assertion. Attach exact focused red evidence. A locator timeout, import or setup failure cannot prove red.
2. Write assertion-red tests for immediate submit, exact newlines, read-only, disabled and required semantics, dirty default and reset, input and commit events, accessible text and errors, and keyboard editing in a dialog. Compare against a native textarea for initially empty required submission, immediate correction and reset, read-only inclusion and disabled exclusion. Cover both markup initialization and a script-created field with name and value assigned by property.
3. Implement the subclass and the shared native-control typing. Add the export, manifest, documentation and changelog. Stop for review if the pilot requires a behavioral change to existing controls.
4. Run a same-task in-page submit recorder in Vitest browser mode and in the built browser fixture under its real strict CSP. Before any await it installs the submit listener, inserts the field, checks the inner textarea is absent, invokes requestSubmit, and captures submit count and FormData in that listener. Assert LF in FormData and native-equivalent CRLF separately at the URL-encoded wire boundary. Include a break check where form-value synchronization is deferred until first update. Record CSP violations and use independent review and changed-source mutation testing.
5. Add editable, invalid, read-only and disabled Storybook states and their pinned light and dark baselines. At narrow width and in forced colours, verify the read-only boundary style and preserved focus ring on the same control across editable, read-only, disabled and invalid states. Exercise a failed save with focus on Submit, record exactly one new polite error announcement and unchanged answer and focus, then clear the error and verify the editing control's accessible description. Start full CI on the first reviewable green push. Record pickup, focused phase evidence and final required CI timings separately.

## Constitution check

Native form semantics and the existing accessibility and token conventions apply. The new public entry and event are MINOR. The named consumer is Workflow Studio run inspection. No dependency, CSS framework, runtime network or exception is planned. Keep all required checks, including changed-source mutation and Plants.
