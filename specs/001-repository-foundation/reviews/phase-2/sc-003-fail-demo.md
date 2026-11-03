# SC-003, second clause: the red/green check rejects vacuous final tests (T031)

Run on 2026-11-02 in a disposable clone outside the repository. No commit of the throwaway phase entered the
repository. Environment: Node 26.13.0 and pnpm 12.16.1 from `/opt/node26/bin`.

## Commands

```bash
D=/tmp/claude-0/-home-user/487f8758-2b55-59a1-b0c5-2dfdf59aac74/scratchpad/sc003-clone
git clone <repo> "$D"     # at 5dca197, the phase 2 green commit
cd "$D"
export PATH=/opt/node26/bin:$PATH
export SPECIFY_FEATURE_DIRECTORY=specs/001-repository-foundation   # the clone has no .specify/feature.json
pnpm run setup:online
export OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell

.specify/extensions/story/scripts/base.sh 99
# red: packages/tokens/test/demo.test.ts expects Object.keys(await import("../src/index.ts")) toEqual ["demo"]
git add packages/tokens/test/demo.test.ts && git commit -s -m "test(demo): phase 99 red — throwaway"
.specify/extensions/story/scripts/red.sh 99 phase
# loosened rewrite: the same test now expects toEqual [] (true at the base)
git add packages/tokens/test/demo.test.ts && git commit -s -m "test(demo): phase 99 loosened rewrite — passes at the base"
.specify/extensions/story/scripts/tdd-check.sh 99
```

`pnpm run setup:online` exited 1 here. Its frozen install succeeded, so the clone's `node_modules` was filled from the
store. Its `pnpm exec playwright install chromium` was refused by the environment's network policy: the proxy
returned 403 for `cdn.playwright.dev`. This is the situation the operator decided on (research.md R-03, tasks.md
T013 note), so the run continued with the `OCELLE_CHROMIUM_PATH` override. `tdd-check.sh` ran its setup command
(`pnpm run setup:offline`) in each worktree, and it passed with the override:
`setup: installed offline; Chromium at /opt/pw-browsers/...`.

The clone wrote its own `.specify/feature.json` from the export: `{"feature_directory":"specs/001-repository-foundation"}`.

## Output

`base.sh 99`:

```json
{"phase":"99","base":"5dca197decd1ed866586fef896b481d66dbefa1f"}
```

`red.sh 99 phase`. The test failed on its assertion:
`packages/tokens/test/demo.test.ts:3: unit-tests: exports the demo token: AssertionError: expected [] to deeply equal [ 'demo' ]`.

```json
{"phase":"99","label":"phase","sha":"730813f1be9287e4b41515cf19789ab9880968a9","tests_only":true,"red":true,"recorded":true,"exit_code":1,"log":"/tmp/claude-0/-home-user/487f8758-2b55-59a1-b0c5-2dfdf59aac74/scratchpad/sc003-clone/specs/001-repository-foundation/reviews/phase-99/red-phase.log"}
```

`tdd-check.sh 99`:

```json
{"phase":"99","status":"fail","base":"5dca197decd1ed866586fef896b481d66dbefa1f","head":"b4776775de02bffc75bc8e06a8303e9ba744c77a","red_commits":[{"label":"phase","sha":"730813f1be9287e4b41515cf19789ab9880968a9","exit_code":1}],"final_tests_on_base_exit":0,"final_tests_on_scaffold_exit":null,"head_exit":0,"problems":["the final tests pass against the code from before the phase: they do not test the change"]}
```

## Result

The check reports `fail`. Its only problem is "the final tests pass against the code from before the phase", as
SC-003 requires. The red commit was recorded as red, and the tests pass at HEAD. So the failure comes from the
loosened final test alone.
