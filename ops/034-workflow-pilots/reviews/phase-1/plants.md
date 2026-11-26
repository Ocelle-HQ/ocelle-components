# Plants of phase 1

- base: c503984f091043952d5f97385e2f9188b9bbceca
- selector: `node gates/bin/plants.ts --affected c503984f091043952d5f97385e2f9188b9bbceca --list`
- selector exit: 0

```text
note: affected: every plant, by .github/workflows/evidence-reuse-shadow.yml (not mapped)
plants: affected since c503984f091043952d5f97385e2f9188b9bbceca: 326 of 326 plants selected, none judged (--list)
```

The required hosted run must judge the full registry on the exact candidate. The separate mixed-survivor experiment runs the existing negative fixture through the standard Mutation gate. [Seeded failure parity](seeded-failure.md)

## Round 4 verification

Rerunning the original phase-base selector exited `0` and again selected 326 of 326. The incremental selector against `b655b83b1d17694039f7b5c968e483384145a90a` exited `0` and selected zero. These local results record selection.

```text
$ node gates/bin/plants.ts -- --affected b655b83b1d17694039f7b5c968e483384145a90a --list
plants: affected since b655b83b1d17694039f7b5c968e483384145a90a: 0 of 326 plants selected, none judged (--list)
```

The required #106 Plants job judged all 326 successfully. Run `45858408090`, attempt `1`, tested head `823de462a542d3545749ebb963cf8ffc18391541` on base `b655b83b1d17694039f7b5c968e483384145a90a` with merge `361cf0ed5aa674ecc4d841c644fb9496b181b824`. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45858408090/job/140054829355)
