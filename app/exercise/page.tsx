"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lightbulb, RotateCcw, CheckCircle2 } from "lucide-react";
import {
  getTopic,
  topics,
  exerciseFor,
  evaluateAnswer,
  type TopicId,
  type Attempt,
} from "@/lib/domain";
import { useDemo } from "@/components/demo-provider";
import { MathText } from "@/components/math";
export default function Page() {
  return (
    <Suspense>
      <ExercisePage />
    </Suspense>
  );
}
function ExercisePage() {
  const query = useSearchParams();
  const { state, setState } = useDemo();
  const [topicId, setTopicId] = useState<TopicId>(
    getTopic(query.get("topic")).id,
  );
  const [answer, setAnswer] = useState("");
  const [hints, setHints] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [evaluation, setEvaluation] = useState<Attempt | null>(null);
  const exercise = exerciseFor(topicId);
  const topic = getTopic(topicId);
  useEffect(() => {
    setTopicId(getTopic(query.get("topic")).id);
  }, [query]);
  useEffect(() => {
    setAnswer("");
    setHints(0);
    setRevealed(false);
    setEvaluation(null);
  }, [topicId]);
  function submit() {
    if (!answer.trim() || evaluation) return;
    const attempt: Attempt = {
      id: crypto.randomUUID(),
      topicId,
      exerciseId: exercise.id,
      answer,
      ...evaluateAnswer(exercise, answer),
      hintCount: hints,
      revealed,
      createdAt: new Date().toISOString(),
    };
    setEvaluation(attempt);
    setState((s) => ({ ...s, attempts: [...s.attempts, attempt] }));
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">THINK IT THROUGH</div>
          <h1>手を動かす。理解が動き出す。</h1>
          <p>ヒントも、やり直しも、あなたのペースで。</p>
        </div>
        <Link href="/progress" className="button secondary">
          演習記録を見る <ArrowRight size={16} />
        </Link>
      </div>
      <div className="two-column">
        <section className="panel exercise-panel">
          <div className="panel-header">
            <span className="section-label">PRACTICE / 固定サンプル</span>
            <span className="pill">
              {exercise.check === "none" ? "証明・説明" : "計算"}
            </span>
          </div>
          <div className="content-pad">
            <label className="field-label">
              トピック
              <select
                aria-label="演習トピック"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value as TopicId)}
              >
                {topics.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <h2>{topic.label}</h2>
            <p>{exercise.prompt}</p>
            <div className="formula-card">
              <MathText tex={exercise.math} />
            </div>
            <label className="field-label" htmlFor="answer">
              あなたの解答・考え方
            </label>
            <textarea
              id="answer"
              rows={6}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={
                exercise.check === "roots"
                  ? "例：-2, 2（解のみの入力も可）"
                  : "式や考え方を自由に記入してください"
              }
              maxLength={10000}
              disabled={!!evaluation}
            />
            <div className="button-row">
              <button
                className="button primary"
                disabled={!answer.trim() || !!evaluation}
                onClick={submit}
              >
                <CheckCircle2 size={16} />
                解答を記録・確認
              </button>
              {evaluation && (
                <button
                  className="button secondary"
                  onClick={() => {
                    setEvaluation(null);
                  }}
                >
                  <RotateCcw size={16} /> 解答を修正
                </button>
              )}
            </div>
            {evaluation && (
              <div className={`evaluation ${evaluation.result}`} role="status">
                <strong>
                  {evaluation.result === "correct"
                    ? "固定解と一致"
                    : evaluation.result === "incorrect"
                      ? "再検討のヒント"
                      : "自動判定なし"}
                </strong>
                <p>{evaluation.feedback}</p>
                {revealed && (
                  <small>
                    解答例を表示した後の試行です。正答集計から除外します。
                  </small>
                )}
              </div>
            )}
            <p className="fine-print">
              計算問題は限られた入力形式だけを照合します。証明や途中式は自動採点しません。問題生成・AI評価は未接続です。
            </p>
          </div>
        </section>
        <aside className="stack">
          <section className="panel content-pad">
            <div className="eyebrow">A LITTLE NUDGE</div>
            <h2>必要な分だけ、ヒント。</h2>
            <p className="muted">答えを見る前に、考える足場を。</p>
            {exercise.hints.slice(0, hints).map((h, i) => (
              <div className="hint" key={h}>
                <span>HINT {i + 1}</span>
                <p>{h}</p>
              </div>
            ))}
            <button
              className="button secondary full"
              disabled={hints >= exercise.hints.length}
              onClick={() => setHints((n) => n + 1)}
            >
              <Lightbulb size={16} />
              {hints >= exercise.hints.length
                ? "すべてのヒントを表示済み"
                : "次のヒントを見る"}
            </button>
            <details
              className="solution"
              open={revealed}
              onToggle={(e) => {
                if (e.currentTarget.open) setRevealed(true);
              }}
            >
              <summary>解答例を表示する</summary>
              <p>{exercise.solution}</p>
            </details>
          </section>
          <section className="soft-card">
            <span className="eyebrow">TAKE ANOTHER PATH</span>
            <h3>考え方を整理したくなったら。</h3>
            <p>演習記録は残したまま、同じトピックをTutorで開けます。</p>
            <Link className="text-link" href={`/learn?topic=${topicId}`}>
              Tutorで考える <ArrowRight size={15} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
