# Phase 3 CI run (T045, T046)

CI run 43072665056 on head `07c97ef` (pull request #24, the first head with T044b), recorded on 2026-11-11 from the
coordinator's reading of the run's logs. Every check of the run passed.

## Jobs

| Job | Job time | Gate step | Gate line | Free disk after (`df -h /`) |
|---|---|---|---|---|
| Visual regression (130704351360) | 17:54:40 to 17:57:29 (2 min 49 s) | `pnpm run gate:visual -- --engine both`, 17:55:07 to 17:57:24 (2 min 17 s) | `visual: 24 captures match their baselines (docker+podman)` | `/dev/root 72G 68G 4.2G 95% /` |
| Plants (130704352001) | 17:54:40 to 18:32:32 (37 min 52 s) | `pnpm run gate:plants`, `OCELLE_VISUAL_ENGINE=both`, 17:55:14 to 18:32:27 (37 min 13 s) | `plants: 241 plants of 15 gates and the registry judged, every plant as expected` | `/dev/root 72G 68G 4.2G 95% /` |
| Unit tests | 17:54:39 to 18:01:13 (6 min 34 s) | | passed | |
| Mutation (41 shards and the aggregate) | shards about 17:55 to 18:03 | | passed | |

The other jobs passed: Storybook build, Content security, Brand rules, Contrast, Sign-off, Test lint, Mutation plan,
Typecheck, Style lint, Install and pins, Prefix, Code lint, Story config copies. No artifact was uploaded (both
artifact steps run on failure only).

Both engines ran: the Visual regression gate names `docker+podman`, and the Plants job ran with
`OCELLE_VISUAL_ENGINE=both`. skopeo was on the ubuntu-24.04 runner: under podman the pin check reads the media type
with `skopeo inspect --raw` (plan decision 21) and a missing skopeo exits 2 before any engine command, so the passing
podman run shows it was found. Its version was not printed.

## T046: captures against the baselines

Under both engines the 24 captures matched the committed baselines under `storybook/baselines/`, so CI's captures and
the local ones are the same files. There is nothing to commit for T046.

## Not recorded: podman's inspect outputs, skopeo's raw manifest, `skopeo --version` (stop-and-ask)

The gates print their summary lines only, and the workflow runs no step that prints these outputs. So T045 cannot yet
replace T022's written podman fixtures and T044a's skopeo fixtures (byte copies of the docker imagetools recordings)
with recorded bytes. Getting them needs either a workflow change or new gate output. Both belong to the operator and
the contract, so the implementer has made neither.

What would be changed, and why: in the Visual regression job, after the gate step, one step that prints
`skopeo --version`, writes `skopeo inspect --raw docker://<pin>` and `podman image inspect <pin>` to files, and uploads
them as an artifact. The gate then needs no new output, and the bytes come from the runner itself. The step could be
kept for one run only, or kept permanently as the pin's provenance record. T045 would then compare them with the
fixtures, test-first if they differ.

## Plants job time and the split count (stop-and-ask: the Plants job is over 30 minutes)

The Plants gate took 37 min 13 s (2,233 s) with 12 repository stories (24 story-themes). That is over the 30-minute
mark of research R-07 and tasks.md § Stop-and-ask points ("the Plants job near 30 minutes"). At the current count the
serial job has already passed the limit that the split count marks.

Time per story-theme of `visual` plants: the run's log has no time per plant, so the visual share is estimated. In this
sandbox the full plant run took about 27 min, of which the visual plants took about 24.5 min. That leaves about 2.5 min
(150 s) for the other 193 plants, which this estimate takes as the same on the runner. The 48 `visual` plants then took
about 2,083 s on the runner. Spread over 48 plants × 24 story-themes, that is about 1.8 s per story-theme per visual
plant. That 1.8 s covers both engines, with two captures each, and the build and pin check of each plant. If only the
43 plants that reach the capture are counted, it is about 2.0 s.

`axe` plants: none exist yet (phase 4), so their time per story-theme cannot be measured in this run. They will add to
the job.

Split count, derived from the run: the Plants time is about 150 s plus about 174 s per repository story
(2,083 s / 12). It reaches 30 minutes (1,800 s) at (1,800 − 150) / 174 ≈ 9.5 stories. So the **split count is 9
stories**, and the repository already holds 12.

Proposed Complexity Tracking row (for the operator's approval; not written into plan.md):

| Item | Scope | Rationale | Sunset |
|---|---|---|---|
| Plant roots hold every repository story | the Plants job: every `storybook-build`, `visual` and `axe` plant builds, captures (twice) or audits all repository stories, so its time grows with plants × stories | plants keep the whole configuration set, so no plant can miss a repository input (research R-16); the growth is measured, not guessed (research R-07): CI run 43072665056 took 37 min 13 s for the Plants gate with 12 stories, about 1.8 s per story-theme per `visual` plant under docker and podman | the op that splits the Plants job (a matrix, the operator's registry change) before the repository holds the **split count**, **9 stories**. The repository already holds 12, so the split is due now, before phase 4 adds the `axe` plants |

Questions for the operator:
1. The Plants job is at 37 minutes and over the split count. Should the split (a matrix of the `visual` plants, a
   registry change) be made now, and in which phase or op?
2. Do you approve the split count (9 stories) and the row above?
3. Free disk after both pulls is 4.2G (95% used) in both jobs. Should the disk measures of research R-07 (pruning the
   docker copy before the podman pull; removing the runner's unused toolsets in Plants) be taken now, or only when a
   job runs short?
4. Should a workflow step record podman's inspect outputs, skopeo's raw manifest and `skopeo --version` (above), so
   T045 can replace the written fixtures?
