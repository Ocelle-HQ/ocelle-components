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
