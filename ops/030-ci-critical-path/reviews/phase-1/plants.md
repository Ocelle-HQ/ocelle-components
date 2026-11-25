# Plants of phase 1

- base: fdbb22b0c1ec3b37b24107d89d0fce759b24526d
- selector: `pnpm --silent run gate:plants -- --affected fdbb22b0c1ec3b37b24107d89d0fce759b24526d --list`
- selector exit: 0
- command: `pnpm run gate:plants -- --verdict storybook/.visual/plant-shards` in required CI
- exit: 0

The affected selector includes the entire registry because of the added shadow workflow. The hosted aggregate judged all 318 Plants in 77 shards at exact published head `b5688a9f736bb548952740f78535a6b0ec2677c7` and tested merge `597976fe743b087c2f5d2fc36cd589252a6156ea`. The full hosted set covers the phase selection and runs the pinned Visual engines. [Required Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45702826894/job/139529062624)

```text
note: affected: every plant, by .github/workflows/mutation-shadow.yml (not mapped)
plants: affected since fdbb22b0c1ec3b37b24107d89d0fce759b24526d: 318 of 318 plants selected, none judged (--list)

plants: 318 plants of 17 gates and the registry judged, every plant as expected

```
