import { embeddingSteps } from "./embedding-lesson";
export type Note = {
  id: string;
  text: string;
  tex?: string;
  x: number;
  y: number;
  width?: number;
  wide?: boolean;
  collapsed?: boolean;
  topic?: string;
  parent?: string;
  embeddingStep?: number;
};

// A parent link represents a branch of the learner's notes.
export function possibleParents(notes: Note[], id: string) {
  const children = new Map<string, Note[]>();
  for (const note of notes) {
    if (!note.parent) continue;
    const siblings = children.get(note.parent) ?? [];
    siblings.push(note);
    children.set(note.parent, siblings);
  }
  const excluded = new Set<string>(),
    stack = [id];
  while (stack.length) {
    const next = stack.pop()!;
    if (excluded.has(next)) continue;
    excluded.add(next);
    for (const child of children.get(next) ?? []) stack.push(child.id);
  }
  return notes.filter((note) => !excluded.has(note.id));
}
export function removeNote(notes: Note[], id: string) {
  return notes
    .filter((n) => n.id !== id)
    .map((n) => (n.parent === id ? { ...n, parent: undefined } : n));
}
export function validBoardElements(value: unknown): value is Note[] {
  if (!Array.isArray(value) || value.length > 1000) return false;
  const ids = new Set<string>();
  return value.every((n) => {
    if (
      !n ||
      typeof n.id !== "string" ||
      !n.id ||
      ids.has(n.id) ||
      typeof n.text !== "string" ||
      !Number.isFinite(n.x) ||
      !Number.isFinite(n.y)
    )
      return false;
    ids.add(n.id);
    return (
      (n.embeddingStep === undefined ||
        (Number.isInteger(n.embeddingStep) &&
          n.embeddingStep >= 0 &&
          n.embeddingStep < embeddingSteps.length)) &&
      (n.tex === undefined || typeof n.tex === "string") &&
      (n.parent === undefined || typeof n.parent === "string") &&
      (n.topic === undefined || typeof n.topic === "string") &&
      (n.width === undefined || (Number.isFinite(n.width) && n.width > 0))
    );
  });
}
