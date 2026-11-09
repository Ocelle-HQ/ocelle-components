# Phase 1 (Setup): TDD exemption

Constitution VIII, "Exemption": a unit with no behaviour (scaffolding, configuration, documentation) may skip the
red step only if its review states why no test could fail for it.

## Why no test can fail for this phase

- The phase adds dependencies, one empty private workspace package (`storybook/`, a `package.json` with no scripts
  and no source file), two ignore entries and one `tsconfig.json` include pattern that matches no file yet. None of
  these is behaviour a test could observe: no code is added or changed, nothing is built, no script is run by any
  existing command.
- Every behaviour that uses this wiring belongs to a later phase and is written red first there: the token package
  and the `tokens-browser` project (phase 2), the Storybook build, its scripts, `.storybook/` configuration and the
  `storybook`/`storybook-integration` projects (phase 3, after the T030 spike).
- The checks that do cover this phase's files are gates that already exist and passed on the result (below): `pins`
  (exact pins, `workspace:0.0.0`, release age, build scripts), `typecheck` (the new include) and the full test suite.

## What the phase adds (T002 to T007)

- T002 `pnpm-workspace.yaml`: `storybook` added to `packages`; `minimumReleaseAge: 10080` and
  `minimumReleaseAgeStrict: true` unchanged. **Deviation, for review:** `allowBuilds` is no longer `{}` but
  `{ esbuild: false }`. Storybook 10.6.5 depends on `esbuild@0.28.2`, which has a `postinstall` script; with an
  empty `allowBuilds`, pnpm 12.16.1 stops every install with `ERR_PNPM_IGNORED_BUILDS` (so `pnpm install`,
  `setup:online`, `setup:offline` and CI would all fail). `esbuild: false` is an explicit denial: the script still
  does not run (checked: `esbuild/bin/esbuild` is the 9350-byte JS launcher, not the native binary the postinstall
  would put there), esbuild uses the `@esbuild/linux-x64` optional dependency, and the pins gate accepts it
  (`gates/lib/pins-rules.ts` rejects only entries set to `true`). The policy "no dependency may run an install
  script" (001 research R-04) is unchanged; a comment in the file says so.
- T003 `storybook/package.json`: `@ocelle/storybook`, `private: true`, `0.0.0`, `type: module`, dev dependencies
  `storybook` `10.6.5`, `@storybook/html-vite` `10.6.5`, `@ocelle/tokens` `workspace:0.0.0`; no scripts.
  Version: on the day of install (2026-11-03, 23:58 UTC) the newest release at least seven days old is 10.6.5
  (published 2026-10-27 15:59 UTC for `storybook`, 15:54 UTC for `@storybook/html-vite`); 10.6.4 was the newest at
  plan time (R-10, "the implementer pins the version actually installed"). The only newer versions are the
  pre-releases `11.0.0-alpha.9` and `11.0.0-beta.0`, both under seven days old.
- T004 `.gitignore`: `storybook/dist/`, `storybook/.generated/`.
- T005 `tsconfig.json`: `storybook/.storybook/**/*.ts` added explicitly to `include` (`**/*.ts` skips
  dot-directories).
- T006 `pnpm-lock.yaml`: updated by a non-frozen `pnpm install` (new `storybook` importer; vite's peer key now
  includes esbuild).
- T007 `specs/002-design-tokens/sources/console-v2-tokens.md`: `sha256sum` gives
  `7b0a5d0c4af7d1c7fa83f2a4af130e76097f6e6283e980da704c424395d9e61a`, equal to R-05. File unchanged.

## Checks run

- `pnpm install --no-frozen-lockfile`: exit 0 (after the `allowBuilds` change above).
- `pnpm run setup:online`: the frozen `pnpm install` part succeeded on a clean `node_modules`; `playwright install
  chromium` failed in this sandbox (download host `cdn.playwright.dev` blocked by the network proxy, 403), an
  environment limit not caused by the phase. The sandbox has Chromium build 1243 preinstalled at
  `/opt/pw-browsers`; Playwright 1.64.1 expects build 1248.
- `pnpm run gate:pins`: exit 0 (`pins: 5 manifests checked, no finding`).
- `pnpm test`: exit 0 (`unit-tests: 1249 tests passed in 55 files`), run with `PLAYWRIGHT_BROWSERS_PATH` pointing to
  a scratch directory that aliases builds 1248 to the preinstalled 1243 (outside the repository). Without it the
  runner stops with "Chromium not found at /opt/pw-browsers/chromium-1248".
- `pnpm run gate:typecheck`, `gate:lint`, `gate:config-copies`: exit 0.
