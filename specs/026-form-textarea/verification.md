# Textarea landing verification

The approved triage and phase review cover one independently usable textarea for #74. The landing integration preserves both test-only red commits and their recorded assertion failures. [Triage](../../triage/026-form-textarea.md) · [Phase review](reviews/phase-1/round-1.md) · [Landing review](reviews/landing/round-1.md)

## Focused verification

- The original pilot replay proved pre-render submission, native LF and URL-encoded CRLF, validation, disabled and read-only participation, dialog editing, accessible labels and retained text after a host error. It passed the two recorded reds, base, scaffold, fix parent and green head. [Phase evidence](reviews/phase-1/notes.md)
- The integrated preview passed 1,155 focused tests, including the built strict-CSP browser tests and 39 gate integration tests. Typecheck, code lint, style lint, test lint, content security, configuration copies and sign-off passed.
- The manifest contains 41 elements and the Storybook build contains 326 stories with 652 light and dark baselines. All 644 existing baselines stayed byte-identical. The four textarea states add eight baselines. All eight new story and theme pairs passed axe with no serious, critical, incomplete or excepted findings. The targeted visual token plant passed with the updated exact findings.
- The fresh reviewer compared eight same-task transitions in the built textarea bundle with a native textarea under the repository’s strict CSP. The values, validity and form participation matched, including an explicit external form owner and the first-legend exception in a disabled fieldset. The review found zero blockers. [Landing review](reviews/landing/round-1.md)

## Required hosted checks

The pilot against Op 025 passed all 129 executed jobs, including 10,287 tests, mutation testing, all 317 plants, visual regression and accessibility. The merge candidate targeting `main` has its own required checks for the full test inventory, strict mutation, Plants, visual regression, accessibility, Storybook, the manifest, content security, typecheck, lint and sign-off. The `Unit tests` check includes both full Storybook integration files. [Pilot CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257) · [Current PR checks](https://github.com/Ocelle-HQ/ocelle-components/pull/79/checks)

## Main integration

The signed merge `2743b8c6` brings `main` at `ddecd131` into the textarea branch. The product and gate files match the independently reviewed preview exactly. Relative to that preview, the integration updates mission and Op 025 evidence records. The later changelog entry describes the shipped behavior and references #74. All original test-first commits remain reachable.
