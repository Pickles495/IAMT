"use client";
import { useEffect, useState, useRef } from "react";
import type { Proposal } from "@/ai/board-tutor";
import { useLocale } from "./locale";
import { MathText } from "./math";
import "./personal-board.css";
type Note = {
  id: string;
  text: string;
  tex?: string;
  x: number;
  y: number;
  width?: number;
  wide?: boolean;
  collapsed?: boolean;
  topic?: string;
  parent?: string;
};
type Turn = { question: string; reply: string; example: boolean };
type Gesture = {
  id?: string;
  resize?: boolean;
  sx: number;
  sy: number;
  x: number;
  y: number;
};
export function PersonalBoard({
  boardId,
  title,
  token,
  initialPrompt,
  close,
}: {
  boardId: string;
  title: string;
  token: string;
  initialPrompt?: string;
  close: () => void;
}) {
  const { en, t } = useLocale();
  const [notes, setNotes] = useState<Note[]>([]),
    [saved, setSaved] = useState<Note[]>([]),
    [rev, revision] = useState(0);
  const [past, undoStack] = useState<Note[][]>([]),
    [future, redoStack] = useState<Note[][]>([]);
  const [selected, select] = useState(""),
    [pan, move] = useState({ x: 32, y: 32 }),
    [zoom, scale] = useState(1);
  const [input, question] = useState(initialPrompt ?? ""),
    [turns, history] = useState<Turn[]>([]),
    [live, setLive] = useState(false);
  const [pending, suggest] = useState<{ p: Proposal; target?: Note } | null>(
      null,
    ),
    [working, busy] = useState(""),
    [message, status] = useState("");
  const [tutor, show] = useState(true),
    [editing, edit] = useState(false);
  const gesture = useRef<Gesture | null>(null),
    viewport = useRef<HTMLDivElement>(null);
  const active = notes.find((n) => n.id === selected),
    dirty = rev > 0 && notes !== saved;
  async function request(action: string, extra: object = {}) {
    const r = await fetch("/api/pv1/board", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, boardId, ...extra }),
    });
    const data = await r.json();
    if (!r.ok) throw Error(data.error);
    return data;
  }
  useEffect(() => {
    let current = true;
    request("open")
      .then((d) => {
        if (current) {
          if (initialPrompt) {
            const id = crypto.randomUUID();
            const y =
              d.elements.reduce(
                (max: number, n: Note) =>
                  Math.max(max, Number.isFinite(n.y) ? n.y : 0),
                -180,
              ) + 220;
            setNotes([...d.elements, { id, text: initialPrompt, x: 40, y }]);
            undoStack([d.elements]);
            select(id);
            move({ x: 0, y: 40 - y });
          } else setNotes(d.elements);
          setSaved(d.elements);
          revision(d.revision);
          history(d.history);
          setLive(d.live);
        }
      })
      .catch((e) => {
        if (current) status(String(e));
      });
    return () => {
      current = false;
    };
  }, [boardId, token, initialPrompt]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function checkpoint() {
    undoStack((p) => [...p.slice(-49), notes]);
    redoStack([]);
  }
  function change(next: Note[]) {
    checkpoint();
    setNotes(next);
  }
  function patch(id: string, v: Partial<Note>) {
    change(notes.map((n) => (n.id === id ? { ...n, ...v } : n)));
  }
  function add(text = "", tex = "", anchor?: Note) {
    const id = crypto.randomUUID();
    change([
      ...notes,
      {
        id,
        text,
        tex,
        x: anchor ? anchor.x + (anchor.width ?? 260) + 40 : (60 - pan.x) / zoom,
        y: anchor ? anchor.y : (60 - pan.y) / zoom,
        parent: anchor?.id,
      },
    ]);
    select(id);
    edit(!text && !tex);
  }
  async function run(name: string, fn: () => Promise<void>) {
    busy(name);
    status("");
    try {
      await fn();
    } catch (e) {
      status(String(e));
    } finally {
      busy("");
    }
  }
  function save() {
    void run("save", async () => {
      const d = await request("save", { revision: rev, elements: notes });
      revision(d.revision);
      setSaved(notes);
    });
  }
  function ask() {
    const example = !live;
    const q = example
      ? t(
          "√2 の像の候補が二つあるのはなぜ？",
          "Why are there two possible images of √2?",
        )
      : input.trim();
    void run("ask", async () => {
      const r = await request("ask", {
        revision: rev,
        selected,
        question: q,
        locale: en ? "en" : "ja",
        example,
      });
      history((h) => [...h, { question: q, reply: r.reply, example }]);
      question("");
      suggest(
        r.proposal.action === "none" ? null : { p: r.proposal, target: active },
      );
    });
  }
  const stale = pending?.target && !notes.includes(pending.target);
  return (
    <section className="m2">
      <header>
        <button
          onClick={() => {
            if (
              !dirty ||
              confirm(
                t("未保存の編集を破棄しますか？", "Discard unsaved changes?"),
              )
            )
              close();
          }}
        >
          ← {t("一覧", "Topics")}
        </button>
        <h2>{title}</h2>
        <button disabled={!dirty || !!working} onClick={save}>
          {t("保存", "Save")}
          {dirty ? " *" : ""}
        </button>
        <button aria-expanded={tutor} onClick={() => show(!tutor)}>
          Tutor
        </button>
      </header>
      <div className="m2-layout">
        <main>
          <div className="m2-tools">
            <button disabled={!rev} onClick={() => add()}>
              {t("＋ ノート", "+ Note")}
            </button>
            <button
              disabled={!past.length}
              onClick={() => {
                redoStack([...future, notes]);
                setNotes(past.at(-1)!);
                undoStack(past.slice(0, -1));
              }}
            >
              ↶ Undo
            </button>
            <button
              disabled={!future.length}
              onClick={() => {
                undoStack([...past, notes]);
                setNotes(future.at(-1)!);
                redoStack(future.slice(0, -1));
              }}
            >
              ↷ Redo
            </button>
            <button
              aria-label="Zoom out"
              onClick={() => scale(Math.max(0.35, zoom - 0.15))}
            >
              −
            </button>
            <button
              aria-label="Reset view"
              onClick={() => {
                move({ x: 32, y: 32 });
                scale(1);
              }}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              aria-label="Zoom in"
              onClick={() => scale(Math.min(2.5, zoom + 0.15))}
            >
              +
            </button>
            {active && (
              <>
                <button onClick={() => edit(!editing)}>
                  {t("編集", "Edit")}
                </button>
                <button
                  onClick={() =>
                    patch(active.id, { collapsed: !active.collapsed })
                  }
                >
                  {active.collapsed ? "▾" : "▴"}
                </button>
                <button
                  onClick={() => {
                    change(notes.filter((n) => n.id !== selected));
                    select("");
                  }}
                >
                  {t("削除", "Delete")}
                </button>
              </>
            )}
          </div>
          <div
            className="m2-view"
            ref={viewport}
            onPointerDown={(e) => {
              if (
                e.button !== 0 ||
                (e.target as Element).closest("textarea,button")
              )
                return;
              const el = (e.target as Element).closest<HTMLElement>(
                "[data-note]",
              );
              const n = notes.find((v) => v.id === el?.dataset.note);
              if (n) {
                select(n.id);
                if (n.id !== selected) edit(false);
              } else {
                select("");
                edit(false);
              }
              const resize = (e.target as Element).hasAttribute("data-resize");
              gesture.current = {
                id: n?.id,
                resize,
                sx: e.clientX,
                sy: e.clientY,
                x: resize ? (n?.width ?? 260) : (n?.x ?? pan.x),
                y: n?.y ?? pan.y,
              };
              if (n) checkpoint();
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const g = gesture.current;
              if (!g) return;
              const dx = e.clientX - g.sx,
                dy = e.clientY - g.sy;
              if (!dx && !dy) return;
              if (!g.id) move({ x: g.x + dx, y: g.y + dy });
              else
                setNotes((ns) =>
                  ns.map((n) =>
                    n.id === g.id
                      ? {
                          ...n,
                          ...(g.resize
                            ? {
                                width: Math.max(
                                  160,
                                  Math.min(800, g.x + dx / zoom),
                                ),
                              }
                            : { x: g.x + dx / zoom, y: g.y + dy / zoom }),
                        }
                      : n,
                  ),
                );
            }}
            onLostPointerCapture={() => {
              gesture.current = null;
            }}
          >
            <div
              className="m2-world"
              style={{
                transform:
                  "translate(" +
                  pan.x +
                  "px," +
                  pan.y +
                  "px) scale(" +
                  zoom +
                  ")",
              }}
            >
              <svg aria-hidden="true">
                {notes.map((n) => {
                  const from = notes.find((k) => k.id === n.parent);
                  return (
                    from && (
                      <line
                        key={n.id}
                        x1={from.x + 130}
                        y1={from.y + 30}
                        x2={n.x + 130}
                        y2={n.y + 30}
                        stroke="currentColor"
                      />
                    )
                  );
                })}
              </svg>
              {notes.map((n) => (
                <article
                  tabIndex={0}
                  onFocus={() => select(n.id)}
                  data-note={n.id}
                  key={n.id}
                  aria-label={n.text || t("ノート", "Note")}
                  className={n.id === selected ? "chosen" : ""}
                  style={{
                    left: n.x,
                    top: n.y,
                    width: n.width ?? (n.wide ? 480 : 260),
                  }}
                >
                  {editing && selected === n.id ? (
                    <>
                      <textarea
                        aria-label={t("本文", "Note text")}
                        value={n.text}
                        onChange={(e) => patch(n.id, { text: e.target.value })}
                      />
                      <textarea
                        aria-label={t("数式", "Formula")}
                        value={n.tex ?? ""}
                        onChange={(e) => patch(n.id, { tex: e.target.value })}
                      />
                      <button onClick={() => edit(false)}>
                        {t("完了", "Done")}
                      </button>
                    </>
                  ) : (
                    <>
                      {n.collapsed
                        ? (n.text || n.tex || "…").slice(0, 35)
                        : n.text ||
                          n.topic ||
                          (!n.tex ? t("ノート", "Note") : "")}
                      {!n.collapsed && n.tex && <MathText tex={n.tex} />}
                    </>
                  )}
                  <i data-resize aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </main>
        {tutor && (
          <aside>
            <h3>Tutor</h3>
            {turns.map((v, i) => (
              <div className="m2-turn" key={i}>
                <b>{v.question}</b>
                <p>
                  {v.example && <small>{t("操作例 · ", "Example · ")}</small>}
                  {v.reply}
                </p>
              </div>
            ))}
            {pending && (
              <div className="m2-offer">
                <p>{pending.p.text}</p>
                {pending.p.tex && <MathText tex={pending.p.tex} />}
                <button
                  disabled={!!stale}
                  onClick={() => {
                    if (stale) return;
                    if (pending.p.action === "replace" && pending.target)
                      patch(pending.target.id, {
                        text: pending.p.text,
                        tex: pending.p.tex,
                      });
                    else add(pending.p.text, pending.p.tex, pending.target);
                    suggest(null);
                  }}
                >
                  {t("Boardに反映", "Apply to board")}
                </button>
                <button onClick={() => suggest(null)}>
                  {t("破棄", "Dismiss")}
                </button>
                {stale && (
                  <p>
                    {t(
                      "参照先が変更されました。もう一度質問してください。",
                      "The reference changed. Ask again.",
                    )}
                  </p>
                )}
              </div>
            )}
            {active && (
              <small>
                {t("参照中", "Reference")} ·{" "}
                {(active.text || active.tex || active.topic || "…").slice(
                  0,
                  65,
                )}
              </small>
            )}
            {live && (
              <textarea
                aria-label={t("質問", "Question")}
                value={input}
                maxLength={3000}
                onChange={(e) => question(e.target.value)}
              />
            )}
            <button
              disabled={!rev || !!working || dirty || (live && !input.trim())}
              onClick={ask}
            >
              {working === "ask"
                ? "…"
                : live
                  ? t("質問する", "Ask")
                  : t("固定例で操作を試す", "Try a fixed example")}
            </button>
            {dirty && (
              <small>
                {t(
                  "質問する前にBoardを保存してください。",
                  "Save the board before asking.",
                )}
              </small>
            )}
          </aside>
        )}
      </div>
      <p role="status">{message}</p>
    </section>
  );
}
