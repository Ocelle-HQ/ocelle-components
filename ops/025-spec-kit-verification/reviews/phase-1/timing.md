# Verification timing

- Exact focused replay on 6d474fbb passed all 18 sub-checks in 2m32.266s. The identical rerun passed in 3.441s with all 18 reused.
- The first hosted matrix (run 45046420891) ran 9,822 tests across 285 files and passed all six shards. The longest job took 43m19s. The visual integration file alone used 2,095 seconds of test time in that job and shared the runner with the in-process drawer test, which used 332 seconds.
- The new planner weights the nine files that took over two minutes in that run. Replaying the 285-file inventory leaves the visual integration file on its own runner and preserves exact coverage. Those reassigned timings are a projection until this revision runs in CI.
- This record covers focused replay and the first hosted matrix. Full-suite parity and strict mutation on the final candidate remain required.

The first hosted original job completed in 72m29s. The same-revision aggregate compared the exact project, file, test and status identities for all 9,822 tests and passed. Every shard had finished by 43m54s from the original job start. The combined mutation-coverage revision at 8882e486 then passed all 20 focused proof sub-checks in 2m45.247s. Its new hosted results remain open.

On the timing-weighted run 45052831289, the visual-only job passed in 34m46s and was the last shard. All six shards had finished in 35m14s from inventory start. The comparison against that revision's stock run was still in progress when this result was recorded.

After the explicit collateral-CI policy, the complete focused Op proof passed all 22 sub-checks in 2m51.649s on 466a19ba. The #74 merge-candidate replay demonstrated the two exact deferred Storybook integration files with the required check inventory preserved.

Runs 45062666658 and 45062695001 both found an uncovered empty worker callback. The default mutation project does not launch the CLI as a subprocess. Applying that exact mutation separately made the existing real-worktree test reject the missing worker report and record no red assertions. After restoring the worker, the named real-worktree test and all 302 other targeted tests passed. The strict mutation check for the failed Op shard passed with zero survivors and records this one subprocess boundary.

The first green rollout candidate passed all 189 jobs, including strict mutation and the full Plants gate. The original and sharded runs matched every project, file, test and status for 10,407 tests in 315 files. The original job took 74m58s. All six shards had finished 41m49s after inventory started. [Parity verdict](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063509601/job/137356532588)

The #74 pilot passed 10,287 tests in 298 files across six shards and all other required gates. Its exact local phase replay passed six checks in 87.337s and reused all six in 1.745s. The full hosted run took 55m20s, with mutation testing finishing last. [Pilot CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257)

The clean merge of main `fe9bf2d9` left the verification tools and workflow unchanged. Typecheck and 465 focused workflow tests passed on the integrated tree. A fresh hosted run checks the new main integration before merge.
