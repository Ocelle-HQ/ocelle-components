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
| 1 | #492 | `ocelle-personal-rail` + its flip-bound and orientation members; `spec` item `011-layout-headers` (#492 is met there, issue #8; not `008-overlays`) |
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

Rows 14 and 17 carry no `spec` item (`specs/003-base-styles` has no `verification.md`). A gates-integration test runs
the gap check with the final `gap-rows.json` against commit `183b20f` and requires exactly rows 6, 10 and 15 unmet
(research.md R-07).

## Secret allow-list entry (`gates/release/secret-allowlist.json`)

`{ path, rule, valueSha256, reason }`, all non-empty: the repository path of the hit, the rule name (research.md
R-08), the SHA-256 (64 lower-case hex) of the matched text and the reason. Keyed by content, not by commit, so an
entry survives a rebase, an amend and a squash merge. An entry that matches no hit is a finding (stale), as is an
entry with an empty reason. The file starts as `[]`; the gate's own tests and plants need no entry, because no
committed file holds a credential-shaped literal (R-08, FR-045).

## First-release base (`gates/release/first-release-base`)

One line: the full SHA of the parent of this mission's squash commit on `main`. Committed in US3 with the `main`
commit merged into this branch in Setup, so the dry run (which runs `release-step base`) has a base from its first
run; the pre-tag pull request rewrites it to the exact parent (research.md R-10, R-15). `release-step base` uses it only when no earlier `v*` tag is reachable from the tagged commit's
parent (research.md R-10).

## Readiness report (stdout of the `release-readiness` gate)

The gate checks the checkout's `HEAD` (no `--commit` option; research.md R-06). One line per finding in the gate
format (`<location>: release-readiness: <rule>: <message>`), rules:
`gap-row-unmet` (location `gates/release/gap-rows.json`, the row's upstream list and the missing evidence),
`gap-rows-mismatch` (the file differs from `sources/issue-1-gap-table.md`), `secret` (`<commit>:<path>`, the
secret-scan rule name: `npm-token`, `github-token`, `private-key`, `aws-key-id`, `slack-token`, `anthropic-key`,
`openai-key`, `google-api-key`, `npmrc-auth`, `env-assignment`; never the matched text), `allowlist-stale`,
`allowlist-no-reason`, `version-mismatch`, `tag-mismatch`, `changelog-missing-entry`, `changelog-undated`,
`changelog-unreleased-not-empty` (with `--tag`), `changelog-missing-element`, `changelog-missing-token` (the
uncovered token names, grouped by first name segment; research.md R-09). Then the summary:
`release-readiness: ready (17/17 rows, 0 secrets, version 1.0.0)` or `not ready (...)`.

## Release tag

`v<semver>` on a commit of `main`; its push is the only trigger of `release.yml`. Protected by a tag ruleset (O5) on
`refs/tags/v*`: creation, update, deletion and force pushes restricted; bypass list: the operator's account only (no
app, team, role or agent identity; an empty list would block the operator too). The GitHub identity agents use is
not the operator's account and is not on the bypass list; O5 records how the operator confirmed it, O8 re-confirms.
The operator moves a release tag (delete and re-push through the bypass) only while no package of its version is on
the registry, and records it in the release issue; once any package of the version is published, the tag is never
moved and the fix ships as lockstep `x.y.z+1` (research.md R-15, failure procedure).

## Protected environment

Name `npm-publish` (O4). Settings, each recorded in `RELEASING.md` with how the operator confirms it at O4 and
re-confirms it at O8:

| Setting | Value | Why |
|---|---|---|
| Required reviewers | the operator's account only | the human approval (FR-023); the agents' GitHub identity is never a reviewer |
| Deployment branches and tags | tags `v*` only (mandatory) | the npm trusted publisher trusts this environment |
| Allow administrators to bypass configured protection rules | off | otherwise an administrator deploys without the reviewer |
| Prevent self-review | off | the operator pushes the tag and is the only reviewer; with it on, no release can be approved |
| Environment secrets | none | D1: no token anywhere |

GitHub's exact setting labels are re-checked at implementation time.

## Provenance reference (`gates/release/provenance-reference.json`)

Two entries, recorded from the public registry at implementation time; used only by `install-check --rehearse`
(research R-11), which runs in the dry run and in `release.yml`'s `prepare` job:

- `withProvenance`: `{ name, version, repository, commit, workflow, ref }` of a real public package version with a
  valid signature and provenance attestation (the pass case; the planted repository, commit, workflow and ref
  failures alter one expected value each);
- `withoutProvenance`: `{ name, version }` of a real public package version that has a registry signature and no
  provenance attestation (must fail with `attestation-missing`).

## Install-check report (stdout of `gates/bin/install-check.ts`)

One line per finding `<package>[@<version>]: install-check: <rule>: <message>`, rules `not-visible`,
`install-failed`, `entry-point-unresolved`, `import-failed`, `element-undefined`, `csp-violation`,
`network-request`, `peer-unresolved`, `signature-invalid`, `attestation-missing`, `repository-mismatch`,
`commit-mismatch`, `workflow-mismatch`, `ref-mismatch`. `--rehearse` prints one line per case with its expected and
actual rule.

## Operator step

`O1` to `O8` as in spec.md, each with: what, where (registry or GitHub settings page), exact values (environment
name and the settings above, workflow file name, tag pattern and ruleset settings, check names: Pack contents,
Release readiness, Release workflow), when, and how the operator confirms it. O5 also lists the agent-side deny rules
the operator adds to the agent permission settings (research.md R-16); no agent writes them. Lives in
`RELEASING.md`, together with the pre-tag pull request (research.md R-15).
