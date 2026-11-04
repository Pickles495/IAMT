"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Check, ChevronDown, X } from "lucide-react";
import { getTopic, summarize } from "@/lib/domain";
import { useDemo } from "@/components/demo-provider";
const suggestions = [
  {
    id: "reinforcement",
    kind: "REINFORCEMENT / 確認",
    title: "条件から、もう一度。",
    text: "固定サンプル：定義と前提条件をBoardで見直す。",
    href: "/learn?topic=conics",
  },
  {
    id: "connection",
    kind: "CONNECTION / 接続",
    title: "式と図形をつなぐ。",
    text: "固定サンプル：二次曲線と固有値の関係を地図で見る。",
    href: "/knowledge?topic=linear",
  },
  {
    id: "extension",
    kind: "EXTENSION / 発展",
    title: "数の世界を広げる。",
    text: "固定サンプル：体の拡大という視点に進んでみる。",
    href: "/learn?topic=fields",
  },
  {
    id: "challenge",
    kind: "CHALLENGE / 挑戦",
    title: "対称性を、説明する。",
    text: "固定サンプル：証明・説明の演習を試す。",
    href: "/exercise?topic=symmetry",
  },
];
export default function Progress() {
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
          <h1>歩んだ道から、次の問いへ。</h1>
          <p>記録を振り返る。解釈は問い直す。次の一歩は自由に選ぶ。</p>
        </div>
        <span className="pill">このブラウザの記録</span>
      </div>
      <div className="metric-grid">
        <Metric
          label="記録された試行"
          value={String(metrics.total)}
          note="修正後の再提出も1件として記録"
        />
        <Metric
          label="固定解との一致"
          value={`${metrics.correct} / ${metrics.assessed}`}
          note="判定可能・解答例未表示の試行のみ"
        />
        <Metric
          label="演習したトピック"
          value={String(metrics.topics)}
          note="演習記録に含まれるトピック数"
        />
        <Metric
          label="保存したトピック"
          value={String(state.saved.length)}
          note="興味のある概念のブックマーク"
        />
      </div>
      <section className="panel">
        <div className="panel-header">
          <h2>演習の記録</h2>
          <span className="subtle-tag">FACT / 観測された記録</span>
        </div>
        {state.attempts.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={28} />
            <h3>まだ、演習の記録はありません。</h3>
            <p>最初の試行から、あなた自身の記録がここに残ります。</p>
            <Link href="/exercise" className="button primary">
              演習してみる <ArrowRight size={16} />
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
                    <strong>{getTopic(a.topicId).label}</strong>
                    <small>
                      {new Date(a.createdAt).toLocaleString("ja-JP")}
                    </small>
                  </span>
                  <span className={`result-tag ${a.result}`}>
                    {a.result === "correct"
                      ? "固定解と一致"
                      : a.result === "incorrect"
                        ? "要再検討"
                        : "判定なし"}
                  </span>
                  <ChevronDown size={16} />
                </summary>
                <div className="attempt-body">
                  <h4>提出した解答</h4>
                  <p className="preserve">{a.answer}</p>
                  <p>{a.feedback}</p>
                  <small>
                    ヒント {a.hintCount}件 · 解答例{" "}
                    {a.revealed ? "表示後" : "未表示"}
                  </small>
                  <Link
                    className="text-link"
                    href={`/learn?topic=${a.topicId}`}
                  >
                    この概念をTutorで開く <ArrowRight size={14} />
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
          <h2>記録と解釈を、分けて考える。</h2>
          <p>
            現在はAI分析を行っていません。記録数や正答率から、理解度や能力を判定しません。
          </p>
          <p className="muted">
            会話分析の設定：
            {state.preferences.analytics ? "許可済み（分析は未接続）" : "オフ"}
            。
            <Link className="inline-link" href="/settings">
              設定を変更
            </Link>
          </p>
          <button
            className="button secondary"
            onClick={() => setSample((v) => !v)}
            aria-expanded={sample}
          >
            {sample ? "表示例を閉じる" : "AIフィードバックの表示例を見る"}
          </button>
          {sample && (
            <div className="sample-insight">
              <span className="pill amber">
                架空の例 · あなたの分析ではありません
              </span>
              <h3>前提条件への関心があるかもしれません。</h3>
              <p>
                <strong>観測の例：</strong>
                定理の条件について、繰り返し質問している。
              </p>
              <p>
                <strong>解釈の例：</strong>
                今の学習では、成立条件に注目している可能性がある。
              </p>
              <details>
                <summary>架空の根拠を表示</summary>
                <blockquote>
                  「この定理で有限性はどこに使うの？」
                  <br />
                  「この条件を外すと反例はある？」
                </blockquote>
                <p className="fine-print">
                  表示設計用に作成した引用。実際の会話ではありません。
                </p>
              </details>
              <p className="fine-print">
                根拠が少ない場合、この解釈は変わります。現在は実際の学習傾向を推論していません。
              </p>
              <label className="field-label">
                解釈を訂正する（操作デモ）
                <textarea
                  value={correction}
                  onChange={(e) => {
                    setCorrection(e.target.value);
                    setSaved(false);
                  }}
                  rows={2}
                  maxLength={2000}
                  placeholder="あなたの捉え方を書いてください"
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
                {saved ? "訂正を保存しました" : "訂正を保存"}
              </button>
              {state.insightCorrection && (
                <p className="correction">
                  訂正後の表示（自己申告）：{state.insightCorrection}
                </p>
              )}
            </div>
          )}
        </section>
        <section className="soft-card">
          <span className="eyebrow">YOUR EXPLORATION</span>
          <h2>気になる概念を、手元に。</h2>
          {state.saved.length ? (
            state.saved.map((id) => (
              <Link
                key={id}
                className="saved-topic"
                href={`/knowledge?topic=${id}`}
              >
                {getTopic(id).label}
                <ArrowRight size={16} />
              </Link>
            ))
          ) : (
            <p className="muted">
              Knowledge MapやBoardからトピックを保存すると、ここに表示されます。
            </p>
          )}
          <Link href="/knowledge" className="text-link">
            地図をひらく <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="explore-heading">
        <h2>ここから、どこへ向かう？</h2>
        <span>固定の提案例 · 選ぶことも、閉じることも自由。</span>
      </div>
      <div className="recommendation-grid">
        {suggestions
          .filter((s) => !state.dismissed.includes(s.id))
          .map((s) => (
            <article className="explore-card" key={s.id}>
              <div className="row spread">
                <span className="card-index">{s.kind}</span>
                <button
                  className="icon-button"
                  aria-label={`${s.title}の提案を閉じる`}
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
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <details className="why">
                <summary>提案の理由</summary>
                <p>
                  4種類の探索方法を体験するための固定提案です。個人の記録に基づく推奨ではありません。
                </p>
              </details>
              <Link className="text-link" href={s.href}>
                試してみる <ArrowRight size={15} />
              </Link>
            </article>
          ))}
      </div>
      {state.dismissed.length > 0 && (
        <button
          className="button ghost"
          onClick={() => setState((s) => ({ ...s, dismissed: [] }))}
        >
          閉じた固定提案を再表示
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
