---
triage: 023
issues: [60]
decision: op
target: "ops/023-public-repo-hygiene"
in_scope: [60]
out_of_scope: [11, 54, 57]
semver: none
spec_prompt: "Op 023 (#60, triage/023-public-repo-hygiene.md): redact sandbox paths in the committed logs and records on main with the placeholders of this record, keep and list the four allowed files, add the `sandbox-paths` CI gate (rule exactly as in this record, test-first, with a plant), make red.sh and tdd-check.sh redact the logs they write, and update SECURITY.md and spec 001 FR-032 for the public repository; no history rewrite."
status: proposed
---

# Triage 023: Public repository hygiene (sandbox paths and SECURITY.md)

## Issues read

- **#60** (open). This session could not read it from GitHub: the GraphQL route is blocked and `gh api` was
  denied. This record therefore works from the operator's statement of scope (given at triage, quoted under
  Scope) and from the repository itself. The working branch is `claude/060-public-repo-hygiene`.
- The operator's inputs: the repository is now public. One op is to (1) redact sandbox paths (the `/root/…` and
  `/home/user/…` prefixes) in the committed logs and records on `main`, with a stable placeholder, without
  changing what the evidence shows; (2) keep the test fixtures that hold such paths on purpose, and list them;
  (3) add a check that stops new commits from adding such paths, test-first and with a plant, or redact at write
  time as mission 012 suggested (triage chooses one or both); (4) update `SECURITY.md` for the public state
  (spec 001 FR-032). Rewriting git history is out of scope. Missions 018, 019 and 020, op 022 (#57) and the
  landing of #54 are in flight and will add logs, so the record must state the check's rule exactly.

What is on `main` at `7f61959` (measured with `git grep`, tracked files only):

- 411 files (415 lines) match the rule below. By prefix: 317 lines name pnpm's store
  (`Content-addressable store is at:` followed by the store under `/root/…`, in `tdd-check` and `red` logs), and
  about 98 name the repository root under `/home/user/…`: vitest's `RUN v5.0.5 <root>`, Stryker's `projectRoot`,
  `tsconfigFile`, `configFile` and the `file://` report URL in `mutation.json` and `entry-*.txt`, the reviewers'
  prose, and one probe script's `import` (`specs/011-layout-headers/reviews/phase-4/flex-column-probe.mjs:1`).
  A few lines name `/root/` + `.cache`.
- By kind: 326 `.log`, 59 `.json`, 16 `.md`, 10 `.txt`, 1 `.mjs`. Apart from the allowed files below, every
  match is under `specs/*/` or `ops/*/` (reviews, evidence, mutation), plus `knowledge/speckit-flows/log.md`.
- `SECURITY.md` still says private vulnerability reporting "is switched on when the repository goes public with
  release 1.0.0 (#11)" and names `@MOES-Media` as the contact "until then". Spec 001 FR-032 requires exactly that
  wording, and `gates/test/governance.test.ts:58-66` checks it: it expects `@MOES-Media`, the 3 working days and
  the 10 working days.

## Related work found

| Ref | Kind | Relation | Reason |
|---|---|---|---|
| #60 | issue (open) | in scope | The issue under triage. |
| #11 | issue (open) | out of scope (stays the 1.0.0 release) | FR-032 ties "public" to 1.0.0 (#11; triage 001). The repository went public before the release, so this op amends FR-032. Publishing and the release itself stay with #11. |
| #57 / op 022 | op (in flight) | out of scope; affected | Will add logs. If it lands after this op, its logs must pass the new gate (see Risks). |
| #54 | landing (in flight) | out of scope; affected | Same as op 022. |
| missions 018, 019, 020 | missions (in flight) | out of scope; affected | Same as op 022. Their branches already hold unredacted logs. |
| #1 | epic | context | The roadmap epic. Nothing in it covers repository hygiene. |
| mission 012 (`specs/012-button-action-row`, squashed in `4911fd0`) | mission (done) | prior art | Its landing redacted 20 logs to `<pnpm store>` (`reviews/landing/round-6.md:38`). `knowledge/speckit-flows/log.md:25` suggests "`red.sh` and `tdd-check.sh` redact the store line when they write the log", after the problem recurred in seven missions. |
| `knowledge/speckit-flows/log.md:63,74,87,127,148` | findings | prior art | The landing rule 8 grep kept flagging the store path. Operators chose to leave it each time; the candidates were "strip it at write time" or "allow container paths". |
| `.claude/skills/ocelle-land/SKILL.md:49-51` (rule 8) | landing rule | related, unchanged | A staged-diff grep for `/home/[a-z]` and `/root/` at landing. The new gate does not replace it: rule 8 also looks for keys and e-mail addresses. Its text does not match the gate's rule (see below). |
| spec 001 FR-020, FR-032; `contracts/ci-checks.md`; `gates/gates.json`; `gates/lib/registry.ts` | spec and registry | amended by this op | A new gate changes the FR-020 gate list (seventeen gate ids become eighteen, eighteen required check names become nineteen). FR-032 changes for the public state. |
| `gates/test/governance.test.ts:58-66` | test | changed test-first | Asserts the FR-032 text of `SECURITY.md`. |
| constitution, "Gates are proven, too" (l.138) and "No secrets, tokens or personal data" (l.157) | constitution | governs | The new gate needs a plant. Sandbox paths are container paths, not personal data (log.md:148), so this is hygiene, not a breach, and no constitution change is needed. |
| op 021 (`ops/021-fold-signing`) | op (done) | unrelated | Rewrites only branch history, never `main`'s. Consistent with the out-of-scope history rewrite. |
| `tooling/speckit/bin/guard-commit.sh` | commit hook | not the vehicle | A local PreToolUse hook, so it binds only agent sessions. The enforced check must run in CI. |

GitHub search for further related issues was not possible from this session (see Issues read). The operator
should add any related issue the record misses.

## Decision

**op.** It is one bounded change with expected behaviour stated in full below and no new public surface. No
package, element, attribute, event, slot, part or token changes (semver `none`). The work is repository tooling,
CI, docs and evidence hygiene, and the operator has settled the design choices (redact, do not rewrite history,
keep the fixtures).

- **Not `mission`.** It adds no public surface, spans no packages, and has only one user-visible outcome:
  "the public tree holds no sandbox paths, and new ones are refused". Security behaviour is limited to repository
  hygiene and a docs channel, not to shipped code. The new gate is a CI change of the kind ops 015 and 016 made.
- **Not `fold`.** No feature or op in progress owns repository hygiene. The in-flight work is affected, but none
  of it should carry this.
- **Not `none` or `decision-needed`.** The work is real and unscoped elsewhere. The open questions below have a
  default each and do not block the spec.

**Check or write-time redaction: both.** Neither is enough alone:

- **Write-time redaction alone** covers only what `red.sh` and `tdd-check.sh` write. About 100 of today's
  matches come from other writers: Stryker's `mutation.json` and console logs, by-hand vitest captures, probe
  scripts and reviewers' prose. Nothing would stop the next one.
- **The check alone** would fail every in-flight mission at landing, because each `tdd-check` run writes the store
  path again. Every landing would need the hand redaction that mission 012 did for 20 logs.

So the check is what enforces the rule, and write-time redaction keeps the scripts' own output clean, so the
check does not cost each mission a redaction pass.

## Scope

In scope (#60):

1. **The rule (stated exactly; the gate, the redaction and the reviews all use this rule and no other).** A line
   holds a sandbox path when it matches the POSIX extended regular expression

   ```
   (^|[^A-Za-z0-9._~-])/(root|home/user)/[A-Za-z0-9._-]
   ```

   That is, `/root/` or `/home/user/`, not preceded by a path-name character (a slash before it still counts, as
   in `file:///…`), and followed by a path-name character. As intended, it does **not** match:
   - `/work/root/…`;
   - `gates/test/fixtures/root/…`;
   - a bare mention such as `` `/root/` ``, `/root/|`, `/root/…` or `/home/user/…`;
   - `/home/u/…` and `/home/runner/…` (fixtures).

   The gate runs `git grep -nIE '<rule>'` over the tracked files of the checkout, excluding the allowed files
   below. It fails (exit 1) on any match and prints each `path:line`. It passes (exit 0) when there is none, and
   exits 2 on a setup error. It scans the whole tracked tree, not only the diff: `main` is clean after this op, so
   a branch fails only on paths it adds. Binary files are skipped (`-I`).
2. **Allowed files**, listed as a constant in the gate's source. Adding a file to the list is a reviewed code
   change. There are exactly four:
   - `gates/test/capture-plan.test.ts`: a host browser path under `/root/` + `.cache`, used on purpose as test input
     (l.73).
   - `gates/test/fixtures/pins/pnpm/success.ndjson`: recorded pnpm output, whose `storeDir` the fixture keeps
     verbatim.
   - `gates/test/fixtures/pins/pnpm/outdated-lockfile.ndjson`: the same.
   - `specs/001-repository-foundation/reviews/phase-4/round-1.md`: its only match (l.27) is a false positive, an
     ellipsis-shortened fixture path `…` + `/root/` + `prefix/tree/…` (that is `gates/test/fixtures/root/prefix/…`), not a
     sandbox path.

   The gate's own tests and plant build their sandbox-path inputs at run time (for example `"/" + "root/"`), so
   they need no entry. The redaction script's source must not match the rule either.
3. **One-time redaction on `main`.** Only the matched path prefix is replaced. No line is added, removed or
   reordered, and no other byte changes. The placeholders are stable and follow existing precedent:
   - pnpm's store, `/root/` + `.local/share/pnpm/store/v<N>` (any `v<N>`), becomes `<pnpm store>`, as in the
     90 files already redacted;
   - the repository root, `/home/user/` + `ocelle-components`, becomes `<repo>` (precedent `file://<repo>`, 12
     files), so `file://` + `/home/user/` + `ocelle-components/x` becomes `file://<repo>/x`;
   - any other `/root/` or `/home/user/` prefix that matches the rule becomes `<home>/`.

   The rules apply in that order. Every `.json` file still parses afterwards. The review checks the diff with
   `git diff --word-diff` (only placeholder substitutions) and re-runs the rule (zero matches outside the
   allowed files). The redaction is one shared script under `tooling/speckit/bin/` (stdin to stdout, plus an
   in-place mode for a file list).
4. **Write-time redaction.** `red.sh` and `tdd-check.sh` pass every log and JSON record they write through the
   same script. Both copies change identically: `.specify/extensions/story/scripts/` and
   `tooling/speckit/extensions/story/scripts/`, which are identical today. A test runs each script on a fixture
   with a sandbox path in its output and expects the placeholder in the written log.
5. **The `sandbox-paths` gate, test-first, with a plant.** This covers `gates/bin/`, the `gates/gates.json`
   entry, the `fr020` list of `gates/lib/registry.ts`, the `ci.yml` job (pinned actions, `contents: read`,
   `persist-credentials: false`), `specs/001-repository-foundation/contracts/ci-checks.md` (the row and the
   counts) and an FR-020 amendment in spec 001. The plant adds a non-allowed file holding a store path and a
   repository-root path, and the gate must fail on it. Unit tests cover each "does not match" case of item 1.
6. **`SECURITY.md` and FR-032 for the public state.** GitHub private vulnerability reporting becomes the channel
   now, not "once public with 1.0.0". The "until then" text goes, or remains a fallback as the operator answers
   Q1. The content and response-time requirements (3 and 10 working days) are unchanged. FR-032 and
   `governance.test.ts` change first (red), then `SECURITY.md` (green).

Out of scope:

- rewriting git history (operator decision);
- the 1.0.0 release (#11);
- the in-flight work (018, 019, 020, op 022/#57, #54), apart from the landing note under Risks;
- scratchpad paths under `/tmp/claude…` (80 files), which the operator did not name; see Q2;
- other personal-data patterns (e-mail, keys), which landing rule 8 still covers.

## Risks and open questions

- **In-flight branches will fail the new gate** if they land after this op with logs written before it. Each
  needs one pass of the redaction script before merge. That is mechanical, and the gate names every line. The
  op's run summary must tell the operator, so the landings of 018, 019, 020, 022 and #54 expect it.
- **Required check.** The gate counts only once the operator adds `sandbox-paths` to the ruleset on `main`
  (nineteen required names). That is an operator action after merge.
- **Size.** About 410 evidence files change in one mechanical commit. Keep it separate from the gate and script
  commits so review can read it as substitutions only.
- **The rule's known gap.** A path directly after a letter or digit, for example after an ANSI colour code
  (`…m/root/…`), is not caught. None exist today (0 matches), and the scripts' redaction catches them at write
  time anyway.

Questions for the operator (each with a default the spec may take if unanswered):

- **Q1. What should `SECURITY.md` name as the reporting channel now?**
  - (a) GitHub private vulnerability reporting only, with `@MOES-Media` removed from `SECURITY.md` and from the
    FR-032 test.
  - (b) Private vulnerability reporting first, with `@MOES-Media` kept as the fallback contact if the form is
    unavailable. **Default.**
  - (c) Keep the current text until private vulnerability reporting is confirmed switched on, and change only
    the "with release 1.0.0" wording.
- **Q2. What should happen to scratchpad paths (`/tmp/claude-0/…`, with session ids, 80 files)?**
  - (a) Leave them; they are outside #60 as scoped. **Default.**
  - (b) Add them to this op's rule and redaction as `<scratchpad>`.
  - (c) Open a separate issue for them.
- **Q3. Is private vulnerability reporting already switched on in the repository settings?** This session could
  not read the settings.
  - (a) Yes.
  - (b) No: the operator switches it on before this op lands.
  - (c) No, and it stays off (then Q1 must be (c)).

## What would change this decision

- Issue #60's body (unread here) asks for more than the operator's scope, such as a history rewrite, a licence
  or notice review, or a secrets scan. Then this becomes a `mission`, or a second op.
- The operator wants the rule to cover any `/home/<name>/`. Then the allowed list must grow to cover the
  `/home/u/` and `/home/runner/` fixtures and the 48 Stryker reports under spec 007 that embed them. That is a
  design question, and it would justify a `mission`.
- An in-flight mission chooses to carry the hygiene work itself. Then this becomes a `fold` into that mission.
