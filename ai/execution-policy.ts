export type AIMode = "MOCK" | "DISABLED" | "LIVE_GATED";

// Live execution requires a future reviewed code change, not a deployment flag.
export function aiExecutionPolicy(mode = process.env.PV1_AI_MODE) {
  const effective: AIMode =
    mode === undefined || mode === "MOCK"
      ? "MOCK"
      : mode === "LIVE_GATED"
        ? "LIVE_GATED"
        : "DISABLED";
  return {
    mode: effective,
    mockEnabled: effective === "MOCK",
    liveEnabled: false,
  };
}

export function requireLiveExecution(): never {
  throw new Error("Paid AI execution is disabled in this release");
}
