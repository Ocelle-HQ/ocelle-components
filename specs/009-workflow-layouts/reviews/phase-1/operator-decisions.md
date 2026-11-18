# Operator decisions on the #10 recheck (T001, 2026-11-13, human:jeroennouwsdev)

On `reviews/phase-1/recheck-10.md`:

- **D1** (frames in the Storybook), "b: copy + red test": `storybook/.storybook/stories-layout.css` keeps a copy of the
  frame rules. A `storybook-integration` test checks the copy against `packages/elements/test/fixtures/frames.css`. The
  test is in phase 2's red commit (T020), before green, as the operator decided under I3. No gate change. T027, T041,
  T058, R-15, R-17 and contracts/elements.md § Stories say "copy".
- **D2** (Storybook no longer CSP-checked since 006 FR-020), "Story test asserts rule": the story tests (T020, T037,
  T053, red first) assert that no story's markup carries a `style` attribute or a class, and that no request leaves
  the origin. "Zero CSP violations" is dropped from them, since strict CSP is proved in the `elements-browser`
  fixtures. R-15 drops the reference to the `csp` gate's Storybook check.
