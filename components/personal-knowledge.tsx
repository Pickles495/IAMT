"use client";
import { useState } from "react";
import {
  knowledgeNodes,
  knowledgeNeighbors,
  type WorkspaceTopic,
} from "@/lib/personal-knowledge";
import { categories, relationLabels } from "@/lib/topic-english";
import { useLocale } from "./locale";
import "./personal-knowledge.css";

export function PersonalKnowledge({
  topics,
  open,
}: {
  topics: WorkspaceTopic[];
  open: (id: string, title: string) => void;
}) {
  const { en, t } = useLocale();
  const [view, show] = useState<"tree" | "map">("tree"),
    [selected, select] = useState(""),
    [zoom, scale] = useState(1);
  const nodes = knowledgeNodes(topics);
  const focus = nodes.find((n) => n.id === selected) ?? nodes[0];
  const neighbors = knowledgeNeighbors(nodes, focus.id);
  const name = (n: typeof focus) =>
    n.topic?.name ?? (en ? n.concept!.english : n.concept!.label);
  const label = (n: typeof focus) => {
    const title = name(n);
    return n.topic && nodes.some((x) => x.id !== n.id && name(x) === title)
      ? title + " · " + n.id.slice(-8)
      : title;
  };
  const category = (c: string) => (en ? (categories[c] ?? "Unclassified") : c);
  const rows = Math.max(neighbors.length, 1),
    height = Math.max(150, rows * 74);
  return (
    <section
      className="private-knowledge"
      aria-label={t("個人の知識構造", "Personal knowledge")}
    >
      <header>
        <h2>{t("知識構造", "Knowledge")}</h2>
        <div>
          {(["tree", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={v === view}
              onClick={() => show(v)}
            >
              {v === "tree" ? "Tree" : "Map"}
            </button>
          ))}
        </div>
      </header>
      {view === "tree" ? (
        <div className="pk-tree">
          {[...new Set(nodes.map((n) => n.category))].map((c) => (
            <details open key={c}>
              <summary>{category(c)}</summary>
              <ul>
                {nodes
                  .filter((n) => n.category === c)
                  .map((n) => (
                    <li key={n.id}>
                      <button
                        aria-pressed={focus.id === n.id}
                        onClick={() => select(n.id)}
                      >
                        {label(n)}{" "}
                        <small>
                          {n.topic
                            ? t("個人", "Saved")
                            : t("分類項目", "Reference")}
                        </small>
                      </button>
                    </li>
                  ))}
              </ul>
            </details>
          ))}
        </div>
      ) : (
        <>
          <div className="pk-control">
            <label>
              {t("中心のTopic", "Focus topic")}{" "}
              <select value={focus.id} onChange={(e) => select(e.target.value)}>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {label(n)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("倍率", "Zoom")}{" "}
              <select
                value={zoom}
                onChange={(e) => scale(Number(e.target.value))}
              >
                {[0.75, 1, 1.25, 1.5].map((v) => (
                  <option key={v} value={v}>
                    {v * 100}%
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div
            className="pk-scroll"
            tabIndex={0}
            aria-label={t("関係図", "Relationship graph")}
          >
            <div style={{ width: 560 * zoom, height: height * zoom }}>
              <div
                className="pk-graph"
                style={{ width: 560, height, transform: "scale(" + zoom + ")" }}
              >
                <svg width="560" height={height} aria-hidden="true">
                  {neighbors.map(({ node }, i) => (
                    <line
                      key={node.id}
                      x1="162"
                      y1={height / 2}
                      x2="398"
                      y2={((i + 0.5) * height) / rows}
                    />
                  ))}
                </svg>
                <strong style={{ left: 12, top: height / 2 }}>
                  {label(focus)}
                </strong>
                {neighbors.map(({ node, label: kind, outgoing }, i) => (
                  <div key={node.id}>
                    <span
                      style={{
                        left: 204,
                        top: (height / 2 + ((i + 0.5) * height) / rows) / 2,
                      }}
                    >
                      {outgoing ? "→" : "←"} {en ? relationLabels[kind] : kind}
                    </span>
                    <button
                      style={{ left: 396, top: ((i + 0.5) * height) / rows }}
                      onClick={() => select(node.id)}
                    >
                      {label(node)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {!neighbors.length && (
            <p>
              {t(
                "登録された関係はまだありません。",
                "No relationships recorded yet.",
              )}
            </p>
          )}
        </>
      )}
      <div className="pk-detail">
        <h3>{label(focus)}</h3>
        <small>
          {category(focus.category)} ·{" "}
          {focus.topic
            ? t("個人Topic", "Saved topic")
            : t("分類項目", "Reference concept")}
        </small>
        {focus.topic && (
          <div>
            {focus.topic.pv_boards.map((b) => (
              <button
                key={b.id}
                onClick={() => open(b.id, name(focus) + " · " + b.title)}
              >
                {b.title} ↗
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
