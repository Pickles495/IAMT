import test from "node:test";
import assert from "node:assert/strict";
import { parseBoardView, zoomBoardAt, fitBoardView } from "../lib/board-view";
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

test("zoom preserves the world point under the viewport center, including limits", () => {
  const camera = { pan: { x: -360, y: 90 }, zoom: 0.8 };
  const anchor = { x: 400, y: 250 };
  for (const requested of [0.1, 1.2, 3]) {
    const next = zoomBoardAt(camera, requested, anchor);
    assert.ok(next.zoom >= 0.35 && next.zoom <= 2.5);
    for (const axis of ["x", "y"] as const)
      assert.ok(
        Math.abs(
          (anchor[axis] - camera.pan[axis]) / camera.zoom -
            (anchor[axis] - next.pan[axis]) / next.zoom,
        ) < 1e-9,
      );
  }
});
test("fit centers negative-coordinate content within padding without magnifying it", () => {
  const bounds = { x: -500, y: -200, width: 1000, height: 400 };
  const size = { width: 768, height: 600 };
  const view = fitBoardView(bounds, size);
  assert.ok(view.zoom <= 1);
  assert.ok(bounds.x * view.zoom + view.pan.x >= 23.99);
  assert.ok(
    (bounds.x + bounds.width) * view.zoom + view.pan.x <= size.width - 23.99,
  );
  assert.equal(
    (bounds.y + bounds.height / 2) * view.zoom + view.pan.y,
    size.height / 2,
  );
});
