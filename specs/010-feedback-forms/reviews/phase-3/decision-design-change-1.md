# Phase 3 design change 1: operator decision

decided_by: human:jeroennouwsdev
date: 2026-11-15
question: approve design-change-1.md (plan decision 11, task T041a): element-source mutation shards cut by mutant count, at most 10 mutants per entry and per shard, counted at plan time; and the new direct development dependency `@stryker-mutator/instrumenter` 10.1.1 (Apache-2.0, already in the lockfile through `@stryker-mutator/core`), pinned exactly.

**Decision: approved, both the design and the dependency.**

Option not taken: no new dependency, cutting by a fixed short line span instead.
