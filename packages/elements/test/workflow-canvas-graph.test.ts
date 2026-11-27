import { describe, expect, it } from "vitest";
import type {
  WorkflowCanvasGraph,
  WorkflowCanvasLayoutEntry,
  WorkflowCanvasNode,
  WorkflowCanvasOutcome,
} from "../src/workflow-canvas-types.ts";

type GraphModule = typeof import("../src/workflow-canvas-graph.ts");

// Report absent results through the same assertions when replaying before the module existed.
const graph = import.meta.glob<GraphModule>("../src/workflow-canvas-graph.ts", { eager: true })["../src/workflow-canvas-graph.ts"];
const projectWorkflowCanvasGraph = graph?.projectWorkflowCanvasGraph ?? (() => ({
  nodes: undefined,
  positions: undefined,
  relationships: undefined,
  drawableConnections: undefined,
}));

function step(
  id: string,
  label: string,
  outcomes: readonly WorkflowCanvasOutcome[] = [],
): WorkflowCanvasNode {
  return { id, label, kind: "Review", accountableRole: "Reviewer", outcomes };
}

function layoutFor(...nodes: readonly WorkflowCanvasNode[]): readonly WorkflowCanvasLayoutEntry[] {
  return nodes.map(({ id }, index) => ({ nodeId: id, x: index * 100, y: -index * 40 }));
}

describe("workflow canvas graph projection", () => {
  it("keeps supplied node order and uses IDs independently of labels and layout order", () => {
    const first = step("__proto__", "Review");
    const second = step("review[1]", "Review");
    const projection = projectWorkflowCanvasGraph({ nodes: [second, first], connections: [] }, [
      { nodeId: first.id, x: -40, y: 80 },
      { nodeId: second.id, x: 120, y: -20 },
    ]);

    expect(projection.nodes).toEqual([second, first]);
    expect(projection.positions).toEqual(new Map([
      [first.id, { x: -40, y: 80 }],
      [second.id, { x: 120, y: -20 }],
    ]));
  });

  it("resolves each outcome within its source despite repeated outcome IDs and display labels", () => {
    const accepted = { id: "advance", label: "Accepted" };
    const escrowed = { id: "hold", label: "Accepted" };
    const escalated = { id: "advance", label: "Escalated" };
    const first = step("first-review", "Review", [accepted, escrowed]);
    const second = step("second-review", "Review", [escalated]);
    const approved = step("publish", "Next step");
    const pending = step("revise", "Next step");
    const nodes = [first, second, approved, pending];
    const graph: WorkflowCanvasGraph = {
      nodes,
      connections: [
        { sourceId: first.id, outcomeId: accepted.id, destinationId: approved.id },
        { sourceId: first.id, outcomeId: escrowed.id, destinationId: pending.id },
        { sourceId: second.id, outcomeId: escalated.id, destinationId: pending.id },
      ],
    };
    const relationships = [
      { source: first, outcome: accepted, destination: approved },
      { source: first, outcome: escrowed, destination: pending },
      { source: second, outcome: escalated, destination: pending },
    ];
    const projection = projectWorkflowCanvasGraph(graph, layoutFor(...nodes));

    expect(projection.relationships).toEqual(relationships);
    expect(projection.drawableConnections).toEqual(relationships);
  });

  it("resolves renamed steps and outcomes under the same supplied connection IDs", () => {
    const outcome = { id: "accepted", label: "Accepted" };
    const review = step("review", "Review", [outcome]);
    const publish = step("publish", "Publish");
    const layout = layoutFor(review, publish);
    const connections = [{ sourceId: review.id, outcomeId: outcome.id, destinationId: publish.id }];
    const renamedOutcome = { ...outcome, label: "Approved" };
    const renamedReview = { ...review, label: "Final review", outcomes: [renamedOutcome] };
    const renamedPublish = { ...publish, label: "Release" };

    const before = projectWorkflowCanvasGraph({ nodes: [review, publish], connections }, layout);
    const after = projectWorkflowCanvasGraph({ nodes: [renamedReview, renamedPublish], connections }, layout);

    expect(before.relationships).toEqual([{ source: review, outcome, destination: publish }]);
    expect(after.relationships).toEqual([
      { source: renamedReview, outcome: renamedOutcome, destination: renamedPublish },
    ]);
    expect(after.positions).toEqual(before.positions);
  });

  it("drops relationships with a missing source, destination or source-scoped outcome", () => {
    const outcome = { id: "accepted", label: "Accepted" };
    const unrelatedOutcome = { id: "complete", label: "Complete" };
    const review = step("review", "Review", [outcome]);
    const publish = step("publish", "Publish", [unrelatedOutcome]);
    const nodes = [review, publish];
    const graph: WorkflowCanvasGraph = {
      nodes,
      connections: [
        { sourceId: "gone-source", outcomeId: outcome.id, destinationId: publish.id },
        { sourceId: review.id, outcomeId: unrelatedOutcome.id, destinationId: publish.id },
        { sourceId: publish.id, outcomeId: unrelatedOutcome.id, destinationId: "gone-target" },
        { sourceId: review.id, outcomeId: outcome.id, destinationId: publish.id },
      ],
    };
    const projection = projectWorkflowCanvasGraph(graph, layoutFor(...nodes));
    const valid = [{ source: review, outcome, destination: publish }];

    expect(projection.relationships).toEqual(valid);
    expect(projection.drawableConnections).toEqual(valid);
  });

  it("names a valid unpositioned destination and draws its edge once the host supplies the position", () => {
    const outcome = { id: "accepted", label: "Accepted" };
    const review = step("review", "Review", [outcome]);
    const publish = step("publish", "Publish");
    const graph: WorkflowCanvasGraph = {
      nodes: [review, publish],
      connections: [{ sourceId: review.id, outcomeId: outcome.id, destinationId: publish.id }],
    };
    const relation = [{ source: review, outcome, destination: publish }];
    const unpositioned = projectWorkflowCanvasGraph(graph, layoutFor(review));
    const positioned = projectWorkflowCanvasGraph(graph, layoutFor(review, publish));

    expect(unpositioned.relationships).toEqual(relation);
    expect(unpositioned.drawableConnections).toEqual([]);
    expect(positioned.relationships).toEqual(relation);
    expect(positioned.drawableConnections).toEqual(relation);
  });

  it("preserves the relation from an unpositioned source without suppressing other drawable edges", () => {
    const outcome = { id: "accepted", label: "Accepted" };
    const parked = step("parked", "Parked review", [outcome]);
    const active = step("active", "Active review", [outcome]);
    const publish = step("publish", "Publish");
    const graph: WorkflowCanvasGraph = {
      nodes: [parked, active, publish],
      connections: [
        { sourceId: parked.id, outcomeId: outcome.id, destinationId: publish.id },
        { sourceId: active.id, outcomeId: outcome.id, destinationId: publish.id },
      ],
    };
    const drawable = { source: active, outcome, destination: publish };
    const projection = projectWorkflowCanvasGraph(graph, layoutFor(active, publish));

    expect(projection.relationships).toEqual([
      { source: parked, outcome, destination: publish },
      drawable,
    ]);
    expect(projection.drawableConnections).toEqual([drawable]);
  });

  it("keeps named relations while excluding orphan positions and non-finite coordinates", () => {
    const outcome = { id: "accepted", label: "Accepted" };
    const review = step("review", "Review", [outcome]);
    const publish = step("publish", "Publish");
    const revise = step("revise", "Revise");
    const graph: WorkflowCanvasGraph = {
      nodes: [review, publish, revise],
      connections: [{ sourceId: review.id, outcomeId: outcome.id, destinationId: publish.id }],
    };
    const projection = projectWorkflowCanvasGraph(graph, [
      { nodeId: "removed", x: 2, y: 4 },
      { nodeId: review.id, x: 0, y: 16 },
      { nodeId: publish.id, x: Number.POSITIVE_INFINITY, y: 50 },
      { nodeId: revise.id, x: 10, y: Number.NaN },
    ]);

    expect(projection.positions).toEqual(new Map([[review.id, { x: 0, y: 16 }]]));
    expect(projection.relationships).toEqual([{ source: review, outcome, destination: publish }]);
    expect(projection.drawableConnections).toEqual([]);
  });

  it("projects an edge without changing the host's graph or layout snapshots", () => {
    const outcome = Object.freeze({ id: "accepted", label: "Accepted" });
    const review = Object.freeze(step("review", "Review", Object.freeze([outcome])));
    const publish = Object.freeze(step("publish", "Publish", Object.freeze([])));
    const graph = Object.freeze({
      nodes: Object.freeze([review, publish]),
      connections: Object.freeze([
        Object.freeze({ sourceId: review.id, outcomeId: outcome.id, destinationId: publish.id }),
      ]),
    });
    const layout = Object.freeze([
      Object.freeze({ nodeId: publish.id, x: 120, y: -20 }),
      Object.freeze({ nodeId: review.id, x: 0, y: 16 }),
    ]);
    const snapshot = structuredClone({ graph, layout });
    const projection = projectWorkflowCanvasGraph(graph, layout);

    expect({ graph, layout, drawable: projection.drawableConnections }).toEqual({
      ...snapshot,
      drawable: [{ source: review, outcome, destination: publish }],
    });
  });
});
