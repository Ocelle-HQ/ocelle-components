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

## Round 2 fix

The local affected selector exited 0 and selected all 317 Plants for the hosted judge.

```text
$ pnpm run gate:plants -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
$ node gates/bin/plants.ts -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 3515d2757508bd523fa55c6615af4f3996f842aa: 317 of 317 plants selected, none judged (--list)
```

The full hosted judge for corrected candidate `a5a70a5e9c25728ec96ea34ae71ab19a8173a745` exited 0. GitHub tested synthetic merge `edb5442014c3ebffd7bcc0e213c72de17415c506` on the same tree. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45337422057/job/138259287330)

```text
plants: 317 plants of 17 gates and the registry judged, every plant as expected
```

## Round 3 fix

The local affected selector exited 0 and listed all 317 Plants for the hosted judge.

```text
$ pnpm run gate:plants -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
$ node gates/bin/plants.ts -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 3515d2757508bd523fa55c6615af4f3996f842aa: 317 of 317 plants selected, none judged (--list)
```

The full hosted judge for corrected candidate `4278d47e82c3f9a7276ca6a34d1f4d4593ed031d` exited 0. GitHub tested synthetic merge `c00af3218c0ce051b2896d1f310b90782907dcb2` on the same tree. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45368663814/job/138366266486)

```text
plants: 317 plants of 17 gates and the registry judged, every plant as expected
```

## Round 4 fix

The local affected selector exited 0 and listed all 317 Plants for the hosted judge.

```text
$ pnpm run gate:plants -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
$ node gates/bin/plants.ts -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 3515d2757508bd523fa55c6615af4f3996f842aa: 317 of 317 plants selected, none judged (--list)
```

The full hosted judge for combined candidate `e3fc15c9b42daa8c8f5d2b1ed319450be037ebf5` exited 0. GitHub tested synthetic merge `c9b750c4d809a7807089cbf9542082947474c118` on the same tree. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45384501909/job/138421962156)

```text
plants: 317 plants of 17 gates and the registry judged, every plant as expected
```

## Round 5 fix

The local affected selector exited 0 and listed all 317 Plants for the hosted judge.

```text
$ pnpm run gate:plants -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
$ node gates/bin/plants.ts -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 3515d2757508bd523fa55c6615af4f3996f842aa: 317 of 317 plants selected, none judged (--list)
```

## Round 5 placement follow-up

The local affected selector exited 0 and selected all 317 Plants for the hosted judge.

```text
$ pnpm run gate:plants -- --affected 3515d2757508bd523fa55c6615af4f3996f842aa --list
note: affected: every plant, by packages/elements/package.json (not mapped)
plants: affected since 3515d2757508bd523fa55c6615af4f3996f842aa: 317 of 317 plants selected, none judged (--list)
```

The full hosted judge for the round 5 candidate `892326d2c382f06b56fe97eae28303fcc21432b0` exited 0. GitHub tested synthetic merge `9cff11c5e0153d7b1868f22698da7356ea2e3561` on the same tree. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45399679956/job/138476607656)

```text
plants: 317 plants of 17 gates and the registry judged, every plant as expected
```
