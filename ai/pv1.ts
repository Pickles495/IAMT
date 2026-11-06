import { requireLiveExecution } from "./execution-policy";
export type Role = "Tutor" | "Structure" | "Question" | "Analyser";
type Job = { topicId: string; role: Role; locale: string; eventId: string };
export interface OpenAITransport {
  mode: "MOCK" | "LIVE_GATED";
  generate(job: Job): Promise<unknown>;
}
export async function executeJob(job: Job, transport: OpenAITransport) {
  if (transport.mode !== "MOCK") requireLiveExecution();
  const result = await transport.generate(job);
  if (
    !result ||
    typeof result !== "object" ||
    !("topicId" in result) ||
    result.topicId !== job.topicId ||
    !("role" in result) ||
    result.role !== job.role ||
    !("text" in result) ||
    typeof result.text !== "string" ||
    !result.text.trim() ||
    result.text.length > 16000
  )
    throw Error("Invalid role output");
  return {
    eventId: job.eventId,
    topicId: job.topicId,
    role: job.role,
    text: result.text,
  };
}
export const structureJob = (
  event: { id: string; topic_id: string; kind: string },
  locale: string,
): Job | null =>
  ["topic.created", "topic.updated"].includes(event.kind)
    ? { eventId: event.id, topicId: event.topic_id, role: "Structure", locale }
    : null;
