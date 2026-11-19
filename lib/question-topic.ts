type NamedTopic = { id: string; name: string };
const normalize = (s: string) => s.normalize("NFKC").trim().toLocaleLowerCase();
export function suggestedTopic(question: string, topics: NamedTopic[]) {
  const query = normalize(question);
  const matches = topics.filter((t) => query.includes(normalize(t.name)));
  return (
    matches.sort((a, b) => b.name.length - a.name.length)[0]?.name ??
    question.trim().slice(0, 80)
  );
}
