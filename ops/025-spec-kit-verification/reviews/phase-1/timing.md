# Verification timing

- Exact focused replay on 6d474fbb passed all 18 sub-checks in 2m32.266s. The identical rerun passed in 3.441s with all 18 reused.
- The first hosted matrix (run 45046420891) ran 9,822 tests across 285 files and passed all six shards. The longest job took 43m19s. The visual integration file alone used 2,095 seconds of test time in that job and shared the runner with the in-process drawer test, which used 332 seconds.
- The new planner weights the nine files that took over two minutes in that run. Replaying the 285-file inventory leaves the visual integration file on its own runner and preserves exact coverage. Those reassigned timings are a projection until this revision runs in CI.
- This record covers focused replay and the first hosted matrix. Full-suite parity and strict mutation on the final candidate remain required.

The first hosted original job completed in 72m29s. The same-revision aggregate compared the exact project, file, test and status identities for all 9,822 tests and passed. Every shard had finished by 43m54s from the original job start. The combined mutation-coverage revision at 8882e486 then passed all 20 focused proof sub-checks in 2m45.247s. Its new hosted results remain open.

On the timing-weighted run 45052831289, the visual-only job passed in 34m46s and was the last shard. All six shards had finished in 35m14s from inventory start. The comparison against that revision's stock run was still in progress when this result was recorded.

After the explicit collateral-CI policy, the complete focused Op proof passed all 22 sub-checks in 2m51.649s on 466a19ba. The #74 merge-candidate replay demonstrated the two exact deferred Storybook integration files with the required check inventory preserved.
