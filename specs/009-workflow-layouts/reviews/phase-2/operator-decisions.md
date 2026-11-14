# Operator decisions in phase 2 (2026-11-14, human:jeroennouwsdev)

- **B1** (visual baselines on a merge of main), "Confirm": when a merge of main conflicts on a baseline PNG, take
  neither side. Regenerate the baselines in the pinned container and commit them in the merge commit.
- **B2** (baseline engine for 009), "Keep docker baselines": 009 keeps the baselines produced under docker, and the
  baselines of phases 2 to 4 are produced here under docker (`OCELLE_VISUAL_ENGINE=docker`; podman is not installed).
  CI confirmation of the new baselines (T028, note R2-01) is carried into the pull request description.
- **P1** (T030 stop-and-ask, `reviews/phase-2/stop-and-ask.md`), "Run the plant": the implementer runs the scrollbar
  plant of T016 once, as written in stop-and-ask.md, and restores the file byte for byte. If the plant bites, the
  implementer records it in `plants.md`, ticks T030 and phase 2 goes to review. If it does not bite, the phase stops
  again with that result.
