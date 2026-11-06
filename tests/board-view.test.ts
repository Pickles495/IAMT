import test from "node:test";
import assert from "node:assert/strict";
import { parseBoardView } from "../lib/board-view";
test("restores view coordinates and rejects corrupted or unbounded zoom", () => {
  const v = {
    pan: { x: -100, y: 200 },
    zoom: 1.3,
    selected: "a",
    reading: "a",
    tutor: false,
  };
  assert.deepEqual(parseBoardView(JSON.stringify(v)), v);
  for (const raw of [
    null,
    "{",
    "null",
    "[]",
    JSON.stringify({ ...v, zoom: 50 }),
    JSON.stringify({ ...v, pan: { x: null, y: 5 } }),
  ])
    assert.equal(parseBoardView(raw), null);
});
