# One-time redaction of phase 1 (T018, FR-008)

- commit: e77f5bf (`chore(op-023): redact sandbox paths in committed evidence`), parent ff8efe7
- command: `git grep -lIzE '<rule>' -- . <the four ':(exclude,literal)' pathspecs of the gate> | xargs -0 tooling/speckit/bin/redact-sandbox-paths.sh --in-place`
- files changed: 407 (368 under `specs/`, 38 under `ops/`, 1 `knowledge/speckit-flows/log.md`)
- lines changed: 411 (411 removed, 411 added; every file keeps its line count)
- substitutions (`git diff --word-diff=porcelain`, split at the prefixes and placeholders): 315 pnpm store prefixes
  to `<pnpm store>`, 108 checkout roots to `<repo>`, 7 other root-home prefixes to `<home>/`; no other word changed
- `.json` files changed: 59, every one parses afterwards
- gate before: exit 1, 411 findings in 407 tracked files (`sandbox-paths-before.txt`); op.md counted 415 lines on
  `main` at 7f61959, and the branch's tree holds 411
- gate after: exit 0, `sandbox-paths: 4516 tracked files checked, none holds a sandbox path (4 allowed files)`
