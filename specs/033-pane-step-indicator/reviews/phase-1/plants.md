# Plants of phase 1

- base: 53d47ade4619725a7e96763ef129ccc317e2b7cc
- selector: `pnpm run gate:plants -- --affected 53d47ade4619725a7e96763ef129ccc317e2b7cc --list`
- selector exit: 0

The selector includes all 326 Plants because the phase changes the element package entries. The hosted Plants check judged all 326 as expected on head `44ea2b3eb37425e62422f1403fcc9bf850a1884a` and tested merge `cae8a497dbdd6bf940916c8a1f201fa7cde86bdb`. [Hosted Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45739224718/job/139647513869)

The eight exact manifest Plants also passed in the local round 1 repair. The added test compares all raw findings, including unexpected stale findings.
