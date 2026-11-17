# Phase 5, T066: merging `main`

**Not merged in this run.** The operator's decision M1 (`operator-decisions.md`) moves T066's merge of `main`, its
conflict resolution and the R-16 reconciliation of `--ocelle-tracking-caps` and the container-tier convention with #8
to `/ocelle-land`, which brings the branch up to date by merging `main` (never a rebase). Phase 5 neither merges nor
rebases; the gates of `quickstart.md` were run on the branch as it is (`quickstart.md` in this directory).

## What `main` holds (read only)

Read with `git fetch --depth=50 origin main` on 2026-11-15 (main only; the feature branch was not fetched).

- `origin/main` is `ce1d9c72b7f9e028565e61684465cf8df448ac1d`, "Op 015: mutation CI shard time limit for element
  source (#35) (#37)".
- The branch's merge base with it is `3828d2fee8dccab6f5c2697f859e2af7247d3378` (Mission 006, #10), so `main` holds
  one commit the branch does not: `ce1d9c7` (#35, the mutation CI shard time limit: `.github/workflows/ci.yml`, `gates/README.md`, two gate tests and its own `ops/` and `knowledge/` records).
- **#8 (011)**: not on `main`. No commit of the fetched history names it.
- **#9 (010)**: not on `main`.
- **#16 (008)**: not on `main`.

So none of the three siblings T066 names has landed. When `/ocelle-land` merges `main`, the only incoming change
known today is #35's; R-16's reconciliation with #8 applies only once #8 has landed by then.
