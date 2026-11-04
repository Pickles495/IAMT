import katex from "katex";
export function MathText({
  tex,
  display = true,
}: {
  tex: string;
  display?: boolean;
}) {
  // KaTeX is the only HTML source; user/model HTML is never injected.
  const html = katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    trust: false,
    strict: "warn",
    maxExpand: 100,
    maxSize: 15,
    output: "htmlAndMathml",
  });
  return (
    <span
      className={display ? "math-display" : "math-inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
