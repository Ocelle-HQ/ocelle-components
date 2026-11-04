# Phase 3 review round 1: fixes

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed: operator decision R1-01 (preview only, reviews/phase-3/operator-decisions.md), applied to the artifacts in f15885c. The build script passes `storybook build --preview-only`, so `storybook/dist/` holds no `index.html`, `sb-manager/` or `sb-addons/`. The integration setup now builds with the build script's own `storybook build` arguments, read from `package.json` (output directory replaced, `--disable-telemetry` dropped as before), so the run-time test checks what the build script ships. The header stays without `frame-src`. Every page the test opens is `iframe.html`: the violation control is now a `<style>` element added to a story in the preview, with zero violations asserted before it is added, in place of the synthetic `control.html`. The server records every HTML document it serves, and the last test asserts that each one was `iframe.html`, one per page (17). `gates/README.md` § The Storybook scope no longer lists `sb-addons/` and `sb-manager/` among the bundles, and states the preview-only build. T036 ticked. The two `csp` plants in `storybook/dist/index.html` (`fail-storybook-inline-script`, `pass-storybook-external-script`) stay where they are: `storybook/dist/*.html` is still the gate's scope, and contracts/gates.md § Plants names them with `index.html`. | 90fadb0 (`red-fix-1.log`): `csp.test.ts` "ships the preview only" (`expected [ 'index.html', 'sb-manager', …(1) ] to deeply equal []`), `telemetry.test.ts` build script without `--preview-only` | storybook/package.json; storybook/test/integration/csp.test.ts, setup.ts; storybook/test/unit/telemetry.test.ts; gates/README.md; tasks.md T036 |
| R1-02 | fixed: `storybook/stories/**/*.ts` joined `scopePathspecs` and the `source` regex (story files, tests and `.d.ts` stay out), so the mutation gate sees `render.ts`. The three survivors are killed by `storybook/test/unit/render.test.ts`, which pins the exact markup of `renderGroup` on fixture tokens: `&`, `<`, `>` and `"` in a value, in a name's `<dt>` and in a swatch's `data-token` (regex `[^&<>"]`); a non-colour token with a hex value and no swatch (`record.group === "colour"` to `true`); rows joined with nothing between them (`rows.join("")`). It also pins `hasSwatch` per fixture token (by reference, translucent in one theme, outside the colour group). The render tests pass on the phase's code, which was right; the scope tests failed in red. | 90fadb0 (`red-fix-1.log`): `mutation-ranges.test.ts` `scopePathspecs` and `inScope` with `storybook/stories/render.ts`, and the `mutation-shards.test.ts` runs on the widened fake scope | gates/lib/mutation/ranges.ts; gates/test/mutation-ranges.test.ts, mutation-fakes.ts; storybook/test/unit/render.test.ts; vitest.config.ts (comment); gates/README.md (`mutation` row) |
| R1-03 | deferred: note. Operator decision R1-03: a follow-up op after this run, phase 3 unchanged. | none | none |

contracts/gates.md § Mutation still names only `storybook/scripts/**` and `storybook/.storybook/**` for the widened
scope. Bringing it in line with `storybook/stories/**` is for the planner.

## Checks

Node 22 in this container, Chromium through `PLAYWRIGHT_BROWSERS_PATH`.

- `pnpm -r build`: exit 0. `storybook/dist/` holds `iframe.html` and no `index.html`, `sb-manager/` or `sb-addons/`.
- `pnpm test`: 1540 tests passed in 76 files, `storybook-integration` included.
- `gate:typecheck`, `gate:lint` (139 files), `gate:test-lint` (85 files), `gate:style-lint`, `gate:csp` (19 files),
  `gate:prefix` (71 files), `gate:config-copies`, `gate:pins`: all pass. `gate:plants`: 149 plants, every one as
  expected.
- `gate:mutation -- --base e05b8c2`: exit 0, "356 mutants on the changed lines of 9 files, none survived; 13
  equivalent records" (the 9th file is `storybook/stories/render.ts`; the records are the 13 of round 1).
