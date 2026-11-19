"use client";
import { topics as catalog } from "@/lib/domain";
import { useEffect, useState } from "react";
import {
  type Annotations,
  knowledgeNodes,
  knowledgeNeighbors,
  type WorkspaceTopic,
} from "@/lib/personal-knowledge";
import { categories, relationLabels } from "@/lib/topic-english";
import { useLocale } from "./locale";
import "./personal-knowledge.css";

export function PersonalKnowledge({
  topics,
  token,
  open,
}: {
  topics: WorkspaceTopic[];
  token: string;
  open: (id: string, title: string) => void;
}) {
  const { en, t } = useLocale();
  const [view, show] = useState<"tree" | "map">("tree"),
    [selected, select] = useState(""),
    [zoom, scale] = useState(1);
  const [annotations, setAnnotations] = useState<Annotations>({
      classes: [],
      links: [],
    }),
    [problem, notice] = useState(""),
    [busy, wait] = useState(false);
  async function request(body?: object) {
    const r = await fetch("/api/pv1/knowledge", {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    return d;
  }
  useEffect(() => {
    let live = true;
    request()
      .then((d) => {
        if (live) setAnnotations(d);
      })
      .catch((e) => {
        if (live) notice(String(e));
      });
    return () => {
      live = false;
    };
  }, [token]);
  async function update(body: object) {
    wait(true);
    notice("");
    try {
      await request(body);
      setAnnotations(await request());
    } catch (e) {
      notice(String(e));
    } finally {
      wait(false);
    }
  }
  const nodes = knowledgeNodes(topics, annotations.classes);
  const focus = nodes.find((n) => n.id === selected) ?? nodes[0];
  const personalLinks = annotations.links.filter(
    (x) => x.source === focus.id || x.target === focus.id,
  );
  const personalNeighbors = personalLinks.flatMap((x) => {
    const outgoing = x.source === focus.id;
    const node = nodes.find((n) => n.id === (outgoing ? x.target : x.source));
    return node
      ? [{ node, outgoing, label: x.kind, explanation: x.rationale }]
      : [];
  });
  const neighbors = [
    ...knowledgeNeighbors(nodes, focus.id),
    ...personalNeighbors,
  ];
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
                      key={node.id + "-" + i}
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
                  <div key={node.id + "-" + i}>
                    <span
                      style={{
                        left: 204,
                        top: (height / 2 + ((i + 0.5) * height) / rows) / 2,
                      }}
                    >
                      {outgoing ? "→" : "←"}{" "}
                      {kind === "related"
                        ? t("個人・関連", "Personal · related")
                        : kind === "requires"
                          ? t("個人・前提", "Personal · requires")
                          : en
                            ? relationLabels[kind]
                            : kind}
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
        {focus.topic && (
          <details key={focus.id}>
            <summary>
              {t("分類・関係を編集", "Edit classification and links")}
            </summary>
            <label>
              {t("対応する概念", "Reference concept")}
              <select
                disabled={busy}
                value={
                  annotations.classes.find((c) => c.topic_id === focus.id)
                    ?.concept ?? ""
                }
                onChange={(e) =>
                  void update({
                    action: e.target.value ? "classify" : "reset",
                    source: focus.id,
                    concept: e.target.value,
                  })
                }
              >
                <option value="">{t("名前から判定", "Match by name")}</option>
                {catalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {en ? c.english : c.label}
                  </option>
                ))}
              </select>
            </label>
            {topics.length > 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void update({
                    action: "link",
                    source: focus.id,
                    target: f.get("target"),
                    kind: f.get("kind"),
                    rationale: f.get("reason"),
                  });
                }}
              >
                <select
                  aria-label={t("関係の種類", "Relation type")}
                  name="kind"
                >
                  <option value="related">{t("関連する", "Related to")}</option>
                  <option value="requires">
                    {t("前提として必要とする", "Requires")}
                  </option>
                </select>
                <select
                  name="target"
                  aria-label={t("関連先のTopic", "Related topic")}
                >
                  {nodes
                    .filter((n) => n.topic && n.id !== focus.id)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {label(n)}
                      </option>
                    ))}
                </select>
                <input
                  name="reason"
                  placeholder={t("理由（任意）", "Reason (optional)")}
                  aria-label={t("関係の理由", "Reason for link")}
                  maxLength={500}
                />
                <button disabled={busy}>{t("関係を保存", "Save link")}</button>
              </form>
            )}
            {personalLinks.map((x) => (
              <p key={x.source + x.target + x.kind}>
                {topics.find((t) => t.id === x.source)?.name} →{" "}
                {topics.find((t) => t.id === x.target)?.name} ·{" "}
                {x.kind === "requires"
                  ? t("前提", "Requires")
                  : t("関連", "Related")}{" "}
                {x.rationale}
                <button
                  disabled={busy}
                  onClick={() => void update({ ...x, action: "unlink" })}
                >
                  {t("接続を解除", "Remove link")}
                </button>
              </p>
            ))}
          </details>
        )}
        {problem && <p role="status">{problem}</p>}
      </div>
    </section>
  );
}
