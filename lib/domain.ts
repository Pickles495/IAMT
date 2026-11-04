export type TopicId =
  | "conics"
  | "linear"
  | "galois"
  | "fields"
  | "calculus"
  | "symmetry";
export type Topic = {
  id: TopicId;
  label: string;
  english: string;
  category: string;
  description: string;
  formula: string;
  definition: string;
  example: string;
  question: string;
  x: number;
  y: number;
};
export const topics: Topic[] = [
  {
    id: "conics",
    label: "二次曲線と不変量",
    english: "Conics & invariants",
    category: "幾何・代数",
    description: "式の見た目が変わっても、変わらない構造は何だろう。",
    formula: "Ax^2+Bxy+Cy^2+Dx+Ey+F=0",
    definition:
      "平面上の二次曲線は、二変数の二次方程式の零点集合として表されます。座標の回転で交差項を取り除き、係数に隠れた幾何学的構造を調べます。",
    example:
      "x^2+4y^2=4 は x^2/4+y^2=1 と書けるので、半長軸2、半短軸1の楕円です。",
    question: "座標を回転しても、曲線が楕円であることは変わるでしょうか？",
    x: 285,
    y: 115,
  },
  {
    id: "linear",
    label: "固有値・固有ベクトル",
    english: "Eigenvalues & eigenvectors",
    category: "代数",
    description: "変換によって向きが変わらない方向を探す。",
    formula: "A\\mathbf{v}=\\lambda\\mathbf{v},\\quad\\mathbf{v}\\ne 0",
    definition:
      "正方行列Aに対して、Av=λvを満たす非零ベクトルvを固有ベクトル、λを固有値と呼びます。実対称行列は直交行列によって対角化できます。",
    example:
      "対角行列 diag(1,4) の固有値は1と4。二次形式 x²+4y² の主軸は座標軸に一致します。",
    question: "固有値が両方正の二次形式は、どんな図形を表すでしょうか？",
    x: 280,
    y: 280,
  },
  {
    id: "galois",
    label: "ガロア理論",
    english: "Galois theory",
    category: "代数",
    description: "方程式の解を、解の間の対称性から眺める。",
    formula: "\\operatorname{Gal}(L/K)=\\operatorname{Aut}_K(L)",
    definition:
      "拡大体Lのうち基礎体Kの各元を固定する自己同型を集めると、合成を演算とする群になります。有限ガロア拡大では中間体と部分群の間に対応があります。",
    example: "Q(√2)/Q の自己同型は、恒等写像と √2 を −√2 に送る写像の2つです。",
    question: "なぜ √2 の像は、別の任意の実数ではいけないのでしょうか？",
    x: 550,
    y: 280,
  },
  {
    id: "fields",
    label: "体の拡大",
    english: "Field extensions",
    category: "代数",
    description: "数の世界を広げると、何が解けるようになるか。",
    formula: "[L:K]=[L:F][F:K]",
    definition:
      "K⊆F⊆L が体の塔であり各次数が有限なら、LをK上のベクトル空間と見た次元は、2つの拡大次数の積です。",
    example: "Q(√2) の Q 上の基底は {1,√2}。したがって拡大次数は2です。",
    question:
      "添加する元が、すでに体に含まれていたら次数はどうなるでしょうか？",
    x: 560,
    y: 115,
  },
  {
    id: "calculus",
    label: "微分と局所近似",
    english: "Derivatives & local models",
    category: "解析",
    description: "小さな変化から、関数の振る舞いを読み解く。",
    formula: "f(a+h)=f(a)+f'(a)h+o(h)",
    definition:
      "微分可能な関数は、ある点の十分近くで一次関数によって近似できます。誤差をhで割ったものが0に近づくことが、微分可能性の条件です。",
    example:
      "f(x)=x²、a=1なら f(1+h)=1+2h+h²。一次近似は1+2h、残る誤差はh²です。",
    question: "近似の範囲を広げたら、誤差はどのように変わるでしょうか？",
    x: 100,
    y: 280,
  },
  {
    id: "symmetry",
    label: "対称性と群",
    english: "Symmetry & groups",
    category: "基礎・構造",
    description: "対象を保つ操作をひとつの構造として考える。",
    formula: "g\\circ h\\in G,\\quad g^{-1}\\in G",
    definition:
      "群は、結合則、単位元、逆元を備えた演算の構造です。対象の対称変換は、合成を演算として群をなすことがあります。",
    example:
      "正三角形を保つ平面の等長変換は、3つの回転と3つの鏡映からなります。",
    question:
      "2つの対称変換を続けて行っても、対称変換になるのはなぜでしょうか？",
    x: 420,
    y: 440,
  },
];
export const relations: {
  from: TopicId;
  to: TopicId;
  label: string;
  explanation: string;
}[] = [
  {
    from: "linear",
    to: "conics",
    label: "応用",
    explanation: "実対称行列の直交対角化により、二次形式の主軸を求められます。",
  },
  {
    from: "fields",
    to: "galois",
    label: "基礎概念",
    explanation: "ガロア群は体の拡大に付随する自己同型群として定義されます。",
  },
  {
    from: "symmetry",
    to: "galois",
    label: "関連",
    explanation: "ガロア理論では解の置換に現れる対称性を群として調べます。",
  },
  {
    from: "symmetry",
    to: "conics",
    label: "関連",
    explanation:
      "座標回転の下で変わらない量を調べるという、変換と不変量の視点を共有します。",
  },
];
export function getTopic(id?: string | null) {
  return topics.find((t) => t.id === id) ?? topics[0];
}
export type Attempt = {
  id: string;
  topicId: TopicId;
  exerciseId: string;
  answer: string;
  result: "correct" | "incorrect" | "inconclusive";
  feedback: string;
  hintCount: number;
  revealed: boolean;
  createdAt: string;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  topicId: TopicId;
  createdAt: string;
};
export type Preferences = {
  analytics: boolean;
  personalization: boolean;
  detail: "compact" | "detailed";
  mapView: "graph" | "tree";
};
export type DemoState = {
  version: 1;
  attempts: Attempt[];
  messages: Message[];
  saved: TopicId[];
  preferences: Preferences;
  dismissed: string[];
  insightCorrection: string;
};
export const emptyState: DemoState = {
  version: 1,
  attempts: [],
  messages: [],
  saved: [],
  preferences: {
    analytics: false,
    personalization: false,
    detail: "detailed",
    mapView: "graph",
  },
  dismissed: [],
  insightCorrection: "",
};
export const STORAGE_KEY = "iamt-demo-v1";
export function restoreState(raw: string | null): DemoState {
  if (!raw) return structuredClone(emptyState);
  try {
    const s = JSON.parse(raw) as DemoState;
    const validTopic = (id: unknown) => topics.some((t) => t.id === id);
    if (
      s.version !== 1 ||
      !Array.isArray(s.attempts) ||
      !Array.isArray(s.messages) ||
      !Array.isArray(s.saved) ||
      !Array.isArray(s.dismissed)
    )
      throw Error();
    if (
      !s.attempts.every(
        (a) =>
          typeof a.id === "string" &&
          validTopic(a.topicId) &&
          typeof a.exerciseId === "string" &&
          typeof a.answer === "string" &&
          ["correct", "incorrect", "inconclusive"].includes(a.result) &&
          typeof a.feedback === "string" &&
          Number.isInteger(a.hintCount) &&
          typeof a.revealed === "boolean" &&
          Number.isFinite(Date.parse(a.createdAt)),
      )
    )
      throw Error();
    if (
      !s.messages.every(
        (m) =>
          typeof m.id === "string" &&
          ["user", "assistant"].includes(m.role) &&
          typeof m.text === "string" &&
          validTopic(m.topicId) &&
          Number.isFinite(Date.parse(m.createdAt)),
      )
    )
      throw Error();
    if (
      !s.saved.every(validTopic) ||
      !s.dismissed.every((d) => typeof d === "string") ||
      typeof s.insightCorrection !== "string"
    )
      throw Error();
    if (
      !s.preferences ||
      typeof s.preferences.analytics !== "boolean" ||
      typeof s.preferences.personalization !== "boolean" ||
      !["compact", "detailed"].includes(s.preferences.detail) ||
      !["tree", "graph"].includes(s.preferences.mapView)
    )
      throw Error();
    return s;
  } catch {
    return structuredClone(emptyState);
  }
}
export function summarize(attempts: Attempt[]) {
  const assessed = attempts.filter(
    (a) => a.result !== "inconclusive" && !a.revealed,
  );
  return {
    total: attempts.length,
    assessed: assessed.length,
    correct: assessed.filter((a) => a.result === "correct").length,
    topics: new Set(attempts.map((a) => a.topicId)).size,
  };
}
export type Exercise = {
  id: string;
  prompt: string;
  math: string;
  hints: string[];
  solution: string;
  check: "roots" | "slope" | "none";
};
export function exerciseFor(id: TopicId): Exercise {
  if (id === "conics")
    return {
      id: "roots-v1",
      prompt:
        "楕円と x 軸の交点を調べましょう。y=0 のとき、x の値をすべて答えてください。",
      math: "x^2+4y^2=4",
      hints: [
        "まず y=0 を式に代入してみましょう。",
        "x²=4 を満たす実数は、正と負に1つずつあります。",
      ],
      solution:
        "y=0 を代入すると x²=4。したがって x=−2, 2 です。交点は (−2,0), (2,0) です。",
      check: "roots",
    };
  if (id === "calculus")
    return {
      id: "slope-v1",
      prompt: "f(x)=x² の x=3 における接線の傾きを答えてください。",
      math: "f'(3)=\\,?",
      hints: [
        "まず f(x)=x² を微分します。",
        "f′(x)=2x に、指定された x の値を代入します。",
      ],
      solution: "f′(x)=2x なので f′(3)=6 です。",
      check: "slope",
    };
  const prompts: Partial<Record<TopicId, string>> = {
    linear:
      "実対称行列の固有値がすべて正なら、その二次形式が正定値になる理由を説明してください。",
    galois:
      "Q(√2)/Q の自己同型が2つである理由を、√2 の満たす多項式から説明してください。",
    fields: "体の塔 K⊆F⊆L の基底を使って、次数の乗法性を説明してください。",
    symmetry:
      "正三角形の対称変換の集合が、合成について群になることを説明してください。",
  };
  return {
    id: `${id}-proof-v1`,
    prompt: prompts[id]!,
    math: getTopic(id).formula,
    hints: [
      "使う定義と前提条件を最初に書き出してみましょう。",
      "具体例から一般の場合に移るとき、どの性質を使うか確認しましょう。",
    ],
    solution:
      getTopic(id).definition +
      " これは議論の出発点となる解説です。完全な証明の自動評価はこのデモでは提供していません。",
    check: "none",
  };
}
export function evaluateAnswer(
  exercise: Exercise,
  answer: string,
): Pick<Attempt, "result" | "feedback"> {
  const normalized = answer
    .trim()
    .replaceAll("−", "-")
    .replaceAll("，", ",")
    .replaceAll("、", ",")
    .replaceAll("２", "2")
    .replaceAll("６", "6")
    .replaceAll("－", "-");
  if (exercise.check === "roots") {
    const stripped = normalized.replace(/^x\s*=\s*/i, "").replaceAll(/\s/g, "");
    if (["±2", "+/-2", "2,-2", "-2,2", "{-2,2}", "{2,-2}"].includes(stripped))
      return {
        result: "correct",
        feedback:
          "実数解 −2 と 2 の両方が含まれています。固定問題の解集合と一致しました（入力パターン照合）。",
      };
    if (/^[-+]?\d+(\.\d+)?(,[-+]?\d+(\.\d+)?)*$/.test(stripped))
      return {
        result: "incorrect",
        feedback:
          "解集合が一致しません。負の値も候補に含め、代入して確かめましょう。",
      };
  }
  if (exercise.check === "slope" && /^[-+]?\d+(\.\d+)?$/.test(normalized))
    return Number(normalized) === 6
      ? {
          result: "correct",
          feedback:
            "接線の傾きは6。固定問題の数値解と一致しました。導出過程は評価していません。",
        }
      : {
          result: "incorrect",
          feedback: "数値解が一致しません。微分してから x=3 を代入しましょう。",
        };
  return {
    result: "inconclusive",
    feedback:
      "回答を保存しました。この形式・証明の内容はデモでは自動判定できません。Tutorで考え方を整理できます。",
  };
}
