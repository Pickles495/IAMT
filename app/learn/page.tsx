"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  Bookmark,
  Check,
  ChevronDown,
  Lightbulb,
  MessageCircle,
  Network,
  Plus,
  Sparkles,
} from "lucide-react";
import { getTopic, topics, type TopicId } from "@/lib/domain";
import { useDemo } from "@/components/demo-provider";
import { MathText } from "@/components/math";
import { demoTutor } from "@/ai/gateway";
export default function Page() {
  return (
    <Suspense>
      <Learn />
    </Suspense>
  );
}
function Learn() {
  const query = useSearchParams();
  const { state, setState } = useDemo();
  const [topicId, setTopicId] = useState<TopicId>(
    getTopic(query.get("topic")).id,
  );
  const topic = getTopic(topicId);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setTopicId(getTopic(query.get("topic")).id);
  }, [query]);
  const messages = state.messages.filter((m) => m.topicId === topicId);
  useEffect(() => {
    if (messages.length) chatEnd.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);
  async function send(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setInput("");
    const id = crypto.randomUUID();
    const selected = topicId;
    setState((s) => ({
      ...s,
      messages: [
        ...s.messages,
        {
          id,
          role: "user",
          text: text.trim(),
          topicId: selected,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    try {
      const response = await demoTutor.respond({ text, topicId: selected });
      setState((s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: response.text,
            topicId: selected,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    } finally {
      setBusy(false);
    }
  }
  const saved = state.saved.includes(topicId);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A SPACE FOR YOUR CURIOSITY</div>
          <h1>数学を、あなたの問いから。</h1>
          <p>考える、つながる、試してみる。探究の進み方は、あなたが選ぶ。</p>
        </div>
        <Link href="/knowledge" className="button secondary">
          <Plus size={16} /> トピックを探す
        </Link>
      </div>
      <div className="topic-strip">
        <span className="tiny-label">探索中のトピック</span>
        <label className="topic-select">
          <select
            aria-label="学習トピック"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value as TopicId)}
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown size={15} />
        </label>
        <span className="pill">{topic.category}</span>
        <Link href={`/knowledge?topic=${topicId}`} className="text-link">
          <Network size={15} /> マップで見る
        </Link>
      </div>
      <div className="learning-grid">
        <section className="board panel">
          <div className="panel-header">
            <span className="section-label">
              <span className="square-icon">▧</span> BOARD
            </span>
            <div className="row">
              <span className="subtle-tag">手作業で作成した解説</span>
              <button
                className={`icon-button ${saved ? "selected" : ""}`}
                aria-label={saved ? "トピックの保存を解除" : "トピックを保存"}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    saved: saved
                      ? s.saved.filter((id) => id !== topicId)
                      : [...s.saved, topicId],
                  }))
                }
              >
                {saved ? <Check size={17} /> : <Bookmark size={17} />}
              </button>
            </div>
          </div>
          <div className="board-body">
            <div className="chapter-label">
              01 <span>CONCEPT EXPLORATION</span>
            </div>
            <h2>{topic.label}</h2>
            <p className="board-subtitle">{topic.description}</p>
            <div className="formula-card">
              <span>出発点となる式</span>
              <MathText tex={topic.formula} />
            </div>
            {topicId === "conics" && (
              <div className="conic-figure">
                <svg
                  viewBox="0 0 440 180"
                  role="img"
                  aria-label="x方向の半径2、y方向の半径1の楕円の概念図"
                >
                  <defs>
                    <pattern
                      id="grid"
                      width="22"
                      height="22"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 22 0 L 0 0 0 22"
                        fill="none"
                        stroke="#e8ece8"
                        strokeWidth=".7"
                      />
                    </pattern>
                  </defs>
                  <rect width="440" height="180" fill="url(#grid)" />
                  <line x1="40" y1="90" x2="398" y2="90" stroke="#a5b7ad" />
                  <line x1="220" y1="10" x2="220" y2="170" stroke="#a5b7ad" />
                  <ellipse
                    cx="220"
                    cy="90"
                    rx="124"
                    ry="62"
                    fill="#dff0e6"
                    fillOpacity=".55"
                    stroke="#2c6b53"
                    strokeWidth="2.2"
                  />
                  <circle cx="344" cy="90" r="4" fill="#2c6b53" />
                  <circle cx="220" cy="28" r="4" fill="#2c6b53" />
                  <text x="350" y="110">
                    (2, 0)
                  </text>
                  <text x="230" y="25">
                    (0, 1)
                  </text>
                  <text x="401" y="95">
                    x
                  </text>
                  <text x="207" y="14">
                    y
                  </text>
                </svg>
                <span>例：x² + 4y² = 4</span>
              </div>
            )}
            <div className="board-section">
              <span className="step-number">1</span>
              <div>
                <h3>定義と前提を確かめる</h3>
                <p>{topic.definition}</p>
              </div>
            </div>
            {state.preferences.detail === "detailed" && (
              <div className="board-section">
                <span className="step-number">2</span>
                <div>
                  <h3>具体例から考える</h3>
                  <p>{topic.example}</p>
                </div>
              </div>
            )}
            <button
              className="expand-button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <Plus size={15} />
              {expanded ? "問いを閉じる" : "もう一歩、考えてみる"}
            </button>
            {expanded && (
              <div className="callout">
                <Lightbulb size={19} />
                <p>{topic.question}</p>
              </div>
            )}
            <div className="board-actions">
              <Link
                className="button primary"
                href={`/exercise?topic=${topicId}`}
              >
                この概念を演習する <ArrowRight size={16} />
              </Link>
              <button
                className="button secondary"
                onClick={() => send("具体例をもう一度見せて")}
              >
                例をTutorで確認
              </button>
            </div>
          </div>
          <div className="board-caption">
            このBoardは固定のサンプルです。AIによる生成・形式的な証明検証は行っていません。
          </div>
        </section>
        <section className="tutor panel">
          <div className="panel-header">
            <span className="section-label">
              <MessageCircle size={17} /> TUTOR
            </span>
            <span className="pill green">デモ</span>
          </div>
          <div className="tutor-scroll" aria-live="polite">
            <div className="assistant-intro">
              <span className="tutor-avatar">
                <Sparkles size={18} />
              </span>
              <div>
                <strong>一緒に、問いを深めよう。</strong>
                <p>
                  Boardを眺めながら、気になることを入力できます。「具体例」「定義と条件」では固定の解説を返します。
                </p>
                <span className="tiny-label">実AIは未接続です</span>
              </div>
            </div>
            <div className="suggested-prompts">
              {["具体例を見たい", "定義と条件を確認したい"].map((p) => (
                <button key={p} onClick={() => send(p)} disabled={busy}>
                  {p} <ArrowUp size={13} />
                </button>
              ))}
            </div>
            {messages.map((m) => (
              <div key={m.id} className={`chat-message ${m.role}`}>
                <small>
                  {m.role === "user" ? "あなた" : "Tutor · 固定デモ"}
                </small>
                <p>{m.text}</p>
              </div>
            ))}
            <div ref={chatEnd} />
          </div>
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <textarea
              aria-label="Tutorへの質問"
              placeholder="あなたの問いを、ここから。"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={4000}
              rows={3}
            />
            <div>
              <span>自由なトピックを入力できます</span>
              <button
                className="send-button"
                type="submit"
                aria-label="質問を送信"
                disabled={!input.trim() || busy}
              >
                <ArrowUp size={18} />
              </button>
            </div>
          </form>
        </section>
      </div>
      <div className="explore-heading">
        <h2>別の角度から、探究する</h2>
        <span>どこから始めても大丈夫。</span>
      </div>
      <div className="explore-cards">
        {topics
          .filter((t) => t.id !== topicId)
          .slice(0, 3)
          .map((t, i) => (
            <Link
              key={t.id}
              href={`/learn?topic=${t.id}`}
              className="explore-card"
            >
              <span className="card-index">
                0{i + 1} / {t.category}
              </span>
              <h3>
                {t.label}
                <ArrowUp size={16} />
              </h3>
              <p>{t.description}</p>
            </Link>
          ))}
      </div>
    </>
  );
}
