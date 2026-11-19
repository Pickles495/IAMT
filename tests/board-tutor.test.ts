import test from "node:test";
import assert from "node:assert/strict";
import {
  exampleReply,
  parseReply,
  generateReply,
  inferTopic,
} from "../ai/board-tutor";
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

test("paid adapters reject supplied credentials in every execution mode", async (t) => {
  const { aiExecutionPolicy } = await import("../ai/execution-policy");
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw Error("Unexpected external request");
  });
  for (const mode of [undefined, "MOCK", "DISABLED", "LIVE_GATED", "invalid"]) {
    assert.equal(aiExecutionPolicy(mode).liveEnabled, false);
  }
  await assert.rejects(
    generateReply({}, "test-key", "test-model"),
    /Paid AI execution is disabled/,
  );
  await assert.rejects(
    inferTopic("Fields", [], "en", "test-key", "test-model"),
    /Paid AI execution is disabled/,
  );
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("event dispatcher blocks a live transport before generation", async () => {
  const { executeJob } = await import("../ai/pv1");
  let calls = 0;
  await assert.rejects(
    executeJob(
      { topicId: "a", role: "Structure", locale: "en", eventId: "event" },
      {
        mode: "LIVE_GATED",
        generate: async () => {
          calls++;
          return {};
        },
      },
    ),
    /Paid AI execution is disabled/,
  );
  assert.equal(calls, 0);
});
