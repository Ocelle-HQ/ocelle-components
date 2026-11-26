# Visual baseline and token-delta evidence

The pinned Visual regression job for pilot head `7abc0189ec94213c3f9aeefcb589d5f1384f9183` captured exactly four missing baselines for the two new stories. The `visual` artifact (15061412964) contained exactly those four 1280 × 800 files. Both comparison arms use the identical image bytes. No existing baseline changed. [Capture job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45695653152/job/139492243827)

A local Chromium comparison applied the existing `fail-token-changed` light token delta (#15130F to #5A1E1E) to each story. Reviewed plan changed 6,401 pixels and Pinned versions changed 17,994. Both light stories are added to the expected Plant findings. Hosted confirmation uses the same Plant and the four pinned baselines.
