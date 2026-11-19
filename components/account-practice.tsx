"use client";
import { useEffect, useRef, useState } from "react";
import { catalog, records, type Pack } from "@/lib/practice-catalog";
import { topics as concepts, type TopicId } from "@/lib/domain";
import { knowledgeNodes, type WorkspaceTopic } from "@/lib/personal-knowledge";
import { useLocale } from "./locale";
import { MathText } from "./math";
import "./account-practice.css";
type Question = (typeof catalog)[number];
function Problem({
  q,
  submit,
}: {
  q: Question;
  submit: (
    version: string,
    answer: string,
    seen: boolean,
    id: string,
  ) => Promise<void>;
}) {
  const { en, t } = useLocale(),
    [answer, set] = useState(""),
    [hint, setHint] = useState(false),
    [seen, reveal] = useState(false),
    [result, mark] = useState(""),
    [busy, wait] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null),
    retry = useRef("");
  function edit(value: string) {
    set(value);
    mark("");
    retry.current = "";
  }
  return (
    <article>
      <h3>{en ? q.en : q.ja}</h3>
      {q.tex && <MathText tex={q.tex} />}
      <label>
        {t("解答", "Answer")}
        <textarea
          ref={input}
          disabled={busy}
          value={answer}
          maxLength={10000}
          onChange={(e) => edit(e.target.value)}
        />
      </label>
      <div className="ap-tools">
        {["√", "±", "²", "π", "∞", "∈", "→"].map((sym) => (
          <button
            disabled={busy}
            key={sym}
            onClick={() => {
              const field = input.current;
              if (!field) return;
              const pos = field.selectionStart;
              edit(
                answer.slice(0, pos) + sym + answer.slice(field.selectionEnd),
              );
              requestAnimationFrame(() => {
                field.focus();
                field.setSelectionRange(pos + sym.length, pos + sym.length);
              });
            }}
          >
            {sym}
          </button>
        ))}
      </div>
      <div className="ap-tools">
        <button
          disabled={busy || !answer.trim() || !!result}
          onClick={async () => {
            wait(true);
            try {
              retry.current ||= crypto.randomUUID();
              await submit(q.id, answer, seen, retry.current);
              mark(q.grade(answer));
            } catch {
              /* Parent displays the error. */
            } finally {
              wait(false);
            }
          }}
        >
          {t("解答を保存", "Submit answer")}
        </button>
        <button onClick={() => setHint(!hint)} aria-expanded={hint}>
          {t("ヒント", "Hint")}
        </button>
        <button
          disabled={seen || busy}
          onClick={() => {
            reveal(true);
            retry.current = "";
          }}
        >
          {t("解説を表示", "Show explanation")}
        </button>
      </div>
      {hint && <p>{en ? q.hintEn : q.hint}</p>}
      {seen && <p>{en ? q.solutionEn : q.solution}</p>}
      <p role="status">
        {result === "correct"
          ? t("保存済み · 正解", "Saved · Correct")
          : result === "incorrect"
            ? t("保存済み · 要復習", "Saved · Review")
            : result
              ? t("保存済み · 自動判定対象外", "Saved · Ungraded")
              : ""}
      </p>
    </article>
  );
}
function Progress({
  packs,
  topics,
  review,
}: {
  packs: Pack[];
  topics: WorkspaceTopic[];
  review: (id: string) => void;
}) {
  const { t, en } = useLocale(),
    all = records(packs),
    graded = all.filter((r) => !r.solution_seen && r.result !== "inconclusive");
  const [filter, choose] = useState("");
  const history = all.filter(
    (r) =>
      !filter || r.pack.pv_package_topics.some((x) => x.topic_id === filter),
  );
  const latest = new Map<string, (typeof history)[number]>();
  for (const entry of history) {
    const k = entry.pack.id + "/" + entry.question_version;
    if (!latest.has(k)) latest.set(k, entry);
  }
  const revisit = [...latest.values()].filter(
    (r) => r.result === "incorrect" && !r.solution_seen,
  );
  const days = new Map<string, number>();
  for (const item of history) {
    const day = new Date(item.created_at).toLocaleDateString(en ? "en" : "ja");
    days.set(day, (days.get(day) ?? 0) + 1);
  }
  return (
    <>
      <h2>{t("演習の学習記録", "Practice progress")}</h2>
      <p>
        {t("全Topicの提出", "Submissions across topics")} {all.length} ·{" "}
        {t("採点対象の正解", "Correct among graded attempts")}{" "}
        {graded.filter((r) => r.result === "correct").length} / {graded.length}
      </p>
      <small>
        {t(
          "解説を見た提出と自動判定できない解答は、正解数の集計から除きます。",
          "Scoring excludes attempts after viewing an explanation and answers without an automatic grade.",
        )}
      </small>
      <label>
        {t("Topicで絞り込み", "Filter by topic")}
        <select value={filter} onChange={(e) => choose(e.target.value)}>
          <option value="">{t("すべて", "All")}</option>
          {topics.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
      {history.length > 0 ? (
        <>
          {revisit.length > 0 && (
            <section>
              <h3>{t("復習候補", "Review suggestions")}</h3>
              {revisit.map((r) => (
                <div key={r.id}>
                  <p>{en ? r.question?.en : r.question?.ja}</p>
                  <small>
                    {t(
                      "この問題の直近の提出が不正解でした。",
                      "Your latest attempt at this question was incorrect.",
                    )}
                  </small>{" "}
                  <button onClick={() => review(r.pack.id)}>
                    {t("復習する", "Review")}
                  </button>
                </div>
              ))}
            </section>
          )}
          <h3>{t("日別提出数", "Daily submissions")}</h3>
          <ul>
            {[...days].map(([day, count]) => (
              <li key={day}>
                {day} · {count}{" "}
                <meter
                  min={0}
                  max={Math.max(...days.values())}
                  value={count}
                  aria-label={day}
                />
              </li>
            ))}
          </ul>
          <h3>{t("解答履歴", "Attempt history")}</h3>
          <button
            onClick={() => {
              const entries = history.map((r) => ({
                submitted: r.created_at,
                package: r.pack.title,
                question: r.question_version,
                answer: r.answer,
                result: r.result,
                solutionSeen: r.solution_seen,
                topicIds: r.pack.pv_package_topics.map((x) => x.topic_id),
              }));
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(entries, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "practice-history.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            {t("表示中の履歴を書き出す", "Export filtered history")}
          </button>
          {history.map((r) => (
            <details key={r.id}>
              <summary>
                {r.pack.title} ·{" "}
                {r.result === "correct"
                  ? t("正解", "Correct")
                  : r.result === "incorrect"
                    ? t("要復習", "Review")
                    : t("未採点", "Ungraded")}{" "}
                · {new Date(r.created_at).toLocaleDateString(en ? "en" : "ja")}
              </summary>
              <p>{en ? r.question?.en : r.question?.ja}</p>
              <p>{r.answer}</p>
              {r.solution_seen && (
                <small>
                  {t(
                    "解説を表示後に提出",
                    "Submitted after viewing explanation",
                  )}
                </small>
              )}
              <button onClick={() => review(r.pack.id)}>
                {t("この演習を開く", "Open this package")}
              </button>
            </details>
          ))}
        </>
      ) : (
        <p>
          {t(
            "この範囲の解答履歴はまだありません。",
            "No attempts in this selection yet.",
          )}
        </p>
      )}
    </>
  );
}
export function AccountPractice({
  topics,
  token,
  close,
}: {
  topics: WorkspaceTopic[];
  token: string;
  close: () => void;
}) {
  const { en, t } = useLocale(),
    [packs, setPacks] = useState<Pack[]>([]),
    [view, show] = useState("practice"),
    [active, select] = useState(""),
    [ids, bind] = useState<string[]>([]),
    [concept, choose] = useState<TopicId>("galois"),
    [title, name] = useState(""),
    [msg, status] = useState(""),
    [busy, wait] = useState(false),
    [ready, loaded] = useState(false);
  const creation = useRef({ signature: "", id: "" });
  async function request(body?: object) {
    const r = await fetch("/api/pv1/practice", {
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
  async function run<T>(fn: () => Promise<T>) {
    status("");
    try {
      return await fn();
    } catch (e) {
      status(String(e));
      throw e;
    }
  }
  async function refresh() {
    setPacks(await request());
    loaded(true);
  }
  useEffect(() => {
    let here = true;
    request()
      .then((d) => {
        if (here) {
          setPacks(d);
          loaded(true);
        }
      })
      .catch((e) => {
        if (here) status(String(e));
      });
    return () => {
      here = false;
    };
  }, [token]);
  const current = packs.find((p) => p.id === active);
  return (
    <section className="pv-core account-practice">
      <header>
        <button onClick={close}>
          ← {t("個人ワークスペース", "Personal workspace")}
        </button>
        <nav>
          {["practice", "progress"].map((v) => (
            <button key={v} aria-pressed={view === v} onClick={() => show(v)}>
              {v === "practice" ? t("演習", "Practice") : "Learning Progress"}
            </button>
          ))}
        </nav>
      </header>
      {msg && <p role="alert">{msg}</p>}
      {!ready ? (
        msg ? (
          <button onClick={() => void run(refresh).catch(() => {})}>
            {t("再読み込み", "Retry")}
          </button>
        ) : (
          <p>{t("読み込み中…", "Loading…")}</p>
        )
      ) : view === "progress" ? (
        <Progress
          packs={packs}
          topics={topics}
          review={(id) => {
            select(id);
            show("practice");
          }}
        />
      ) : (
        <>
          <h2>{t("演習パック", "Practice packages")}</h2>
          <details open={!packs.length || undefined}>
            <summary>{t("パックを作成", "Create a package")}</summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  wait(true);
                  try {
                    const signature = JSON.stringify([ids, concept, title]);
                    if (creation.current.signature !== signature)
                      creation.current = { signature, id: crypto.randomUUID() };
                    const id = creation.current.id;
                    await request({
                      action: "create",
                      id,
                      title:
                        title.trim() ||
                        (en
                          ? concepts.find((c) => c.id === concept)!.english
                          : concepts.find((c) => c.id === concept)!.label),
                      topics: ids,
                      versions: catalog
                        .filter((q) => q.concept === concept)
                        .map((q) => q.id),
                    });
                    await refresh();
                    select(id);
                    creation.current = { signature: "", id: "" };
                  } finally {
                    wait(false);
                  }
                }).catch(() => {});
              }}
            >
              <fieldset disabled={busy}>
                <legend>
                  {t("関連する個人Topic", "Associated personal topics")}
                </legend>
                {topics.map((x) => (
                  <label key={x.id}>
                    <input
                      type="checkbox"
                      checked={ids.includes(x.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          bind([...ids, x.id]);
                          const c = knowledgeNodes([x]).find(
                            (n) => n.id === x.id,
                          )?.concept;
                          if (!ids.length && c) choose(c.id);
                        } else bind(ids.filter((id) => id !== x.id));
                      }}
                    />
                    {x.name}
                  </label>
                ))}
              </fieldset>
              <label>
                {t("出題分野（固定問題）", "Fixed question set")}
                <select
                  disabled={busy}
                  value={concept}
                  onChange={(e) => choose(e.target.value as TopicId)}
                >
                  {concepts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {en ? c.english : c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("パック名（任意）", "Package title (optional)")}
                <input
                  disabled={busy}
                  maxLength={200}
                  value={title}
                  onChange={(e) => name(e.target.value)}
                />
              </label>
              <button disabled={busy || ids.length === 0 || ids.length > 20}>
                {t("作成", "Create")}
              </button>
            </form>
          </details>
          {packs.length > 0 && (
            <label>
              {t("保存したパック", "Saved package")}
              <select value={active} onChange={(e) => select(e.target.value)}>
                <option value="">{t("選択", "Select")}</option>
                {packs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          {current && (
            <div key={current.id}>
              {current.questions.map((id) => {
                const q = catalog.find((x) => x.id === id);
                return (
                  q && (
                    <Problem
                      key={id}
                      q={q}
                      submit={(version, answer, seen, attempt) =>
                        run(async () => {
                          await request({
                            action: "submit",
                            id: attempt,
                            pack: current.id,
                            version,
                            answer,
                            seen,
                          });
                          await refresh();
                        })
                      }
                    />
                  )
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
