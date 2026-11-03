# SC-001 early timing (T083)

Measured on 2026-11-03 on a fresh clone of commit 8d839cc (phase 4 green), outside the repository, in this cloud
sandbox (4 vCPU, Intel Xeon @ 2.80GHz; Node 26.13.0, pnpm 12.16.1). SC-001 itself is measured on the CI runner in
the operator's verification (quickstart step 12); this is the early check T083 asks for, since phases 2 to 4 add the
real-tool `gates-integration` tests to `pnpm test`.

## Setup

```bash
T=$(mktemp -d <scratch>/sc001-XXXX)
git clone -q /home/user/ocelle-components "$T/clone"
mkdir -p "$T/store" "$T/browsers" "$T/cache"
cd "$T/clone"
export npm_config_store_dir="$T/store" PLAYWRIGHT_BROWSERS_PATH="$T/browsers"
pnpm store path
```

**Store check 1** (`npm_config_store_dir`): `pnpm store path` printed `/root/.local/share/pnpm/store/v11`, the
machine's existing store, not the new directory: pnpm 12.16.1 ignores `npm_config_store_dir` (as research.md R-04
records). So the run did not go on with it.

**Store check 2**: `npm_config_store_dir` unset, `pnpm_config_store_dir="$T/store"` set (the name pnpm 12 reads,
research.md R-04). `pnpm store path` printed `$T/store/v11`, the new, empty directory (pnpm appends its store
layout version). The run used this store; after it, the store held 13108 files there.

Also set, so that no earlier download is reused: `pnpm_config_cache_dir="$T/cache"` (empty package metadata cache).
Before timing: store 0 files, browser path 0 files, metadata cache 0 files.

CPUs: every timed command ran under `taskset -c 0,1` (2 of the machine's 4 CPUs).

## Timed commands

`pnpm run setup:online` is `pnpm install --frozen-lockfile && pnpm exec playwright install chromium`; its two parts
were timed separately, then `pnpm test`:

| Command | Exit | Duration |
|---|---|---|
| `taskset -c 0,1 pnpm install --frozen-lockfile` | 0 | 6.5 s |
| `taskset -c 0,1 pnpm exec playwright install chromium` | 1 | 4.3 s (failed, see below) |
| `OCELLE_CHROMIUM_PATH=<preinstalled headless Chromium> taskset -c 0,1 pnpm test` | 0 (588 tests passed in 33 files) | 75.7 s |
| **Total** | | **86.5 s** |

## Limits of this measurement

- **Browser download not measured.** This sandbox's network blocks `cdn.playwright.dev` (HTTP 403 from the proxy,
  "no rule or allowlist entry allows host"), so `playwright install chromium` failed after 4.3 s and the empty
  `PLAYWRIGHT_BROWSERS_PATH` stayed empty. `pnpm test` ran with the recorded operator override
  (`OCELLE_CHROMIUM_PATH`, research.md R-03) on the preinstalled headless Chromium. The total therefore leaves out the
  Chromium download (Playwright 1.64.1 asked for Chrome for Testing 156.0.8078.4).
- The npm registry is reached directly from this sandbox and was fast (the install of 405 packages into the empty
  store took 6.5 s); a CI runner's install can be slower.
- For about the last 10 s of `pnpm test`, a typecheck and a lint of the working repository ran on the machine at the
  same time (not pinned to CPUs 0 and 1).

## Result

86.5 s without the browser download, well under 5 minutes; even with a download of a few tens of seconds the total
stays under 5 minutes. Nothing to report to the operator under T083's 5-minute rule; the missing download is a
limit of this sandbox, recorded above.
