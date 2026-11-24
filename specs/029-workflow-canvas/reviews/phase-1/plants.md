# Plants of phase 1

- base: `3515d2757508bd523fa55c6615af4f3996f842aa`
- command: `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards` (full hosted Plants judge)
- exit: 0
- Candidate `d5d078bbeeed6fc4b5d4a3f8e39fb500f7bdb0de`, checked as merge `59c171c42cee3998f7f4a9ab3f5c66eaea9c4a8f`. Both revisions share the exact tree. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45317324025/job/138194973323)

The local selector included all 317 Plants because package registration changed `packages/elements/package.json`. The local pinned Docker daemon lacked writable image storage. The approved hosted route judged the complete inventory from its shard artifacts.

```text
$ pnpm run gate:plants -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
$ node gates/bin/plants.ts -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 3515d2757508bd523fa55c6615af4f3996f842aa: 317 of 317 plants selected, none judged (--list)
```

```text
plants: 317 plants of 17 gates and the registry judged, every plant as expected
```

## Round 1 fixes

The local affected selector exited 0 and again selected all 317 Plants. The exact corrected candidate `8f7d54bcf394b69e431a2e7a1ec5bc7a4fc6c69f` was checked as synthetic merge `5195e3515f8fae671f540cb80f44f7b6fffcd5e2` on the same tree. Its full hosted judge exited 0. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45327915909/job/138228535961)

```text
$ pnpm run gate:plants -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 3515d2757508bd523fa55c6615af4f3996f842aa: 317 of 317 plants selected, none judged (--list)
```

```text
plants: 317 plants of 17 gates and the registry judged, every plant as expected
```
