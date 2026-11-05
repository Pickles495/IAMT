"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { definitions } from "@/lib/topic-english";
import Link from "next/link";
import { getTopic, topics, type TopicId } from "@/lib/domain";
import { MathText } from "./math";
import { useLocale } from "./locale";
import { useDemo } from "./demo-provider";
type Card = {
  id: string;
  kind: "topic" | "note";
  topic: TopicId;
  x: number;
  y: number;
  text: string;
  wide?: boolean;
};
export function BoardWorkspace() {
  const { t, en } = useLocale();
  const query = useSearchParams();
  const { state, setState } = useDemo();
  const [cards, setCards] = useState<Card[]>([]);
  const [storageError, setStorageError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [topic, setTopic] = useState<TopicId>(getTopic(query.get("topic")).id);
  const [tutor, setTutor] = useState(true);
  const [input, setInput] = useState("");
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem("iamt-board-v4") || "null");
      if (
        Array.isArray(a) &&
        a.every(
          (c) =>
            typeof c.id === "string" &&
            ["note", "topic"].includes(c.kind) &&
            topics.some((t) => t.id === c.topic) &&
            Number.isFinite(c.x) &&
            Number.isFinite(c.y) &&
            typeof c.text === "string",
        )
      )
        setCards(a);
      else
        setCards([
          {
            id: "initial",
            kind: "topic",
            topic: getTopic(query.get("topic")).id,
            x: 40,
            y: 40,
            text: "",
          },
        ]);
    } catch {
      setStorageError(true);
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem("iamt-board-v4", JSON.stringify(cards));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
  }, [cards, loaded]);
  useEffect(() => {
    setTopic(getTopic(query.get("topic")).id);
  }, [query]);
  function add(kind: Card["kind"]) {
    setCards((s) => [
      ...s,
      {
        id: crypto.randomUUID(),
        kind,
        topic,
        x: 40 + (s.length % 4) * 350,
        y: 40 + (Math.floor(s.length / 4) % 4) * 280,
        text: "",
      },
    ]);
  }
  function send() {
    if (!input.trim()) return;
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      messages: [
        ...s.messages,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: input,
          topicId: topic,
          createdAt: now,
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: t(
            "質問を保存しました。実AIは未接続です。",
            "Question saved. Live AI is not connected.",
          ),
          topicId: topic,
          createdAt: now,
        },
      ],
    }));
    setInput("");
  }
  return (
    <>
      <div className="v4-toolbar">
        <h1>{t("学習ワークスペース", "Learning workspace")}</h1>
        <select
          aria-label={t("トピック", "Topic")}
          value={topic}
          onChange={(e) => setTopic(e.target.value as TopicId)}
        >
          {topics.map((x) => (
            <option key={x.id} value={x.id}>
              {en ? x.english : x.label}
            </option>
          ))}
        </select>
        <button onClick={() => add("topic")}>
          {t("要素を追加", "Add concept")}
        </button>
        <button onClick={() => add("note")}>
          {t("ノートを追加", "Add note")}
        </button>
        <label>
          Zoom{" "}
          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          >
            {[0.5, 0.75, 1, 1.25].map((z) => (
              <option key={z} value={z}>
                {z * 100}%
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => setTutor((v) => !v)}>Tutor</button>
      </div>
      {storageError && (
        <p role="alert">
          {t("Boardを保存できません。", "Could not save the board.")}
        </p>
      )}
      <div className="v4-board">
        <div className="v4-board-scroll">
          <div
            className="v4-surface"
            style={{ width: 1800 * zoom, height: 1200 * zoom }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            >
              {cards.map((c) => (
                <section
                  key={c.id}
                  className="v4-card"
                  style={{ left: c.x, top: c.y, width: c.wide ? 480 : 320 }}
                >
                  <header>
                    <button
                      className="drag-handle"
                      aria-label={t(
                        "移動（矢印キーでも操作可）",
                        "Move (arrow keys supported)",
                      )}
                      onKeyDown={(e) => {
                        const delta: Record<string, number[]> = {
                          ArrowLeft: [-20, 0],
                          ArrowRight: [20, 0],
                          ArrowUp: [0, -20],
                          ArrowDown: [0, 20],
                        };
                        if (delta[e.key]) {
                          e.preventDefault();
                          const [x, y] = delta[e.key];
                          setCards((s) =>
                            s.map((v) =>
                              v.id === c.id
                                ? {
                                    ...v,
                                    x: Math.min(1450, Math.max(0, v.x + x)),
                                    y: Math.min(900, Math.max(0, v.y + y)),
                                  }
                                : v,
                            ),
                          );
                        }
                      }}
                      onPointerDown={(e) => {
                        e.currentTarget.setPointerCapture(e.pointerId);
                        e.currentTarget.dataset.x = String(e.clientX);
                        e.currentTarget.dataset.y = String(e.clientY);
                      }}
                      onPointerMove={(e) => {
                        if (!e.currentTarget.hasPointerCapture(e.pointerId))
                          return;
                        const dx =
                            (e.clientX - Number(e.currentTarget.dataset.x)) /
                            zoom,
                          dy =
                            (e.clientY - Number(e.currentTarget.dataset.y)) /
                            zoom;
                        e.currentTarget.dataset.x = String(e.clientX);
                        e.currentTarget.dataset.y = String(e.clientY);
                        setCards((s) =>
                          s.map((v) =>
                            v.id === c.id
                              ? {
                                  ...v,
                                  x: Math.min(1450, Math.max(0, v.x + dx)),
                                  y: Math.min(900, Math.max(0, v.y + dy)),
                                }
                              : v,
                          ),
                        );
                      }}
                      onPointerUp={(e) =>
                        e.currentTarget.releasePointerCapture(e.pointerId)
                      }
                    >
                      ⠿{" "}
                      {c.kind === "note"
                        ? t("ノート", "Note")
                        : en
                          ? getTopic(c.topic).english
                          : getTopic(c.topic).label}
                    </button>
                    <button
                      aria-label={t("要素を削除", "Delete element")}
                      onClick={() =>
                        setCards((s) => s.filter((v) => v.id !== c.id))
                      }
                    >
                      ×
                    </button>
                  </header>
                  <button
                    onClick={() =>
                      setCards((s) =>
                        s.map((v) =>
                          v.id === c.id ? { ...v, wide: !v.wide } : v,
                        ),
                      )
                    }
                    aria-label={t("要素の幅を切替", "Toggle element width")}
                  >
                    {t("幅", "Width")}: {c.wide ? 480 : 320}
                  </button>
                  {c.kind === "note" ? (
                    <textarea
                      aria-label={t("ノート本文", "Note text")}
                      value={c.text}
                      onChange={(e) =>
                        setCards((s) =>
                          s.map((v) =>
                            v.id === c.id ? { ...v, text: e.target.value } : v,
                          ),
                        )
                      }
                    />
                  ) : (
                    <>
                      <MathText tex={getTopic(c.topic).formula} />
                      <p hidden={state.preferences.detail === "compact"}>
                        {en
                          ? definitions[c.topic]
                          : getTopic(c.topic).definition}
                      </p>
                      <div className="button-row">
                        <Link href={`/exercise?topic=${c.topic}`}>
                          {t("演習", "Practice")}
                        </Link>
                        <Link href={`/knowledge?topic=${c.topic}`}>
                          {t("マップ", "Map")}
                        </Link>
                      </div>
                    </>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
        {tutor && (
          <section className="v4-tutor" aria-label="Tutor">
            <header>
              Tutor{" "}
              <button
                onClick={() => setTutor(false)}
                aria-label={t("Tutorを閉じる", "Close Tutor")}
              >
                ×
              </button>
            </header>
            <div className="v4-chat">
              {state.messages
                .filter((m) => m.topicId === topic)
                .slice(-12)
                .map((m) => (
                  <p key={m.id} className={`chat-message ${m.role}`}>
                    <strong>
                      {m.role === "user" ? t("あなた", "You") : "Tutor"}
                    </strong>
                    <br />
                    {m.text}
                  </p>
                ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <textarea
                aria-label={t("Tutorへの質問", "Question for Tutor")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={4000}
              />
              <button disabled={!input.trim()}>{t("送信", "Send")}</button>
            </form>
          </section>
        )}
      </div>
    </>
  );
}
