import { describe, expect, it } from "vitest";
import { directoryNames, filePaths } from "../lib/entries.ts";
import type { Entry } from "../lib/entries.ts";

// Directory listings as the gates read them (research.md R-09; phase 4 review round 1, R1-09): the entries of
// `readdir` with file types, recorded here as plain objects, become the directory names or the file paths the gates
// work on.
function entry(parentPath: string, name: string, kind: "file" | "dir" | "link"): Entry {
  return { name, parentPath, isFile: () => kind === "file", isDirectory: () => kind === "dir" };
}

const listing: readonly Entry[] = [
  entry("/r/gates/plants", "pins", "dir"),
  entry("/r/gates/plants", "README.md", "file"),
  entry("/r/gates/plants", "csp", "dir"),
  entry("/r/gates/plants", "linked", "link"),
  entry("/r/gates/plants/csp", "plant.json", "file"),
  entry("/r/gates/plants/csp/tree/packages", "a.js", "file"),
];

describe("directoryNames", () => {
  it("lists the directories only (not files or links), sorted by name", () => {
    expect(directoryNames(listing)).toEqual(["csp", "pins"]);
  });

  it("lists none for no entries", () => {
    expect(directoryNames([])).toEqual([]);
  });
});

describe("filePaths", () => {
  it("lists the files only, relative to the given directory, sorted", () => {
    expect(filePaths(listing, "/r/gates/plants")).toEqual(["README.md", "csp/plant.json", "csp/tree/packages/a.js"]);
  });

  it("writes paths relative to a directory above the listed one", () => {
    expect(filePaths(listing, "/r")).toEqual(["gates/plants/README.md", "gates/plants/csp/plant.json", "gates/plants/csp/tree/packages/a.js"]);
  });

  it("lists none for no entries", () => {
    expect(filePaths([], "/r")).toEqual([]);
  });

  it("sorts the files whatever order the entries come in", () => {
    expect(filePaths([entry("/r", "b.ts", "file"), entry("/r/a", "c.ts", "file"), entry("/r", "a.ts", "file")], "/r")).toEqual(["a.ts", "a/c.ts", "b.ts"]);
  });
});
