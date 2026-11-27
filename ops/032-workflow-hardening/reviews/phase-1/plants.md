# Plants of phase 1

- base: b8f06d5c652aae2c308d0a09f3e991e800138004
- selector: `pnpm run gate:plants -- --affected b8f06d5c652aae2c308d0a09f3e991e800138004 --list`
- selector exit: 0

The selector includes all 326 Plants because the operation changes shared gate source. The required hosted Plants check judged all 326 as expected on published head `027571375536b7c76a6a578c2109eeb96b77305e` and tested merge `c2e926e529f17b13899ac506d6f037e42587c33b`. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45736906063/job/139640454928)

```text
note: affected: every plant, by gates/bin/story-evidence.ts (shared gate source)
plants: affected since b8f06d5c652aae2c308d0a09f3e991e800138004: 326 of 326 plants selected, none judged (--list)
plants: 326 plants of 18 gates and the registry judged, every plant as expected
```

The round 3 corrections still select 326 of 326 Plants with the same base and list command, which exited 0. The hosted Plants verdict for the corrected candidate is pending.
