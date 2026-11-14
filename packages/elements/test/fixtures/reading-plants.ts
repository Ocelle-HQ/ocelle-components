// The planted readings of the oracle rows (specs/010-feedback-forms T001c; contracts/testing.md § Plants, "oracle
// reading", Seams "planted reading"): each is the reading of live-reading.ts with one defect, run by
// test/plants.test.ts on the named case of test/live-rules.ts, which it must make fail. Not shipped.
import { announcements, regionText } from "../live-reading.ts";
import type { AxRecord } from "../live-reading.ts";
import type { Reading } from "../live-rules.ts";

/** `nodes` with, before the children of each node `chosen` picks, a StaticText node holding that node's own name. */
function withOwnNames(nodes: readonly AxRecord[], chosen: (node: AxRecord) => boolean, as?: string): AxRecord[] {
  const added: AxRecord[] = [];
  const changed = nodes.map((node) => {
    if (node.ignored || !chosen(node)) return node;
    const id = `${node.nodeId}-own-name`;
    added.push({ nodeId: id, ignored: false, role: { type: "internalRole", value: "StaticText" }, name: node.name ?? {}, parentId: node.nodeId, childIds: [] });
    return { ...node, ...(as === undefined ? {} : { role: { type: "role", value: as } }), childIds: [id, ...(node.childIds ?? [])] };
  });
  return [...changed, ...added];
}

/** Takes a link's own name as well as its StaticText children. */
export const linkName: Reading = {
  regionText: (nodes, region) => regionText(withOwnNames(nodes, (node) => node.role?.value === "link"), region),
  announcements,
};

/** Visits an `img`'s descendants after its name. */
export const imgDescendants: Reading = {
  regionText: (nodes, region) => regionText(withOwnNames(nodes, (node) => node.role?.value === "image" || node.role?.value === "img", "group"), region),
  announcements,
};

/** Ignores the keeping rule: every state counts, under either rule. */
export const noKeepingRule: Reading = {
  regionText,
  announcements: (snapshots) => announcements(snapshots.map((snapshot) => ({ ...snapshot, lifecycle: true })), "rendered"),
};
