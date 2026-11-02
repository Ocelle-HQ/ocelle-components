# Contract: plants

Layout: `gates/plants/<gate-id>/<case>/plant.json` plus inputs. `plant.json`: `{"expect": "fail"|"pass", "why": "..."}`.

| Gate | Plant form | Fail plants (FR-025) | Pass plants |
|---|---|---|---|
| typecheck | `files`: a `.ts` file and a strict tsconfig | implicit `any` | - |
| lint | `files` | floating promise | - |
| unit-tests | `test-files` with a project name | failing test as each of `tokens`, `styles`, `elements` (Node), failing test needing Chromium | - |
| test-lint | `test-files` | one per FR-010 pattern (7) | a test with one real assertion |
| mutation | `mutation-fixture`: `base/` and `head/` source + tests | covered line not checked; changed line no test runs | a change fully checked |
| style-lint | `files` | raw literal in a `css` template in `.ts`; raw literal in `.css` | `var(--ocelle-x)`, `0`, `100%`, `Canvas`, `1fr`, `calc(var(--a) * 2)`, `line-height: 1.5` |
| prefix | `files` | `<sk-button>`, `--sk-color`, `sk-select` event, `monospace`, `Menlo` | `task-list`, `desk-row`, `--risk-level` |
| pins | `workspace`: package.json(s), lockfile, `.node-version` | lockfile out of date; a `^` range | - |
| csp | `built-output`: `dist/` files | one per FR-021 construct (9) | `<script src=...>` external module, `setTimeout(fn, 0)` |
| config-copies | `config-pair`: `a.yml`, `b.yml` | one setting differs | - |
| signoff | `commits`: `commits.txt` in the record format | no trailer; trailer not matching author | agent author signing off itself; unsigned merge commit |

The plant job fails when: a gate has no `fail` plant; a `fail` plant's gate exits other than 1; a `pass` plant's gate
exits other than 0; a plant has no or an invalid `plant.json`.
