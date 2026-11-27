# Plants of phase 2

- base: 7b16ae326e11aa837b4d0f8540881e69c8d622c3
- selector: `pnpm run gate:plants -- --affected 7b16ae326e11aa837b4d0f8540881e69c8d622c3 --list`
- selector exit: 0

The Vitest project addition selects the entire Plant registry. The required hosted Plants check judges all 326 cases, including the pinned Visual and empty-index Plants.

```text
note: affected: every plant, by vitest.config.ts (not mapped)
plants: affected since 7b16ae326e11aa837b4d0f8540881e69c8d622c3: 326 of 326 plants selected, none judged (--list)
```

## Hosted verification

The full Plants check judged all 326 Plants across 18 gates and accepted every result, including the pinned token-change and empty-index cases. It tested merge `aa12493e9bc93d97f761337a0ebd9dc9f4ca7e92` for candidate `086e11acd0693235880275ea04d5f54f897a7ace`. [Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45749472887/job/139680652835)
