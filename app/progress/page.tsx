"use client";
import { useLocale } from "@/components/locale";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Check, ChevronDown, X } from "lucide-react";
import { getTopic, summarize } from "@/lib/domain";
import { useDemo } from "@/components/demo-provider";
const suggestions = [
  {
    id: "reinforcement",
    kind: "REINFORCEMENT / 確認",
    title: "定義と条件",
    text: "固定サンプル：定義と前提条件をBoardで見直す。",
    href: "/learn?topic=conics",
  },
  {
    id: "connection",
    kind: "CONNECTION / 接続",
    title: "二次曲線と固有値",
    text: "固定サンプル：二次曲線と固有値の関係を地図で見る。",
    href: "/knowledge?topic=linear",
  },
  {
    id: "extension",
    kind: "EXTENSION / 発展",
    title: "体の拡大",
    text: "固定サンプル：体の拡大という視点に進んでみる。",
    href: "/learn?topic=fields",
  },
  {
    id: "challenge",
    kind: "CHALLENGE / 挑戦",
    title: "対称性の演習",
    text: "固定サンプル：証明・説明の演習を試す。",
    href: "/exercise?topic=symmetry",
  },
];
export default function Progress() {
  const { t: tx, en } = useLocale();
  const { state, setState } = useDemo();
  const metrics = summarize(state.attempts);
  const [sample, setSample] = useState(false);
  const [correction, setCorrection] = useState(state.insightCorrection);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A MOMENT TO REFLECT</div>
          <h1>{tx("学習記録", "Learning progress")}</h1>
          <p>
            {tx(
              "演習履歴と保存したトピック",
              "Attempt history and saved topics",
            )}
          </p>
        </div>
        <span className="pill">
          {tx("このブラウザの記録", "Records in this browser")}
        </span>
      </div>
      <div className="metric-grid">
        <Metric
          label={tx("記録された試行", "Recorded attempts")}
          value={String(metrics.total)}
          note={tx(
            "修正後の再提出も1件として記録",
            "Each resubmission is a separate attempt",
          )}
        />
        <Metric
          label={tx("固定解との一致", "Reference matches")}
          value={`${metrics.correct} / ${metrics.assessed}`}
          note={tx(
            "判定可能・解答例未表示の試行のみ",
            "Assessable attempts made before viewing the solution",
          )}
        />
        <Metric
          label={tx("演習したトピック", "Topics practiced")}
          value={String(metrics.topics)}
          note={tx(
            "演習記録に含まれるトピック数",
            "Distinct topics in attempt history",
          )}
        />
        <Metric
          label={tx("保存したトピック", "Saved topics")}
          value={String(state.saved.length)}
          note={tx("興味のある概念のブックマーク", "Bookmarked concepts")}
        />
      </div>
      <section className="panel">
        <div className="panel-header">
          <h2>{tx("演習の記録", "Attempt history")}</h2>
          <span className="subtle-tag">
            {tx("FACT / 観測された記録", "FACT / Recorded activity")}
          </span>
        </div>
        {state.attempts.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={28} />
            <h3>{tx("まだ、演習の記録はありません。", "No attempts yet.")}</h3>
            <p>
              {tx(
                "最初の試行から、あなた自身の記録がここに残ります。",
                "Submitted answers appear here.",
              )}
            </p>
            <Link href="/exercise" className="button primary">
              {tx("演習してみる", "Practice")}
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="attempt-list">
            {[...state.attempts].reverse().map((a, i) => (
              <details key={a.id} className="attempt-row" id={a.id}>
                <summary>
                  <span className="attempt-index">
                    {String(state.attempts.length - i).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>
                      {en
                        ? getTopic(a.topicId).english
                        : getTopic(a.topicId).label}
                    </strong>
                    <small>
                      {new Date(a.createdAt).toLocaleString(
                        en ? "en-US" : "ja-JP",
                      )}
                    </small>
                  </span>
                  <span className={`result-tag ${a.result}`}>
                    {a.result === "correct"
                      ? tx("固定解と一致", "Matches reference")
                      : a.result === "incorrect"
                        ? tx("要再検討", "Review answer")
                        : tx("判定なし", "Not assessed")}
                  </span>
                  <ChevronDown size={16} />
                </summary>
                <div className="attempt-body">
                  <h4>{tx("提出した解答", "Submitted answer")}</h4>
                  <p className="preserve">{a.answer}</p>
                  <p>
                    {en
                      ? a.result === "inconclusive"
                        ? "No automatic assessment. Review your reasoning."
                        : "Limited fixed-answer comparison; not AI grading."
                      : a.feedback}
                  </p>
                  <small>
                    {tx("ヒント", "Hints")}
                    {a.hintCount} · {tx("解答例", "Solution reference")}
                    {a.revealed
                      ? tx("表示後", "Viewed")
                      : tx("未表示", "Not viewed")}
                  </small>
                  <Link
                    className="text-link"
                    href={`/learn?topic=${a.topicId}`}
                  >
                    {tx("この概念をTutorで開く", "Tutor")}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
      <div className="two-column progress-lower">
        <section className="panel content-pad">
          <span className="eyebrow">LEARNING PATTERNS</span>
          <h2>{tx("学習傾向", "Learning patterns")}</h2>
          <p>
            {tx(
              "現在はAI分析を行っていません。記録数や正答率から、理解度や能力を判定しません。",
              "AI analysis is not connected. Counts and reference matches do not measure understanding or ability.",
            )}
          </p>
          <p className="muted">
            {tx("会話分析の設定：", "Conversation analysis: ")}
            {state.preferences.analytics
              ? tx("許可済み（分析は未接続）", "Allowed (not connected)")
              : tx("オフ", "Off")}
            。
            <Link className="inline-link" href="/settings">
              {tx("設定を変更", "Settings")}
            </Link>
          </p>
          <button
            className="button secondary"
            onClick={() => setSample((v) => !v)}
            aria-expanded={sample}
          >
            {sample
              ? tx("表示例を閉じる", "Close example")
              : tx("AIフィードバックの表示例を見る", "View sample AI feedback")}
          </button>
          {sample && (
            <div className="sample-insight">
              <span className="pill amber">
                {tx(
                  "架空の例 · あなたの分析ではありません",
                  "Fictional example · Not an analysis of you",
                )}
              </span>
              <h3>
                {tx(
                  "前提条件への関心があるかもしれません。",
                  "You may be interested in assumptions.",
                )}
              </h3>
              <p>
                <strong>{tx("観測の例：", "Sample observation: ")}</strong>
                {tx(
                  "定理の条件について、繰り返し質問している。",
                  "Repeated questions about theorem assumptions.",
                )}
              </p>
              <p>
                <strong>{tx("解釈の例：", "Sample interpretation: ")}</strong>
                {tx(
                  "今の学習では、成立条件に注目している可能性がある。",
                  "The learner may be focusing on the conditions under which a result holds.",
                )}
              </p>
              <details>
                <summary>
                  {tx("架空の根拠を表示", "Show fictional evidence")}
                </summary>
                <blockquote>
                  {tx(
                    "「この定理で有限性はどこに使うの？」",
                    "“Where is finiteness used in this theorem?”",
                  )}
                  <br />
                  {tx(
                    "「この条件を外すと反例はある？」",
                    "“Is there a counterexample without this condition?”",
                  )}
                </blockquote>
                <p className="fine-print">
                  {tx(
                    "表示設計用に作成した引用。実際の会話ではありません。",
                    "Quotes authored for this demo, not real conversations.",
                  )}
                </p>
              </details>
              <p className="fine-print">
                {tx(
                  "根拠が少ない場合、この解釈は変わります。現在は実際の学習傾向を推論していません。",
                  "Limited evidence can change this interpretation. No actual learning patterns are being inferred.",
                )}
              </p>
              <label className="field-label">
                {tx(
                  "解釈を訂正する（操作デモ）",
                  "Correct the interpretation (demo)",
                )}
                <textarea
                  value={correction}
                  onChange={(e) => {
                    setCorrection(e.target.value);
                    setSaved(false);
                  }}
                  rows={2}
                  maxLength={2000}
                  placeholder={tx(
                    "あなたの捉え方を書いてください",
                    "Enter your interpretation",
                  )}
                />
              </label>
              <button
                className="button secondary"
                onClick={() => {
                  setState((s) => ({ ...s, insightCorrection: correction }));
                  setSaved(true);
                }}
              >
                {saved ? <Check size={15} /> : null}
                {saved
                  ? tx("訂正を保存しました", "Correction saved")
                  : tx("訂正を保存", "Save correction")}
              </button>
              {state.insightCorrection && (
                <p className="correction">
                  {tx("訂正後の表示（自己申告）：", "Your correction: ")}
                  {state.insightCorrection}
                </p>
              )}
            </div>
          )}
        </section>
        <section className="soft-card">
          <span className="eyebrow">YOUR EXPLORATION</span>
          <h2>{tx("保存したトピック", "Saved topics")}</h2>
          {state.saved.length ? (
            state.saved.map((id) => (
              <Link
                key={id}
                className="saved-topic"
                href={`/knowledge?topic=${id}`}
              >
                {en ? getTopic(id).english : getTopic(id).label}
                <ArrowRight size={16} />
              </Link>
            ))
          ) : (
            <p className="muted">
              {tx(
                "Knowledge Mapで保存したトピックがここに表示されます。",
                "Topics saved in Knowledge Map appear here.",
              )}
            </p>
          )}
          <Link href="/knowledge" className="text-link">
            Knowledge Map <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="explore-heading">
        <h2>{tx("関連ページ", "Related pages")}</h2>
        <span>
          {tx(
            "固定の提案例 · 選ぶことも、閉じることも自由。",
            "Sample links · Optional and dismissible",
          )}
        </span>
      </div>
      <div className="recommendation-grid">
        {suggestions
          .filter((s) => !state.dismissed.includes(s.id))
          .map((s) => (
            <article className="explore-card" key={s.id}>
              <div className="row spread">
                <span className="card-index">
                  {en ? s.kind.split(" / ")[0] : s.kind}
                </span>
                <button
                  className="icon-button"
                  aria-label={
                    en
                      ? `Dismiss ${s.id}`
                      : `${en ? { reinforcement: "Definitions", connection: "Conics and eigenvalues", extension: "Field extensions", challenge: "Symmetry practice" }[s.id] : s.title}の提案を閉じる`
                  }
                  onClick={() =>
                    setState((v) => ({
                      ...v,
                      dismissed: [...v.dismissed, s.id],
                    }))
                  }
                >
                  <X size={15} />
                </button>
              </div>
              <h3>
                {en
                  ? {
                      reinforcement: "Definitions",
                      connection: "Conics and eigenvalues",
                      extension: "Field extensions",
                      challenge: "Symmetry practice",
                    }[s.id]
                  : s.title}
              </h3>
              <p>{en ? "Sample topic link" : s.text}</p>
              <details className="why">
                <summary>{tx("提案の理由", "About this link")}</summary>
                <p>
                  {tx(
                    "4種類の探索方法を体験するための固定提案です。個人の記録に基づく推奨ではありません。",
                    "A fixed example, not a recommendation based on your records.",
                  )}
                </p>
              </details>
              <Link className="text-link" href={s.href}>
                {tx("試してみる", "Open")}
                <ArrowRight size={15} />
              </Link>
            </article>
          ))}
      </div>
      {state.dismissed.length > 0 && (
        <button
          className="button ghost"
          onClick={() => setState((s) => ({ ...s, dismissed: [] }))}
        >
          {tx("閉じた固定提案を再表示", "Restore dismissed links")}
        </button>
      )}
    </>
  );
}
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
