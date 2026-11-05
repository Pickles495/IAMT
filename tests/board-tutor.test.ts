import test from "node:test";
import assert from "node:assert/strict";
import { exampleReply, parseReply } from "../ai/board-tutor";
test("Tutor proposals allow only bounded plain-text edits", () => {
  for (const locale of [true, false])
    assert.deepEqual(parseReply(exampleReply(locale)), exampleReply(locale));
  for (const proposal of [
    { action: "delete", text: "x", tex: "" },
    { action: "replace", text: "", tex: "" },
    { action: "append", text: "x".repeat(6001), tex: "" },
  ])
    assert.throws(() => parseReply({ reply: "ok", proposal }));
});
