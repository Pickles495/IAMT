import test from "node:test";
import assert from "node:assert/strict";
import {
  possibleParents,
  removeNote,
  validBoardElements,
} from "../lib/board-elements";
const notes = ["a", "b", "c", "d"].map((id, i) => ({
  id,
  text: id,
  x: i,
  y: 0,
  parent: [undefined, "a", "b", undefined][i],
}));
test("manual links exclude descendants and removal detaches surviving children", () => {
  assert.deepEqual(
    possibleParents(notes, "b").map((n) => n.id),
    ["a", "d"],
  );
  const result = removeNote(notes, "b");
  assert.deepEqual(
    result.map((n) => n.parent),
    [undefined, undefined, undefined],
  );
  assert.equal(notes[2].parent, "b");
});
test("board saves preserve legacy fields but reject duplicate identity or invalid geometry", () => {
  assert.ok(
    validBoardElements([
      { ...notes[0], wide: true, topic: "fields", kind: "topic" },
    ]),
  );
  for (const value of [
    [...notes, notes[0]],
    [{ ...notes[0], x: null }],
    [{ ...notes[0], text: {} }],
  ])
    assert.equal(validBoardElements(value), false);
});
