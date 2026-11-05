"use client";
import { useLocale } from "@/components/locale";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Check,
  GitBranch,
  Network,
  Search,
} from "lucide-react";
import { getTopic, topics, relations, type TopicId } from "@/lib/domain";
import {
  definitions,
  categories,
  relationLabels,
  relationExplanations,
} from "@/lib/topic-english";
import { useDemo } from "@/components/demo-provider";
export default function Page() {
  return (
    <Suspense>
      <Knowledge />
    </Suspense>
  );
}
function Knowledge() {
  const { t: tx, en } = useLocale();
  const query = useSearchParams();
  const { state, setState } = useDemo();
  const [selected, setSelected] = useState<TopicId>(
    getTopic(query.get("topic")).id,
  );
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSelected(getTopic(query.get("topic")).id);
  }, [query]);
  const topic = getTopic(selected);
  const view = state.preferences.mapView;
  const filtered = topics.filter((t) =>
    (t.label + t.english + t.category)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const saved = state.saved.includes(selected);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">EVERY IDEA CONNECTS</div>
          <h1>Knowledge Map</h1>
          <p>
            {tx(
              "トピックと概念間の関係",
              "Topics and conceptual relationships",
            )}
          </p>
        </div>
        <span className="pill">
          {tx("6 TOPICS · サンプル", "6 TOPICS · Sample")}
        </span>
      </div>
      <div className="map-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx("トピックを探す", "Find a topic")}
            aria-label={tx("トピックを検索", "Search topics")}
          />
        </label>
        <div className="segmented" aria-label={tx("マップ表示", "Map view")}>
          {(["graph", "tree"] as const).map((v) => (
            <button
              key={v}
              className={view === v ? "active" : ""}
              aria-pressed={view === v}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  preferences: { ...s.preferences, mapView: v },
                }))
              }
            >
              {v === "graph" ? <Network size={16} /> : <GitBranch size={16} />}{" "}
              {v === "graph" ? "Graph" : "Tree"}
            </button>
          ))}
        </div>
      </div>
      <div className="map-layout">
        <section className="panel map-canvas">
          <div className="map-canvas-header">
            <span className="tiny-label">
              MATHEMATICS / {view.toUpperCase()}
            </span>
            <span className="muted">
              {tx(
                "分類と概念間の関係は別の構造です",
                "Classification and conceptual relationships are separate structures.",
              )}
            </span>
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>
                {tx(
                  "一致するサンプルトピックがありません",
                  "No matching sample topics",
                )}
              </h3>
              <p>
                {tx(
                  "この地図は6件の例です。数学分野を制限するものではありません。",
                  "These six samples do not limit the mathematics you can explore.",
                )}
              </p>
              <Link href="/learn" className="text-link">
                {tx("Tutorに自由に問いを書く", "Tutor")}
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : view === "graph" ? (
            <>
              <div className="graph-scroll">
                <div className="graph-stage">
                  <svg
                    viewBox="0 0 700 530"
                    className="graph-lines"
                    aria-hidden="true"
                  >
                    {relations
                      .filter(
                        (r) =>
                          filtered.some((t) => t.id === r.from) &&
                          filtered.some((t) => t.id === r.to),
                      )
                      .map((r) => {
                        const from = getTopic(r.from),
                          to = getTopic(r.to);
                        return (
                          <g key={r.from + r.to}>
                            <line
                              x1={from.x}
                              y1={from.y}
                              x2={to.x}
                              y2={to.y}
                              stroke={
                                r.from === selected || r.to === selected
                                  ? "#3d795c"
                                  : "#cdd9d1"
                              }
                              strokeWidth="1.5"
                            />
                            <text
                              x={(from.x + to.x) / 2 + 8}
                              y={(from.y + to.y) / 2 - 8}
                            >
                              {en ? relationLabels[r.label] : r.label}
                            </text>
                          </g>
                        );
                      })}
                  </svg>
                  {filtered.map((t) => (
                    <button
                      className={`graph-node ${selected === t.id ? "selected" : ""}`}
                      key={t.id}
                      style={{ left: `${t.x / 7}%`, top: `${t.y / 5.3}%` }}
                      onClick={() => setSelected(t.id)}
                      aria-pressed={selected === t.id}
                    >
                      <span className="node-dot" />
                      <strong>{en ? t.english : t.label}</strong>
                      <small>{en ? "" : t.english}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div className="map-legend">
                <span>
                  <i />
                  {tx(
                    "手作業のサンプル関係",
                    "Manually authored sample relationships",
                  )}
                </span>
                <span>
                  {tx(
                    "線の意味・方向は右の詳細で確認できます",
                    "Relationship meanings and directions appear in the details.",
                  )}
                </span>
              </div>
            </>
          ) : (
            <div className="tree-view">
              {[...new Set(filtered.map((t) => t.category))].map((category) => (
                <div
                  className="tree-group"
                  key={en ? categories[category] : category}
                >
                  <h3>
                    <GitBranch size={17} />
                    {en ? categories[category] : category}
                  </h3>
                  {filtered
                    .filter((t) => t.category === category)
                    .map((t) => (
                      <button
                        key={t.id}
                        className={selected === t.id ? "selected" : ""}
                        onClick={() => setSelected(t.id)}
                      >
                        {en ? t.english : t.label}
                        <span>{en ? "" : t.english}</span>
                        <ArrowRight size={16} />
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </section>
        <aside className="panel topic-detail">
          <span className="eyebrow">TOPIC DETAILS</span>
          <span className="pill">
            {en ? categories[topic.category] : topic.category}
          </span>
          <h2>{en ? topic.english : topic.label}</h2>
          <p className="english-label">{en ? "" : topic.english}</p>

          <p className="muted">
            {en ? definitions[topic.id] : topic.definition}
          </p>
          <button
            className="button secondary full"
            onClick={() =>
              setState((s) => ({
                ...s,
                saved: saved
                  ? s.saved.filter((id) => id !== selected)
                  : [...s.saved, selected],
              }))
            }
          >
            {saved ? <Check size={16} /> : <Bookmark size={16} />}{" "}
            {saved
              ? tx("保存済み · クリックで解除", "Saved · Click to remove")
              : tx("トピックを保存", "Save topic")}
          </button>
          <hr />
          <h3>{tx("概念のつながり", "Relationships")}</h3>
          {relations
            .filter((r) => r.from === selected || r.to === selected)
            .map((r) => (
              <div className="relation" key={r.from + r.to}>
                <span>
                  {en ? getTopic(r.from).english : getTopic(r.from).label} →{" "}
                  {en ? getTopic(r.to).english : getTopic(r.to).label}
                </span>
                <strong>{en ? relationLabels[r.label] : r.label}</strong>
                <p>
                  {en
                    ? relationExplanations[
                        r.from === "symmetry" ? r.to : r.from
                      ]
                    : r.explanation}
                </p>
              </div>
            ))}
          {!relations.some((r) => r.from === selected || r.to === selected) && (
            <p className="muted">
              {tx(
                "このサンプルでは関係を未登録です。",
                "No relationships in this sample.",
              )}
            </p>
          )}
          <div className="stack">
            <Link className="button primary" href={`/learn?topic=${selected}`}>
              Tutor <ArrowRight size={15} />
            </Link>
            <Link
              className="button secondary"
              href={`/exercise?topic=${selected}`}
            >
              {tx("演習", "Practice")}
              <ArrowRight size={15} />
            </Link>
          </div>
          <p className="fine-print">
            {tx(
              "手作業で作成したサンプル地図。Organizer AIによるノード生成・提案の承認は次段階です。",
              "Manually authored sample map. Organizer AI generation and proposal approval are planned.",
            )}
          </p>
        </aside>
      </div>
    </>
  );
}
