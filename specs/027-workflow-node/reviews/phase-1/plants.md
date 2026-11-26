# Plants of phase 1

- base: `88702025e56654ceb479d468ad0a565f23ea4f76`
- command: `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards` (hosted full Plants job)
- exit: 0
- Candidate `c9ebf6eccfc634d2a678ee736efd9238647ab6b7`, checked as merge `d0dc0c245e3a44772202d2d38441fc46a5b5994e`. [Hosted Plants result](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45190728055/job/137760355525)

The local selector identified all 317 plants. The hosted aggregation judged each plant from its shard report.

```text
$ pnpm run gate:plants -- --affected 88702025e56654ceb479d468ad0a565f23ea4f76 --list
$ node gates/bin/plants.ts -- --affected 88702025e56654ceb479d468ad0a565f23ea4f76 --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 88702025e56654ceb479d468ad0a565f23ea4f76: 317 of 317 plants selected, none judged (--list)
```

```text
plants: 317 plants of 17 gates and the registry judged, every plant as expected
```
