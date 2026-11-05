"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  topics,
  exerciseFor,
  evaluateAnswer,
  type TopicId,
} from "@/lib/domain";
import { useDemo } from "./demo-provider";
import { useLocale } from "./locale";
import { definitions } from "@/lib/topic-english";
import { MathText } from "./math";
export function ExerciseList() {
  const { t } = useLocale();
  const query = useSearchParams();
  useEffect(() => {
    if (query.get("topic"))
      document
        .getElementById("problem-" + query.get("topic"))
        ?.scrollIntoView({ block: "start" });
  }, [query]);
  return (
    <>
      <div className="v4-toolbar">
        <h1>{t("演習", "Practice")}</h1>
        <Link href="/progress">{t("演習記録", "Attempt history")}</Link>
      </div>
      <p>
        {t(
          "各問題に解答を入力してください。数式はLaTeXで入力し、プレビューできます。",
          "Enter an answer for each problem. Use LaTeX to preview mathematical notation.",
        )}
      </p>
      <div className="v4-exercise-list">
        {topics.map((topic, i) => (
          <Problem key={topic.id} id={topic.id} index={i} />
        ))}
      </div>
    </>
  );
}
function Problem({ id, index }: { id: TopicId; index: number }) {
  const { t, en } = useLocale();
  const { setState } = useDemo();
  const ex = exerciseFor(id);
  const editor = useRef<HTMLTextAreaElement>(null);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("iamt-answer-" + id);
      if (raw) {
        let draft;
        try {
          draft = JSON.parse(raw);
        } catch {
          draft = { answer: raw };
        }
        if (typeof draft?.answer === "string") setAnswer(draft.answer);
        if (Number.isInteger(draft?.hint) && draft.hint >= 0)
          setHint(Math.min(ex.hints.length, draft.hint));
        setRevealed(draft?.revealed === true);
      }
    } catch {
      setStorageError(true);
    }
    setReady(true);
  }, [id]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "iamt-answer-" + id,
          JSON.stringify({ version: 1, answer, hint, revealed }),
        );
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
  }, [answer, hint, revealed, id, ready]);
  const english: Record<TopicId, string> = {
    conics: "Find all real x values where the ellipse intersects y = 0.",
    calculus: "For f(x) = x², find the slope of the tangent at x = 3.",
    linear:
      "Explain why a real symmetric matrix with positive eigenvalues has a positive definite quadratic form.",
    galois: "Explain why Q(√2)/Q has exactly two automorphisms.",
    fields: "Use bases to explain the tower law for finite field extensions.",
    symmetry:
      "Explain why the symmetries of an equilateral triangle form a group.",
  };
  function submit() {
    const evaluation = evaluateAnswer(ex, answer);
    setState((s) => ({
      ...s,
      attempts: [
        ...s.attempts,
        {
          id: crypto.randomUUID(),
          topicId: id,
          exerciseId: ex.id,
          answer,
          ...evaluation,
          hintCount: hint,
          revealed,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setResult(evaluation.result);
  }
  return (
    <article id={`problem-${id}`} className="panel content-pad">
      {storageError && (
        <p role="alert">
          {t("下書きを保存できません。", "Could not save this draft.")}
        </p>
      )}
      <h2>
        {index + 1}. {en ? topics[index].english : topics[index].label}
      </h2>
      <p>{en ? english[id] : ex.prompt}</p>
      <MathText tex={ex.math} />
      <label>
        {t("解答（テキスト／LaTeX）", "Answer (text / LaTeX)")}
        <textarea
          ref={editor}
          aria-label={`${t("解答", "Answer")} ${index + 1}`}
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setResult("");
          }}
          maxLength={10000}
        />
      </label>
      <div className="button-row">
        {["\\frac{}{}", "\\sqrt{}", "x^{2}", "\\pm", "\\int"].map((v) => (
          <button
            key={v}
            onClick={() => {
              const start = editor.current?.selectionStart ?? answer.length;
              const end = editor.current?.selectionEnd ?? start;
              setAnswer(answer.slice(0, start) + v + answer.slice(end));
              requestAnimationFrame(() => {
                editor.current?.focus();
                editor.current?.setSelectionRange(
                  start + v.length,
                  start + v.length,
                );
              });
              setResult("");
            }}
          >
            {v}
          </button>
        ))}
      </div>
      {answer && (
        <details>
          <summary>{t("数式プレビュー", "Math preview")}</summary>
          <MathText tex={answer} />
        </details>
      )}
      <div className="button-row">
        <button
          className="button primary"
          disabled={!answer.trim() || !!result}
          onClick={submit}
        >
          {t("提出", "Submit")}
        </button>
        <button
          className="button secondary"
          disabled={hint >= ex.hints.length}
          onClick={() => setHint((n) => n + 1)}
        >
          {t("ヒント", "Hint")} ({hint}/{ex.hints.length})
        </button>
        <Link href={`/learn?topic=${id}`}>Tutor</Link>
      </div>
      {hint > 0 && (
        <p>
          {en
            ? id === "conics"
              ? hint === 1
                ? "Substitute y = 0."
                : "Substitute y = 0. Consider both signs."
              : id === "calculus"
                ? hint === 1
                  ? "Differentiate f(x) first."
                  : "Substitute x = 3 into f′(x)."
                : "Start with the definitions and identify the assumptions."
            : ex.hints.slice(0, hint).join(" ")}
        </p>
      )}
      <details
        onToggle={(e) => {
          if (e.currentTarget.open) setRevealed(true);
        }}
      >
        <summary>{t("解答例", "Solution reference")}</summary>
        <p>
          {en
            ? id === "conics"
              ? "x = −2, 2."
              : id === "calculus"
                ? "f′(3) = 6."
                : definitions[id] +
                  " This is a starting point for a proof, not a complete solution. Automated proof assessment is not connected."
            : ex.solution}
        </p>
      </details>
      {result && (
        <p role="status">
          {t("記録しました", "Recorded")}:{" "}
          {result === "correct"
            ? t("固定解と一致", "Matches reference")
            : result === "incorrect"
              ? t("要再検討", "Review answer")
              : t("自動判定なし", "Not assessed")}
        </p>
      )}
      <small>
        {t(
          "AI採点は未接続です。自由記述・LaTeXの一般的な同値性は判定しません。",
          "AI grading is not connected. Free text and general LaTeX equivalence are not assessed.",
        )}
      </small>
    </article>
  );
}
