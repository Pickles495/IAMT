"use client";
import { useId } from "react";
import { ChevronRight } from "lucide-react";
import { memoKinds, type Note } from "@/lib/board-elements";
import { useLocale } from "./locale";
import { MathText } from "./math";

export function BoardReading({
  root,
  notes,
  toggle,
  reveal,
  select,
  editor,
  attach,
}: {
  root: Note;
  notes: Note[];
  toggle: (note: Note) => void;
  reveal: (step: number, parent: Note) => void;
  select: (id: string) => void;
  editor: (n: Note) => React.ReactNode;
  attach: (n: Note) => React.ReactNode;
}) {
  const { t } = useLocale();
  const prefix = useId();
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
      const [firstLine, ...followingLines] = (note?.text.trim() ?? "").split(
        "\n",
      );
      const formulaTitle =
        step === undefined && !firstLine ? note?.tex : undefined;
      const detailText =
        step === undefined ? followingLines.join("\n") : note?.text;
      const label =
        step === 1
          ? t("なぜ候補は二つ？", "Why only two candidates?")
          : step === 2
            ? t("両方が埋め込みになる理由", "Why do both maps work?")
            : step === 3
              ? t("具体例で比較する", "Compare a concrete example")
              : firstLine || t("補足", "Related note");
      return (
        <section
          className="reading-branch"
          key={key}
          onKeyDown={(event) => {
            if (
              event.key !== "Escape" ||
              !expanded ||
              !note ||
              event.nativeEvent.isComposing ||
              (event.target instanceof HTMLElement &&
                event.target.closest("textarea, input, select"))
            )
              return;
            event.preventDefault();
            event.stopPropagation();
            toggle(note);
            select(parent.id);
            event.currentTarget.querySelector("button")?.focus();
          }}
        >
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => {
              if (note) {
                toggle(note);
                select(expanded ? parent.id : note.id);
              } else reveal(step!, parent);
            }}
          >
            <ChevronRight size={16} aria-hidden="true" />
            {note?.memoKind && note.memoKind !== "memo" && (
              <small className="branch-kind">
                {t(memoKinds[note.memoKind][0], memoKinds[note.memoKind][1])}
              </small>
            )}
            <span className="branch-label">
              {formulaTitle ? (
                <MathText tex={formulaTitle} display={false} />
              ) : (
                label
              )}
            </span>
          </button>
          <div id={id} hidden={!expanded} className="reading-detail">
            {expanded && note && (
              <>
                <div
                  data-inline-note={note.id}
                  tabIndex={0}
                  onFocus={(e) => {
                    if (e.target === e.currentTarget) select(note.id);
                  }}
                  onClick={() => select(note.id)}
                >
                  {editor(note) ?? (
                    <>
                      {detailText && <p>{detailText}</p>}
                      {note.tex && !formulaTitle && <MathText tex={note.tex} />}
                      {attach(note)}
                    </>
                  )}
                </div>
                {branches(note, new Set([...path, note.id]))}
              </>
            )}
          </div>
        </section>
      );
    });
  }
  return (
    <div className="inline-branches">{branches(root, new Set([root.id]))}</div>
  );
}
