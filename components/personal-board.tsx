"use client";
import { useEffect, useState, useRef } from "react";
import type { Proposal } from "@/ai/board-tutor";
import { useLocale } from "./locale";
import { ChevronRight } from "lucide-react";
import { BoardReading } from "./board-reading";
import { MathText } from "./math";
import "./personal-board.css";
import {
  memoKinds,
  type MemoKind,
  type Note,
  possibleParents,
  removeNote,
} from "@/lib/board-elements";
import { embeddingSteps } from "@/lib/embedding-lesson";
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
  const [pending, suggest] = useState<{
      p: Proposal;
      target?: Note;
      step?: number;
    } | null>(null),
    [working, busy] = useState(""),
    [message, status] = useState("");
  const [tutor, show] = useState(true),
    [editing, edit] = useState(false);
  const gesture = useRef<Gesture | null>(null),
    viewport = useRef<HTMLDivElement>(null);
  const active = notes.find((n) => n.id === selected),
    dirty = rev > 0 && notes !== saved;
  const [readingId, read] = useState("");
  const reading = notes.find((n) => n.id === readingId);
  const inlineIds = new Set<string>();
  if (reading) {
    const children = new Map<string, string[]>();
    for (const note of notes)
      if (note.parent) {
        const siblings = children.get(note.parent) ?? [];
        siblings.push(note.id);
        children.set(note.parent, siblings);
      }
    const pending = [...(children.get(reading.id) ?? [])];
    while (pending.length) {
      const id = pending.pop()!;
      if (id === reading.id || inlineIds.has(id)) continue;
      inlineIds.add(id);
      pending.push(...(children.get(id) ?? []));
    }
  }
  // Known lesson steps belong to their source even when the source is folded.
  // Keep orphaned and manually re-linked notes accessible on the canvas.
  const byId = new Map(notes.map((n) => [n.id, n]));
  function belongsToLesson(n: Note): boolean {
    const parent = n.parent ? byId.get(n.parent) : undefined;
    if (!parent) return false;
    if (n.inlineMemo) return true;
    if (n.embeddingStep === 1 || n.embeddingStep === 3)
      return parent.embeddingStep === 0;
    return (
      n.embeddingStep === 2 &&
      parent.embeddingStep === 1 &&
      belongsToLesson(parent)
    );
  }
  const canvasNotes = notes.filter(
    (n) => !inlineIds.has(n.id) && !belongsToLesson(n),
  );
  function beginReading(id: string) {
    edit(false);
    read(id);
    select(id);
  }
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
  function add(text = "", tex = "", anchor?: Note, inlineMemo?: boolean) {
    const id = crypto.randomUUID();
    if (
      inlineMemo &&
      anchor &&
      (!reading || (anchor.id !== reading.id && !inlineIds.has(anchor.id)))
    )
      read(anchor.id);
    change([
      ...(inlineMemo && anchor?.collapsed
        ? notes.map((n) =>
            n.id === anchor.id ? { ...n, collapsed: false } : n,
          )
        : notes),
      {
        id,
        text,
        tex,
        x: anchor ? anchor.x + (anchor.width ?? 260) + 40 : (60 - pan.x) / zoom,
        y: anchor ? anchor.y : (60 - pan.y) / zoom,
        parent: anchor?.id,
        inlineMemo,
        memoKind:
          inlineMemo && anchor?.memoKind === "question" ? "answer" : undefined,
      },
    ]);
    select(id);
    edit(!text && !tex);
  }
  function openLessonStep(index: number, parent?: Note) {
    const step = embeddingSteps[index];
    if (!step) return;
    const existing = notes.find(
      (n) => n.embeddingStep === index && n.parent === parent?.id,
    );
    let note = existing;
    if (!note) {
      const x = parent
        ? parent.x + (parent.width ?? (parent.wide ? 480 : 260)) + 48
        : 40;
      const bottom = notes
        .filter(
          (n) => n.x < x + 300 && n.x + (n.width ?? (n.wide ? 480 : 260)) > x,
        )
        .reduce((max, n) => {
          const height =
            Array.from(
              viewport.current?.querySelectorAll<HTMLElement>("[data-note]") ??
                [],
            ).find((el) => el.dataset.note === n.id)?.offsetHeight ?? 220;
          return Math.max(max, n.y + height + 32);
        }, parent?.y ?? 40);
      note = {
        id: crypto.randomUUID(),
        embeddingStep: index,
        text: en ? step.en : step.ja,
        tex: step.tex,
        parent: parent?.id,
        x,
        y: bottom,
        width: parent
          ? 300
          : Math.max(
              220,
              Math.min(440, (viewport.current?.clientWidth ?? 350) / zoom - 32),
            ),
      };
      change([...notes, note]);
    }
    if (!parent) {
      if (note.collapsed) patch(note.id, { collapsed: false });
      beginReading(note.id);
      move({ x: 16 - note.x * zoom, y: 16 - note.y * zoom });
    } else {
      if (existing?.collapsed) patch(existing.id, { collapsed: false });
      select(note.id);
    }
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
  function noteEditor(n: Note) {
    if (!editing || selected !== n.id) return null;
    return (
      <>
        {n.inlineMemo && (
          <label className="memo-kind">
            {t("補足の種類", "Note type")}
            <select
              value={n.memoKind ?? "memo"}
              onChange={(e) =>
                patch(n.id, { memoKind: e.target.value as MemoKind })
              }
            >
              {(Object.keys(memoKinds) as MemoKind[]).map((k) => (
                <option key={k} value={k}>
                  {t(memoKinds[k][0], memoKinds[k][1])}
                </option>
              ))}
            </select>
          </label>
        )}
        <textarea
          autoFocus
          aria-label={t("本文", "Note text")}
          value={n.text}
          onChange={(e) => patch(n.id, { text: e.target.value })}
        />
        <textarea
          aria-label={t("数式", "Formula")}
          value={n.tex ?? ""}
          onChange={(e) => patch(n.id, { tex: e.target.value })}
        />
        <button
          onClick={(e) => {
            edit(false);
            e.currentTarget
              .closest<HTMLElement>("[data-inline-note],article")
              ?.focus({ preventScroll: true });
          }}
        >
          {t("完了", "Done")}
        </button>
      </>
    );
  }
  function attachmentControl(n: Note) {
    if (n.id !== selected || editing) return null;
    return (
      <button
        type="button"
        className="attach-at-source"
        disabled={!!working}
        onClick={(e) => {
          e.stopPropagation();
          add("", "", n, true);
        }}
      >
        {n.memoKind === "question"
          ? t("解答を添える", "Attach answer")
          : t("補足を書く", "Attach note")}
      </button>
    );
  }
  const contextLesson =
    !live &&
    active?.embeddingStep !== undefined &&
    reading &&
    !reading.collapsed &&
    (active.id === reading.id || inlineIds.has(active.id));
  const stale =
    pending?.target &&
    (!notes.includes(pending.target) ||
      (pending.step !== undefined &&
        (!contextLesson || pending.target.id !== selected)));
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
        <div className="m2-canvas-column">
          <div className="board-canvas-surface">
            <div className="m2-tools">
              <button disabled={!rev} onClick={() => openLessonStep(0)}>
                {t("教材 · 体の埋め込み", "Lesson · Field embeddings")}
              </button>
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
                  {notes.length > 1 && (
                    <label>
                      {t("接続元", "Connect from")}{" "}
                      <select
                        aria-label={t("接続元のノート", "Parent note")}
                        value={active.parent ?? ""}
                        onChange={(e) =>
                          patch(active.id, {
                            parent: e.target.value || undefined,
                          })
                        }
                      >
                        <option value="">{t("なし", "None")}</option>
                        {possibleParents(notes, active.id).map((n) => (
                          <option key={n.id} value={n.id}>
                            {(n.text || n.tex || n.topic || n.id).slice(0, 48)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <button onClick={() => edit(!editing)}>
                    {t("編集", "Edit")}
                  </button>

                  <button
                    onClick={() => {
                      change(removeNote(notes, selected));
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
                  (e.target as Element).closest(
                    "textarea,button,select,.inline-branches",
                  )
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
                const resize = (e.target as Element).hasAttribute(
                  "data-resize",
                );
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
                  {canvasNotes.map((n) => {
                    const from = canvasNotes.find((k) => k.id === n.parent);
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
                {canvasNotes.map((n) => (
                  <article
                    tabIndex={0}
                    aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Enter"
                    onKeyDown={(e) => {
                      if (
                        e.nativeEvent.isComposing ||
                        e.nativeEvent.keyCode === 229
                      )
                        return;
                      if (e.key === "Escape" && editing && selected === n.id) {
                        e.preventDefault();
                        edit(false);
                        e.currentTarget.focus();
                        return;
                      }
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter") {
                        e.preventDefault();
                        select(n.id);
                        edit(true);
                        return;
                      }
                      const steps: Record<string, [number, number]> = {
                        ArrowUp: [0, -1],
                        ArrowDown: [0, 1],
                        ArrowLeft: [-1, 0],
                        ArrowRight: [1, 0],
                      };
                      const step = steps[e.key];
                      if (!step) return;
                      e.preventDefault();
                      const distance = e.shiftKey ? 50 : 10;
                      patch(n.id, {
                        x: n.x + distance * step[0],
                        y: n.y + distance * step[1],
                      });
                    }}
                    onFocus={(e) => {
                      if (e.target === e.currentTarget) select(n.id);
                    }}
                    data-note={n.id}
                    key={n.id}
                    aria-label={n.text || t("ノート", "Note")}
                    className={[
                      n.id === selected ? "chosen" : "",
                      readingId === n.id ? "reading-anchor" : "",
                    ].join(" ")}
                    style={{
                      left: n.x,
                      top: n.y,
                      width: n.width ?? (n.wide ? 480 : 260),
                    }}
                  >
                    {noteEditor(n) ?? (
                      <>
                        <button
                          type="button"
                          className="note-fold"
                          aria-expanded={!n.collapsed}
                          aria-label={
                            n.collapsed
                              ? t("ノートを展開", "Expand note")
                              : t("ノートを折り畳む", "Collapse note")
                          }
                          onClick={() => {
                            select(n.id);
                            patch(n.id, { collapsed: !n.collapsed });
                          }}
                        >
                          <ChevronRight size={15} aria-hidden="true" />
                        </button>
                        <span
                          className={n.collapsed ? "note-summary" : "note-body"}
                        >
                          {n.text ||
                            n.topic ||
                            (n.collapsed
                              ? n.tex || t("ノート", "Note")
                              : !n.tex
                                ? t("ノート", "Note")
                                : "")}
                        </span>
                        {!n.collapsed && n.tex && <MathText tex={n.tex} />}
                        {attachmentControl(n)}
                        {!n.collapsed &&
                          (n.embeddingStep === 0 ||
                            notes.some((child) => child.parent === n.id)) && (
                            <>
                              <button
                                className="branch-switch"
                                aria-expanded={readingId === n.id}
                                onClick={() => {
                                  if (readingId === n.id) {
                                    read("");
                                    select(n.id);
                                  } else beginReading(n.id);
                                }}
                              >
                                {readingId === n.id
                                  ? t("補足を閉じる", "Close details")
                                  : t("補足を開く", "Open details")}
                              </button>
                              {readingId === n.id && (
                                <BoardReading
                                  root={n}
                                  notes={notes}
                                  toggle={(node) =>
                                    patch(node.id, {
                                      collapsed: !node.collapsed,
                                    })
                                  }
                                  reveal={openLessonStep}
                                  select={select}
                                  editor={noteEditor}
                                  attach={attachmentControl}
                                />
                              )}
                            </>
                          )}
                      </>
                    )}
                    <i data-resize aria-hidden="true" />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
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
                    if (pending.step !== undefined && pending.target)
                      openLessonStep(pending.step, pending.target);
                    else if (pending.p.action === "replace" && pending.target)
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
            {contextLesson && active && (
              <>
                {(active.embeddingStep === 0
                  ? [1, 3]
                  : active.embeddingStep === 1
                    ? [2]
                    : []
                ).map((step) => (
                  <button
                    className="context-action"
                    key={step}
                    onClick={() => {
                      const model = embeddingSteps[step];
                      const savedStep = notes.find(
                        (n) =>
                          n.parent === active.id && n.embeddingStep === step,
                      );
                      suggest({
                        target: active,
                        step,
                        p: {
                          action: "append",
                          text: savedStep?.text ?? (en ? model.en : model.ja),
                          tex: savedStep?.tex ?? model.tex,
                        },
                      });
                    }}
                  >
                    {step === 1
                      ? t("導出を確認", "Preview derivation")
                      : step === 2
                        ? t("証明を確認", "Preview proof")
                        : t("具体例を確認", "Preview example")}
                  </button>
                ))}
                <button
                  className="context-action"
                  onClick={() => add("", "", active, true)}
                >
                  {t("ここにメモを添える", "Annotate this step")}
                </button>
              </>
            )}
            {!contextLesson && (
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
            )}
            {dirty && !contextLesson && (
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
