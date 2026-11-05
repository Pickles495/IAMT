export const embeddingSteps = [
  {
    role: "theorem",
    ja: "有理数を固定する ℚ(√2) から ℂ への埋め込みは、ちょうど二つある。",
    en: "There are exactly two embeddings of ℚ(√2) into ℂ that fix the rationals.",
    tex: String.raw`\sigma:\mathbb Q(\sqrt2)\hookrightarrow\mathbb C`,
  },
  {
    role: "derivation",
    ja: "埋め込みは積を保ち、2 を固定する。したがって √2 の像は次の方程式の根に限られる。",
    en: "An embedding preserves multiplication and fixes 2. The image of √2 must therefore be a root of this equation.",
    tex: String.raw`\sigma(\sqrt2)^2=\sigma(2)=2`,
  },
  {
    role: "proof",
    ja: "各元は a+b√2 と一意に書ける。どちらの符号でも右の対応は和と積を保ち、逆写像を持つ。両方の候補が実現する。",
    en: "Each element has a unique expression a+b√2. Each sign gives a map preserving sums and products, with an inverse. Both candidates are realized.",
    tex: String.raw`a+b\sqrt2\longmapsto a\pm b\sqrt2\quad(a,b\in\mathbb Q)`,
  },
] as const;
