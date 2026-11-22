# Implementation plan for ocelle-form-textarea

[Specification](spec.md) · [Approved triage](../../triage/026-form-textarea.md)

## Design

Add a form-associated ocelle-form-textarea backed by a native shadow textarea. Reuse FormControl for association, dirty/default/reset/restore behavior, label and error handling, and token styling. Widen the base class's native-control type for the textarea. Follow the select precedent for testing state updates before Lit's first render. Use the form input's public naming conventions and keep the [contract](contracts/element.md) to the controls required by #74.

## Technical context

TypeScript and Lit with zero new runtime dependencies. Playwright/Chromium exercises Vitest browser mode and the strict-CSP fixture. Vitest browser-mode tests exercise changed TypeScript under Stryker. Storybook uses the existing capture container, axe and forced-colour checks.

## Implementation and evidence

1. Add a registration scaffold to make the public entry and fixture loadable before the red commit. Keep the scaffold inert as a form control.
2. Write assertion-red tests for immediate submit, exact newlines, read-only, disabled and required semantics, dirty default and reset, input and commit events, accessible text and errors, and keyboard editing in a dialog. Compare native participation where appropriate.
3. Implement the subclass and the shared native-control typing. Add the export, manifest, documentation and changelog. Stop for review if the pilot requires a behavioral change to existing controls.
4. Use shared scenario bodies where the existing drivers support them. Exercise the built package under the fixture's real policy and record CSP violations. Use independent review and changed-source mutation testing.
5. Add three Storybook states and their light/dark baselines. Check a narrow viewport and forced colours for focus and readable state cues. Start full CI on the first reviewable green push. Record pickup, focused phase evidence and final required CI timings separately.

## Constitution check

Native form semantics and the existing accessibility and token conventions apply. The new public entry and event are MINOR. The named consumer is Workflow Studio run inspection. No dependency, CSS framework, runtime network or exception is planned. Keep all required checks, including changed-source mutation and Plants.
