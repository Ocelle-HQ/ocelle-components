# Contributing

Thank you for your interest in ocelle-components. This file explains how a change gets in.

## Licence and sign-off

The project is licensed under the Apache License 2.0 (`LICENSE`). Contributions are accepted under the same licence.

There is no contributor licence agreement. Instead, every commit is signed off under the
[Developer Certificate of Origin](https://developercertificate.org/): by signing off, you certify that you wrote
the change, or otherwise have the right to submit it under the project's licence.

Sign off each commit with `git commit -s`. Git then adds a trailer with your name and email:

```text
Signed-off-by: Your Name <you@example.com>
```

The name and email of the `Signed-off-by` line must match the commit's author. The sign-off check fails a pull
request with any commit that has no matching line (merge commits and the unsigned root commit `d08d413` are exempt).
A commit authored by an agent is signed off by that same agent identity. To sign off commits you already made, run
`git rebase --signoff <base>`.

## How work is done: the Spec Kit flow

All work follows the project constitution, `.specify/memory/constitution.md`. Read it first: its principles
(framework-free `ocelle-` elements, tokens only, accessibility, strict CSP, test-first) are not negotiable.

Work goes through [Spec Kit](https://github.com/github/spec-kit):

1. **Triage.** Each change starts from a triage record in `triage/`, approved by the operator. It decides whether the
   issue is a mission (the full flow below), an op (one bounded change, in `ops/`), a fold into work in progress, or
   nothing. No code change starts without an approved triage record.
2. **Specify, plan, tasks.** A mission gets a feature directory `specs/NNN-name/` with `spec.md`, `plan.md` and
   `tasks.md` (`/speckit-specify`, `/speckit-plan`, `/speckit-tasks`), checked by the spec check, the plan review
   squad and `/speckit-analyze`.
3. **One user story at a time, test first.** `tasks.md` is implemented one phase at a time. The tests are written and
   committed first, in a commit that changes only test files, and must fail for the missing behaviour; then the code
   makes them pass without loosening them. An automatic red/green check proves it, and an independent review
   follows, with fix rounds until it approves.

`tooling/speckit/README.md` describes the commands, scripts and agent profiles of this flow.

## Before you open a pull request

```bash
pnpm run setup:online   # once: install dependencies and the Chromium build the browser tests use
pnpm test               # every test
```

Every merge gate runs as `pnpm run gate:<id>`; `gates/README.md` lists them and what each checks. A pull request
merges only when every gate passes. Changes reach `main` through pull requests, which the operator merges.

## Reporting a vulnerability

Do not open an issue. See `SECURITY.md`.
