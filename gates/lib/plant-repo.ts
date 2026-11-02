// Temporary repositories for plants (research.md R-10, contracts/plants.md): `repo-tree`, `commit-repo` and
// `mutation-repo`. Scaffold: signatures only.

/** One record of a commit plant's commits.txt. */
export interface CommitSpec {
  readonly author: string;
  readonly message: string;
  /** For a merge record: the 1-based numbers of the two earlier records it merges. */
  readonly merge?: readonly [number, number];
}

/** The configuration set copied into every temporary repository: these root files, plus per package dir. */
export function configurationSet(_packageDirs: readonly string[]): string[] {
  return [];
}

/** The paths (relative to the plant) of the gate configuration files a plant carries. */
export function carriesConfiguration(_paths: readonly string[]): string[] {
  return [];
}

/** The records of a commits.txt text; throws naming the problem when a record is invalid. */
export function parseCommits(_text: string): CommitSpec[] {
  return [];
}

/** Lays the configuration set of `repo` and the plant's `tree/` into `into`, and links `repo`'s node_modules. */
export function buildRepoTree(_repo: string, _plant: string, _into: string): Promise<void> {
  return Promise.resolve();
}

/** A git repository in `into`: an empty signed-off base commit, then one commit per record of the plant's commits.txt. */
export function buildCommitRepo(_plant: string, _into: string): Promise<{ readonly base: string; readonly commits: readonly string[] }> {
  return Promise.resolve({ base: "", commits: [] });
}

/** A git repository in `into`: the configuration set and the plant's `base/`, then a commit with its `head/`. */
export function buildMutationRepo(_repo: string, _plant: string, _into: string): Promise<{ readonly base: string }> {
  return Promise.resolve({ base: "" });
}
