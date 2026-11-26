# Plants of phase 1

- base: a05573ca198e6c88555ea027f02618dff0a15645
- command: `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards` (hosted full Plants job)
- exit: 0
- Candidate `b35ebf49a6a34266113229f0e68c013dcc5f46f8`.
- The local selector ran with `--list` and judged no plants. The hosted full Plants job judged all 317 selected plants and exited 0. [Hosted Plants result](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257/job/137339233277)

```text
$ pnpm run gate:plants -- --affected a05573ca198e6c88555ea027f02618dff0a15645 --list
note: affected: every plant, by gates/bin/story-evidence.ts (shared gate source)
plants: affected since a05573ca198e6c88555ea027f02618dff0a15645: 317 of 317 plants selected, none judged (--list)
```

```text
plants: 317 plants of 17 gates and the registry judged, every plant as expected
```
