import { topics, exerciseFor, evaluateAnswer, type TopicId } from "./domain";
import { definitions } from "./topic-english";
const english: Record<TopicId, string> = {
  conics: "Find both x-intercepts of the ellipse.",
  calculus: "Find the slope of the tangent to f(x) = x² at x = 3.",
  galois: "Why does Q(√2) have exactly two automorphisms fixing Q?",
  fields: "Use bases to explain the tower law for finite field extensions.",
  linear:
    "Why is the quadratic form of a real symmetric matrix with positive eigenvalues positive definite?",
  symmetry:
    "Why do the symmetries of an equilateral triangle form a group under composition?",
};
const extras: Record<TopicId, [string, string, number, string, string]> = {
  galois: [
    "Q(√2) の Q 上の次数は？",
    "What is the degree of Q(√2) over Q?",
    2,
    "√2 の最小多項式の次数を考えます。",
    "Use the degree of the minimal polynomial of √2.",
  ],
  fields: [
    "[L:F]=3, [F:K]=2 のとき [L:K] は？",
    "If [L:F]=3 and [F:K]=2, find [L:K].",
    6,
    "塔の法則で次数を掛けます。",
    "Multiply the degrees using the tower law.",
  ],
  conics: [
    "x²+4y²=4 の正の y 切片は？",
    "Find the positive y-intercept of x²+4y²=4.",
    1,
    "x=0 を代入します。",
    "Substitute x=0.",
  ],
  calculus: [
    "x³ の x=2 での微分係数は？",
    "Find the derivative of x³ at x=2.",
    12,
    "導関数は 3x² です。",
    "The derivative is 3x².",
  ],
  linear: [
    "対角行列 diag(2,3) の行列式は？",
    "Find the determinant of diag(2,3).",
    6,
    "対角成分を掛けます。",
    "Multiply the diagonal entries.",
  ],
  symmetry: [
    "正三角形の対称変換は全部で何個？",
    "How many symmetries does an equilateral triangle have?",
    6,
    "回転と鏡映を数えます。",
    "Count rotations and reflections.",
  ],
};
export const catalog = topics.flatMap((topic) => {
  const ex = exerciseFor(topic.id),
    [ja, en, number, hint, hintEn] = extras[topic.id];
  return [
    {
      id: ex.id,
      concept: topic.id,
      ja: ex.prompt,
      en: english[topic.id],
      tex: ex.math,
      hint: ex.hints[0],
      hintEn:
        ex.check === "roots"
          ? "Set y=0."
          : ex.check === "slope"
            ? "Differentiate x² first."
            : "Start from the definition.",
      solution: ex.solution,
      solutionEn:
        ex.check === "roots"
          ? "x = −2, 2"
          : ex.check === "slope"
            ? "2 × 3 = 6"
            : definitions[topic.id],
      grade: (a: string) => evaluateAnswer(ex, a).result,
    },
    {
      id: topic.id + "-short-v1",
      concept: topic.id,
      ja,
      en,
      tex: "",
      hint,
      hintEn,
      solution: hint + " " + number,
      solutionEn: hintEn + " " + number,
      grade: (a: string) => {
        const s = a.normalize("NFKC").trim().replace("−", "-");
        return /^[+-]?\d+(\.\d+)?$/.test(s)
          ? Number(s) === number
            ? "correct"
            : "incorrect"
          : "inconclusive";
      },
    },
  ];
});
export type Pack = {
  id: string;
  title: string;
  questions: string[];
  pv_package_topics: { topic_id: string }[];
  pv_attempts: {
    id: string;
    question_version: string;
    answer: string;
    solution_seen: boolean;
    created_at: string;
  }[];
};
export function records(packs: Pack[]) {
  return packs
    .flatMap((pack) =>
      pack.pv_attempts.map((a) => ({
        ...a,
        pack,
        question: catalog.find((q) => q.id === a.question_version),
        result:
          catalog.find((q) => q.id === a.question_version)?.grade(a.answer) ??
          "inconclusive",
      })),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
