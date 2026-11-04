import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyState,
  restoreState,
  exerciseFor,
  evaluateAnswer,
  summarize,
  topics,
  relations,
  type Attempt,
} from "../lib/domain";
test("fixed root assessment preserves both roots and declines unsupported prose", () => {
  const ex = exerciseFor("conics");
  for (const answer of ["-2, 2", "2,-2", "x = ±2", "−2、2"])
    assert.equal(evaluateAnswer(ex, answer).result, "correct");
  assert.equal(evaluateAnswer(ex, "2").result, "incorrect");
  assert.equal(
    evaluateAnswer(ex, "I think x = 2 and -2").result,
    "inconclusive",
  );
  assert.equal(
    evaluateAnswer(ex, "<script>alert(1)</script>").result,
    "inconclusive",
  );
});
test("proof answers are never claimed verified", () =>
  assert.equal(
    evaluateAnswer(exerciseFor("galois"), "The automorphism fixes Q.").result,
    "inconclusive",
  ));
test("aggregation excludes revealed solutions and inconclusive proofs from denominator", () => {
  const base: Attempt = {
    id: "1",
    topicId: "conics",
    exerciseId: "roots-v1",
    answer: "±2",
    result: "correct",
    feedback: "ok",
    hintCount: 0,
    revealed: false,
    createdAt: new Date().toISOString(),
  };
  assert.deepEqual(
    summarize([
      base,
      { ...base, id: "2", revealed: true },
      { ...base, id: "3", result: "inconclusive" },
    ]),
    { total: 3, assessed: 1, correct: 1, topics: 1 },
  );
});
test("corrupt or incompatible saved data falls back safely; valid records survive", () => {
  for (const value of [
    null,
    "{",
    "null",
    '{"version":2}',
    JSON.stringify({ ...emptyState, preferences: {} }),
    JSON.stringify({ ...emptyState, attempts: [{}] }),
  ])
    assert.deepEqual(restoreState(value), emptyState);
  assert.deepEqual(
    restoreState(JSON.stringify({ ...emptyState, saved: ["galois"] })),
    { ...emptyState, saved: ["galois"] },
  );
});
test("graph edges reference shared topic identity; classification is separate", () => {
  for (const r of relations) {
    assert.ok(topics.some((t) => t.id === r.from));
    assert.ok(topics.some((t) => t.id === r.to));
  }
  assert.equal(new Set(topics.map((t) => t.id)).size, topics.length);
});
