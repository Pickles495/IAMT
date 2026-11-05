import { topics as catalog, relations } from "./domain";
export type WorkspaceTopic = {
  id: string;
  name: string;
  revision: number;
  pv_boards: { id: string; title: string }[];
  pv_conversations: { id: string; title: string }[];
};
const normalize = (s: string) => s.normalize("NFKC").trim().toLowerCase();
export function knowledgeNodes(saved: WorkspaceTopic[]) {
  const mapped = saved.map((topic) => {
    const key = normalize(topic.name);
    const concept = catalog.find((c) =>
      [c.label, c.english, c.id].some((alias) => normalize(alias) === key),
    );
    return {
      id: topic.id,
      topic,
      concept,
      category: concept?.category ?? "未分類",
    };
  });
  // Include reference concepts even before the learner creates a personal Topic.
  return [
    ...mapped,
    ...catalog
      .filter((c) => !mapped.some((n) => n.concept?.id === c.id))
      .map((concept) => ({
        id: "ref:" + concept.id,
        topic: undefined,
        concept,
        category: concept.category,
      })),
  ];
}
export function knowledgeNeighbors(
  nodes: ReturnType<typeof knowledgeNodes>,
  focusId: string,
) {
  const focus = nodes.find((n) => n.id === focusId)?.concept;
  if (!focus) return [];
  return relations.flatMap((edge) => {
    if (edge.from !== focus.id && edge.to !== focus.id) return [];
    const outgoing = edge.from === focus.id;
    return nodes
      .filter((n) => n.concept?.id === (outgoing ? edge.to : edge.from))
      .map((node) => ({
        node,
        outgoing,
        label: edge.label,
        explanation: edge.explanation,
      }));
  });
}
