# Data Model: Release v1.0.0 (030)

## Pack manifest (`gates/release/pack-manifest.json`)

One entry per package, read by the pack-contents gate (contracts/pack-contents-gate.md).

| Field | Type | Rule |
|---|---|---|
| `name` | string | `@ocelle/tokens`, `@ocelle/styles` or `@ocelle/elements`; the three, each once |
| `dir` | string | the package directory (`packages/tokens`, ...) |
| `allow` | glob[] | every tarball entry (path below `package/`) must match one; non-empty |
| `require` | path[] | must be in the tarball: at least `package.json`, `LICENSE`, `NOTICE`, `README.md`, `CHANGELOG.md`; tokens adds `THIRD_PARTY_NOTICES`, `dist/fonts/OFL.txt` |
| `identical` | path[] | tarball file must be byte-identical to the repository root file of the same name (`LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES` where shipped) |
| `peer` | object | the packed `peerDependencies` exactly: `{ "@ocelle/tokens": "^<version>" }` for styles and elements; `{}` for tokens |

The deny list is code, not data (contracts/pack-contents-gate.md), so a plant cannot widen it.

## Package manifest fields (each `packages/*/package.json`)

| Field | Value |
|---|---|
| `private` | absent |
| `version` | `1.0.0` (lockstep, Q3 (a)) |
| `license` | `Apache-2.0` |
| `repository` | `{ "type": "git", "url": "git+https://github.com/Ocelle-HQ/ocelle-components.git", "directory": "packages/<name>" }` |
| `publishConfig` | `{ "access": "public", "registry": "https://registry.npmjs.org/" }` (no `provenance` key: the workflow passes `--provenance`, so a local `npm publish` by mistake cannot claim it) |
| `peerDependencies` | styles, elements: `{ "@ocelle/tokens": "workspace:^1.0.0" }` in source, `^1.0.0` packed (research R-03) |
| `files` | as now, plus `LICENSE`, `NOTICE` (tokens, styles) and `THIRD_PARTY_NOTICES` (tokens) |

## Gap row (`gates/release/gap-rows.json`)

| Field | Type | Rule |
|---|---|---|
| `upstream` | string[] | the upstream issue numbers of the row, as in #1 (`["#498", "#510", ...]`) |
| `need` | string | the row's "Need" text, verbatim |
| `metIn` | string | the row's "Met in" text, verbatim |
| `evidence` | Evidence[] | at least one item that is not of kind `spec` |

**Evidence** `{ kind, ... }`:

| kind | fields | met when |
|---|---|---|
| `element` | `tag` | the tag is declared in `packages/elements/custom-elements.json` |
| `member` | `tag`, `memberKind` (`attribute`, `field`, `slot`, `cssPart`, `event`, `cssProperty`), `name` | that member is declared on that tag |
| `token` | `name` | `packages/tokens/src/source.ts` defines it |
| `style-hook` | `file`, `selector` | the selector occurs in that stylesheet of `packages/styles/src/` |
| `spec` | `dir` | `specs/<dir>/verification.md` exists |

The file must list exactly the 17 rows of `sources/issue-1-gap-table.md`, in order, with `upstream`, `need` and
`metIn` verbatim (the gate compares them with the source file, so a row cannot be dropped or reworded to pass).

**Initial evidence** (element level; member, token and style-hook items are completed in the gap-rows task after
`main`, with mission 018, is merged; rows marked † are unmet on `main` at 183b20f, per the triage record):

| # | Upstream | Evidence (initial) |
|---|---|---|
| 1 | #492 | `ocelle-personal-rail` + its flip-bound and orientation members; spec 011 or the 008 feature dir |
| 2 | #493 #495 #504 #508 #525 #528 | `ocelle-action-row` + its density, `aria-current`, unavailable and arrow members; hover tokens |
| 3 | #494 #499 #500 #502 #512 #450 | `ocelle-top-bar`, `ocelle-app-shell`, `ocelle-nav-item`, `ocelle-skip-link`; app-shell drawer member |
| 4 | #496 #504 | `ocelle-icon`, `ocelle-brand-mark` |
| 5 | #497 | `ocelle-context-sidebar`, `ocelle-section-header` + divider, footer and eyebrow-only members |
| 6 † | #498 #510 #517 #520 #523 #533 #280 | `ocelle-progress`, `ocelle-evidence-chain`, `ocelle-code-block`, `ocelle-facts`, `ocelle-empty-state`, `ocelle-data-table`, panel tokens, and `ocelle-status-indicator` (mission 018) |
| 7 | #501 #518 #532 | `ocelle-button` (ARIA passthrough, busy, compact members), `ocelle-breadcrumbs` |
| 8 | #503 | `ocelle-dialog`, `ocelle-drawer`, `ocelle-tooltip` |
| 9 | #505 #506 #507 #514 #530 | `ocelle-list-detail`, `ocelle-workflow-lane`, `ocelle-workflow-board`, `ocelle-scroller`; lane min-width token |
| 10 † | #509 | `ocelle-metric` (mission 018), the eyebrow style hook, `ocelle-notice` compact member |
| 11 | #511 #521 #522 #527 #534 | `ocelle-segmented-choice`, `ocelle-tabs`, `ocelle-link`, `ocelle-listbox`, `ocelle-copy-field` |
| 12 | #513 | `ocelle-notice` (heading-less member) |
| 13 | #516 | `ocelle-card` density member |
| 14 | #519 | prose style hooks in `packages/styles/src/` |
| 15 † | #524 #526 | `ocelle-pill-tag` interactive and compact/outlined members (mission 018) |
| 16 | #529 | `ocelle-page-header` compact member |
| 17 | #531 #535 | type-scale and figures tokens; the identifier wrap style hook |

## Secret allow-list entry (`gates/release/secret-allowlist.json`)

`{ commit, path, rule, reason }`, all non-empty; `commit` a full SHA. An entry that matches no hit is a finding
(stale), as is an entry with an empty reason.

## Readiness report (stdout of the `release-readiness` gate)

One line per finding in the gate format (`<location>: release-readiness: <rule>: <message>`), rules:
`gap-row-unmet` (location `gates/release/gap-rows.json`, the row's upstream list and the missing evidence),
`gap-rows-mismatch` (the file differs from `sources/issue-1-gap-table.md`), `secret` (`<commit>:<path>`, rule name),
`allowlist-stale`, `allowlist-no-reason`, `version-mismatch`, `tag-mismatch`, `changelog-missing-entry`,
`changelog-undated`, `changelog-unreleased-not-empty` (with `--tag`), `changelog-missing-element`. Then the summary:
`release-readiness: ready (17/17 rows, 0 secrets, version 1.0.0)` or `not ready (...)`.

## Release tag

`v<semver>` on a commit of `main`; protected by a ruleset (O5). Its push is the only trigger of `release.yml`.

## Protected environment

Name `npm-publish`. Required reviewer: the operator. Deployment branches and tags: tags `v*` only (O4). Holds no
secret under D1.

## Provenance reference (`gates/release/provenance-reference.json`)

`{ name, version, repository, commit }` of one real public package that has a provenance attestation, recorded from
the registry at implementation time; used only by the dry-run rehearsal (research R-11).

## Operator step

`O1` to `O8` as in spec.md, each with: what, where (registry or GitHub settings page), exact values (environment
name, workflow file name, tag pattern, check names), when, and how the operator confirms it. Lives in `RELEASING.md`.
