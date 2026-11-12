// Per-mutant comparison of two Stryker reports for one file (research R-06, tasks.md T024).
//
//   node specs/007-mutation-gate-strictness/evidence/compare.mjs <red mutation.json> <green mutation.json> <path>
//   node specs/007-mutation-gate-strictness/evidence/compare.mjs <red> <green>,<green>... <path> --cuts <line>,...
//
// Each mutant of <path> is keyed by its start and end (line:column), its mutator and its replacement. The script
// fails loudly (exit 1, the key named on stderr) on a key repeated within one run's file or a key present in only one
// run. Otherwise it prints every status move (red -> green, with its count, unchanged statuses included), then each
// mutant whose status changed, and for every Killed -> Timeout move the red killedBy tests and the green
// testsCompleted. Exit 2 on a usage error or a report without the file.
//
// Lever 3 (2026-11-11, spec FR-014): one red 60-line entry is compared with the 30-line entries that cover it. The
// green argument may then name several reports, comma-separated; their mutants of <path> are taken together, and a
// key in two of them is a repeated key. `--cuts L,...` names the new cuts, each between line L and line L + 1: a key
// only in the red run whose mutant starts on or before L and ends after L spans that cut, so no 30-line entry mutates
// it (001 FR-013, accepted limit); it is listed as "cut limit" instead of failing. Every other unmatched key still
// fails, and a key only in the green runs always fails.
import { readFileSync } from "node:fs";

const [redFile, greenList, path, cutsFlag, cutsList] = process.argv.slice(2);
const usage = "usage: compare.mjs <red mutation.json> <green mutation.json>[,<green mutation.json>...] <path> [--cuts <line>,...]\n";
if (redFile === undefined || greenList === undefined || path === undefined || (cutsFlag !== undefined && (cutsFlag !== "--cuts" || cutsList === undefined))) {
  process.stderr.write(usage);
  process.exit(2);
}
const cuts = cutsList === undefined ? [] : cutsList.split(",").map(Number);
if (cuts.some((cut) => !Number.isInteger(cut) || cut < 1)) {
  process.stderr.write(usage);
  process.exit(2);
}

function load(file) {
  const report = JSON.parse(readFileSync(file, "utf8"));
  const entry = report.files?.[path];
  if (entry === undefined) {
    process.stderr.write(`compare: ${file} has no file ${path}\n`);
    process.exit(2);
  }
  const tests = new Map();
  for (const [testFile, { tests: list }] of Object.entries(report.testFiles ?? {})) {
    for (const test of list) tests.set(test.id, `${testFile} > ${test.name}`);
  }
  return { mutants: entry.mutants, tests };
}

function keyOf(mutant) {
  const { start, end } = mutant.location;
  return `${start.line}:${start.column}-${end.line}:${end.column} ${mutant.mutatorName} ${JSON.stringify(mutant.replacement)}`;
}

const failures = [];

function byKey(run, label) {
  const map = new Map();
  for (const mutant of run.mutants) {
    const key = keyOf(mutant);
    if (map.has(key)) failures.push(`compare: repeated key in the ${label} run: ${key}`);
    map.set(key, mutant);
  }
  return map;
}

const red = load(redFile);
const greens = greenList.split(",").map(load);
const green = { mutants: greens.flatMap((run) => run.mutants), tests: new Map() };
const redKeys = byKey(red, "red");
const greenKeys = byKey(green, "green");
const spansCut = (mutant) => cuts.some((cut) => mutant.location.start.line <= cut && mutant.location.end.line > cut);
const cutLimit = [];
for (const [key, mutant] of redKeys) {
  if (greenKeys.has(key)) continue;
  if (spansCut(mutant)) cutLimit.push(mutant);
  else failures.push(`compare: key only in the red run: ${key}`);
}
for (const mutant of cutLimit) redKeys.delete(keyOf(mutant));
for (const key of greenKeys.keys()) if (!redKeys.has(key)) failures.push(`compare: key only in the green run: ${key}`);
if (failures.length > 0) {
  for (const failure of failures) process.stderr.write(`${failure}\n`);
  process.exit(1);
}

const byStart = (a, b) =>
  a.location.start.line - b.location.start.line || a.location.start.column - b.location.start.column;
const moves = new Map();
const changed = [];
for (const redMutant of [...redKeys.values()].sort(byStart)) {
  const key = keyOf(redMutant);
  const greenMutant = greenKeys.get(key);
  const move = `${redMutant.status} -> ${greenMutant.status}`;
  moves.set(move, (moves.get(move) ?? 0) + 1);
  if (redMutant.status !== greenMutant.status) changed.push({ key, move, redMutant, greenMutant });
}

process.stdout.write(`${path}: ${redKeys.size} mutants in both runs, every key once\n`);
for (const mutant of cutLimit.sort(byStart)) {
  process.stdout.write(`cut limit ${keyOf(mutant)}: ${mutant.status} in the red run, in no 30-line entry\n`);
}
for (const [move, count] of [...moves.entries()].sort()) process.stdout.write(`move ${move}: ${count}\n`);
for (const { key, move, redMutant, greenMutant } of changed) {
  let line = `changed ${key}: ${move}`;
  if (redMutant.status === "Killed" && greenMutant.status === "Timeout") {
    const killers = (redMutant.killedBy ?? []).map((id) => red.tests.get(id) ?? `test ${id}`);
    line += `; red killedBy ${JSON.stringify(killers)}; green testsCompleted ${String(greenMutant.testsCompleted)}`;
  }
  process.stdout.write(`${line}\n`);
}
