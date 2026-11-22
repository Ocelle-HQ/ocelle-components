# Verification timing

- Exact focused replay on 6d474fbb passed all 18 sub-checks in 2m32.266s. The identical rerun passed in 3.441s with all 18 reused.
- The first hosted matrix (run 45046420891) ran 9,822 tests across 285 files and passed all six shards. The longest job took 43m19s. The visual integration file alone used 2,095 seconds of test time in that job and shared the runner with the in-process drawer test, which used 332 seconds.
- The new planner weights the nine files that took over two minutes in that run. Replaying the 285-file inventory leaves the visual integration file on its own runner and preserves exact coverage. Those reassigned timings are a projection until this revision runs in CI.
- This record covers focused replay and the first hosted matrix. Full-suite parity and strict mutation on the final candidate remain required.
