import test from "node:test";
import assert from "node:assert/strict";
import { knowledgeNodes, knowledgeNeighbors } from "../lib/personal-knowledge";
const saved = (id: string, name: string) => ({
  id,
  name,
  revision: 1,
  pv_boards: [],
  pv_conversations: [],
});
test("reference concepts link to actual saved topic IDs across languages", () => {
  const nodes = knowledgeNodes([
    saved("g1", "ガロア理論"),
    saved("g2", "Galois theory"),
    saved("x", "My conjecture"),
  ]);
  assert.equal(nodes.find((n) => n.id === "x")?.category, "未分類");
  assert.deepEqual(
    knowledgeNeighbors(nodes, "ref:fields").map((x) => x.node.id),
    ["g1", "g2"],
  );
  assert.ok(!nodes.some((n) => n.id === "ref:galois"));
  assert.ok(
    knowledgeNeighbors(nodes, "g1").some(
      (r) => r.node.id === "ref:fields" && !r.outgoing,
    ),
  );
});
