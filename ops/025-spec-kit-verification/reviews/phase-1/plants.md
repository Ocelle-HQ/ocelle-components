# Plants of phase 1

- Base `a3f82074aa492eff78fb5c481f20d7d458033b5a`.
- The local selector on `f2135802` ran with `--list` and judged no plants. The preceding rollout candidate `023fda5f` passed the full hosted Plants check, which judged all 317 plants. The current main integration has its own required Plants check. [Hosted Plants result](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063509601/job/137339921598)

```text
$ pnpm run gate:plants -- --affected a3f82074aa492eff78fb5c481f20d7d458033b5a --list
note: affected: every plant, by gates/bin/story-evidence.ts (shared gate source)
plants: affected since a3f82074aa492eff78fb5c481f20d7d458033b5a: 317 of 317 plants selected, none judged (--list)
```
