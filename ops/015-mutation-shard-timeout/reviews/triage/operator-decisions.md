# Operator decisions at the triage gate, op 015 (#35)

Asked by the /ocelle-run orchestrator at the triage gate on 2026-11-15, answered by the operator (jeroennouwsdev)
as multiple choice. The questions are the ones in `triage/015-mutation-shard-timeout.md`.

| Question | Choice |
|---|---|
| Triage | approve |
| Q1, which shards get the higher limit | A: only shards whose files name `packages/elements/src/`; all others keep 10 minutes |
| Q2, where the CI measurement runs | A: a draft PR, closed unmerged, of mission 008's branch plus this op's provisional workflow |
| Q3, the rule for N | A: worst measured job time × 1.5, rounded up to 5 minutes, never below 45 |

## Op gate (2026-11-15)

| Question | Choice |
|---|---|
| Op gate | approve |
| How the T003 scratch branch reaches GitHub | The orchestrator of this session pushes `claude/015-measure-elements-shards` once (the T002 commit on 008's head) and asks the operator's orchestrator session to open the draft PR, relay the figures and close it unmerged |

## T002 commit guard (2026-11-15)

The commit guard refused the T002 scratch commit on `claude/015-measure-elements-shards` (008's tree has no op 015
record). Operator's choice: the scratch commit also carries copies of `ops/015-mutation-shard-timeout/op.md` and
`triage/015-mutation-shard-timeout.md` from the op branch, so the guard finds the approved link. The branch is
throwaway and its PR is closed unmerged.

## T002 permission refusal (2026-11-15)

Claude Code's permission classifier refused the implementer's T002 command in this session. Operator's choice: the
operator's orchestrator session (session_01NUfZSc26YwQLeow31d6R6X) builds the scratch branch on 008's head
`78fe475` itself (the one-line `ci.yml:89` change), pushes it, opens the draft PR, relays the T003 figures and
closes the PR unmerged. The local scratch branch in this session is dropped. The Op-gate choice that this session
pushes the scratch branch is superseded.
