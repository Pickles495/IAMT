"use client";
import { useId } from "react";
import { ChevronRight } from "lucide-react";
import type { Note } from "@/lib/board-elements";
import { useLocale } from "./locale";
import { MathText } from "./math";

export function BoardReading({
  root,
  notes,
  toggle,
  reveal,
  close,
}: {
  root: Note;
  notes: Note[];
  toggle: (note: Note) => void;
  reveal: (step: number, parent: Note) => void;
  close: () => void;
}) {
  const { t } = useLocale();
  const prefix = useId();
  function body(n: Note) {
    return (
      <>
        <p>{n.text}</p>
        {n.tex && <MathText tex={n.tex} />}
      </>
    );
  }
  function branches(parent: Note, path: Set<string>) {
    const children = notes.filter(
      (n) => n.parent === parent.id && !path.has(n.id),
    );
    const choices =
      parent.embeddingStep === 0
        ? [1, 3]
        : parent.embeddingStep === 1
          ? [2]
          : [];
    const rows: { note?: Note; step?: number }[] = choices.map((step) => ({
      step,
      note: children.find((n) => n.embeddingStep === step),
    }));
    for (const n of children)
      if (!rows.some((row) => row.note === n)) rows.push({ note: n });
    return rows.map(({ note, step }) => {
      const expanded = !!note && !note.collapsed;
      const key = step === undefined ? note!.id : String(step);
      const id = prefix + parent.id + "-" + key;
      const label =
        step === 1
          ? t("なぜ候補は二つ？", "Why only two candidates?")
          : step === 2
            ? t("両方が埋め込みになる理由", "Why do both maps work?")
            : step === 3
              ? t("具体例で比較する", "Compare a concrete example")
              : note?.text || note?.tex || t("補足", "Related note");
      return (
        <section className="reading-branch" key={key}>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => (note ? toggle(note) : reveal(step!, parent))}
          >
            <ChevronRight size={16} aria-hidden="true" />
            <span>{label}</span>
          </button>
          <div id={id} hidden={!expanded} className="reading-detail">
            {expanded && note && (
              <>
                {body(note)}
                {branches(note, new Set([...path, note.id]))}
              </>
            )}
          </div>
        </section>
      );
    });
  }
  return (
    <section className="board-reading" aria-label={t("読む", "Reading view")}>
      <button type="button" onClick={close}>
        {t("← キャンバスに戻る", "← Back to canvas")}
      </button>
      <div className="reading-page">
        <h3>
          {root.embeddingStep === 0
            ? t("体の埋め込み", "Field embeddings")
            : t("選択したノート", "Selected note")}
        </h3>
        {body(root)}
        {branches(root, new Set([root.id]))}
      </div>
    </section>
  );
}
