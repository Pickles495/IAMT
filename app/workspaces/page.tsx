"use client";
import { AccountPractice } from "@/components/account-practice";
import { suggestedTopic } from "@/lib/question-topic";
import { PersonalBoard } from "@/components/personal-board";
import { useState } from "react";
import { useLocale } from "@/components/locale";
import { PersonalKnowledge } from "@/components/personal-knowledge";
import type { WorkspaceTopic as Topic } from "@/lib/personal-knowledge";
export default function Workspaces() {
  const { t, en } = useLocale();
  const [token, auth] = useState(""),
    [topics, list] = useState<Topic[]>([]),
    [msg, notice] = useState(""),
    [busy, wait] = useState(false);
  const [board, openBoard] = useState<{
    id: string;
    title: string;
    prompt?: string;
  } | null>(null);
  const [practice, openPractice] = useState(false);
  const [explore, setExplore] = useState(false);
  const [live, setLive] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [topicName, setTopicName] = useState<string | null>(null);
  const [topicId, pickTopic] = useState<string | null>(null);
  const [boardId, pickBoard] = useState("");
  const suggested = suggestedTopic(prompt, topics);
  const matching = topics.filter(
    (x) =>
      x.name.normalize("NFKC").toLowerCase() ===
      suggested.normalize("NFKC").toLowerCase(),
  );
  const destination =
    topicId ??
    (matching.length === 1 ? matching[0].id : matching.length ? "" : "new");
  const chosen = topics.find((x) => x.id === destination);
  const boards = chosen?.pv_boards ?? [];
  const selectedBoard =
    boards.find((b) => b.id === boardId) ??
    (boards.length === 1 ? boards[0] : undefined);
  function resetDestination() {
    pickTopic(null);
    pickBoard("");
    setTopicName(null);
  }
  async function startQuestion() {
    const name = (topicName ?? suggested).trim(),
      text = prompt.trim();
    if (!name || !text) return;
    let current = chosen;
    let target = selectedBoard;
    if (destination === "new") {
      const [created] = await request(token, {
        action: "create",
        name,
        locale: en ? "en" : "ja",
      });
      const refreshed: Topic[] = await request(token);
      list(refreshed);
      current = refreshed.find((x) => x.id === created.id);
      target = current?.pv_boards[0];
    }
    if (!target || !current)
      throw Error(t("Boardを開けませんでした", "Could not open board"));
    openBoard({
      id: target.id,
      title: current.name + " · " + target.title,
      prompt: text,
    });
    setPrompt("");
    resetDestination();
  }
  async function request(key: string, body?: object) {
    const r = await fetch("/api/pv1", {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const out = await r.json();
    if (!r.ok) throw Error(out.error);
    return out;
  }
  async function run(fn: () => Promise<void>) {
    wait(true);
    notice("");
    try {
      await fn();
    } catch (e) {
      notice(String(e));
    } finally {
      wait(false);
    }
  }
  if (practice && token)
    return (
      <AccountPractice
        token={token}
        topics={topics}
        close={() => openPractice(false)}
      />
    );
  const boardView =
    board && token ? (
      <PersonalBoard
        key={board.id}
        boardId={board.id}
        title={board.title}
        token={token}
        initialPrompt={board.prompt}
        close={() => openBoard(null)}
      />
    ) : null;
  return (
    <>
      {" "}
      {boardView}
      <section hidden={!!boardView} className="pv-core">
        <h1>{t("個人ワークスペース", "Personal workspace")}</h1>
        {!token ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              void run(async () => {
                const { token: key, live: enabled } = await request("", {
                  action: "login",
                  email: form.get("email"),
                  password: form.get("password"),
                });
                list(await request(key));
                setLive(enabled === true);
                auth(key);
              });
            }}
          >
            <input
              name="email"
              type="email"
              aria-label="Email"
              placeholder="Email"
              required
            />
            <input
              name="password"
              type="password"
              aria-label="Password"
              placeholder="Password"
              required
            />
            <button disabled={busy}>{t("ログイン", "Sign in")}</button>
          </form>
        ) : (
          <>
            <button
              onClick={() => {
                auth("");
                setExplore(false);
                setPrompt("");
                resetDestination();
                list([]);
              }}
            >
              {t("ログアウト", "Sign out")}
            </button>
            <button
              aria-expanded={explore}
              onClick={() => setExplore(!explore)}
            >
              {t("知識構造を探索", "Explore knowledge")}
            </button>
            <button onClick={() => openPractice(true)}>
              {t("個人演習・学習記録", "My practice and progress")}
            </button>
            {explore && (
              <PersonalKnowledge
                token={token}
                topics={topics}
                open={(id, title) => openBoard({ id, title })}
              />
            )}
            <form
              hidden={explore}
              className="m2-start"
              onSubmit={(e) => {
                e.preventDefault();
                void run(startQuestion);
              }}
            >
              <label>
                {t("学びたいこと", "Your math question")}
                <textarea
                  required
                  maxLength={3000}
                  placeholder={t(
                    "例：ガロア理論で √2 の像が二つあるのはなぜ？",
                    "Why are there two possible images of √2 in Galois theory?",
                  )}
                  disabled={busy}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </label>
              {prompt.trim() && (
                <div className="destination-fields">
                  <label>
                    {t("保存先のTopic", "Topic for this question")}
                    <select
                      value={destination}
                      disabled={busy}
                      required
                      onChange={(e) => {
                        pickTopic(e.target.value);
                        pickBoard("");
                      }}
                    >
                      <option value="" disabled>
                        {t("Topicを選択", "Choose topic")}
                      </option>
                      {topics.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                          {topics.some((y) => y !== x && y.name === x.name)
                            ? " · " + x.id.slice(-8)
                            : ""}
                        </option>
                      ))}
                      <option value="new">
                        {t("新しいTopic", "New topic")}
                      </option>
                    </select>
                  </label>
                  {destination === "new" && (
                    <label>
                      {t("新しいTopic名", "New topic name")}
                      <input
                        required
                        maxLength={200}
                        disabled={busy}
                        value={topicName ?? suggested}
                        onChange={(e) => setTopicName(e.target.value)}
                      />
                    </label>
                  )}
                  {chosen && (
                    <label>
                      {t("保存先のBoard", "Destination board")}
                      <select
                        required
                        disabled={busy}
                        value={selectedBoard?.id ?? ""}
                        onChange={(e) => pickBoard(e.target.value)}
                      >
                        <option disabled value="">
                          {t("Boardを選択", "Choose board")}
                        </option>
                        {boards.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title}
                            {boards.some((x) => x !== b && x.title === b.title)
                              ? " · " + b.id.slice(-8)
                              : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}
              {live && prompt.trim() && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const result = await request(token, {
                        action: "suggestTopic",
                        question: prompt,
                        locale: en ? "en" : "ja",
                      });
                      const matches = topics.filter(
                        (x) => x.name === result.name,
                      );
                      pickTopic(
                        matches.length === 1
                          ? matches[0].id
                          : matches.length
                            ? ""
                            : "new",
                      );
                      pickBoard("");
                      setTopicName(result.name);
                    })
                  }
                >
                  {t(
                    "TutorにTopicを提案してもらう",
                    "Suggest a topic with Tutor",
                  )}
                </button>
              )}
              <button
                disabled={
                  busy ||
                  !prompt.trim() ||
                  (destination !== "new" && !selectedBoard)
                }
              >
                {t("質問からBoardを開く", "Open board with question")}
              </button>
            </form>
            <details className="workspace-import">
              <summary>{t("データの取り込み", "Import data")}</summary>
              <label>
                {t("V4のJSONを選んで取り込む", "Import V4 JSON")}
                <input
                  type="file"
                  accept=".json"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void run(async () => {
                      if (file.size > 2000000) throw Error("2 MB limit");
                      const old = JSON.parse(await file.text());
                      if (
                        old.version !== 1 ||
                        !Array.isArray(old.messages) ||
                        !Array.isArray(old.attempts)
                      )
                        throw Error("Invalid V4 export");
                      const cards = old.board ?? [];
                      if (!Array.isArray(cards)) throw Error("Invalid board");
                      if (
                        !window.confirm(
                          t(
                            "Board要素 " +
                              cards.length +
                              "件、会話メッセージ " +
                              old.messages.length +
                              "件と履歴を個人DBに保存しますか？",
                            "Import " +
                              cards.length +
                              " elements, " +
                              old.messages.length +
                              " messages and history into your account?",
                          ),
                        )
                      )
                        return;
                      await request(token, {
                        action: "import",
                        payload: {
                          cards,
                          messages: old.messages,
                          original: old,
                        },
                      });
                      list(await request(token));
                      notice(t("取り込み済み", "Imported"));
                    });
                  }}
                />
              </label>
            </details>
            {[null, ...topics].map((topic) => (
              <article key={topic?.id ?? "new"}>
                {topic && (
                  <>
                    <h2>{topic.name}</h2>
                    <p>
                      {topic.pv_boards.map((x) => (
                        <button
                          key={x.id}
                          onClick={() =>
                            openBoard({
                              id: x.id,
                              title: topic.name + " · " + x.title,
                            })
                          }
                        >
                          {x.title} ↗
                        </button>
                      ))}
                    </p>
                    <p>
                      Tutor ·{" "}
                      {topic.pv_conversations.map((x) => x.title).join(", ")}
                    </p>
                  </>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = e.currentTarget,
                      values = new FormData(f);
                    void run(async () => {
                      await request(token, {
                        action: values.get("action") ?? "create",
                        topicId: topic?.id,
                        revision: topic?.revision,
                        name: values.get("name"),
                        locale: en ? "en" : "ja",
                      });
                      list(await request(token));
                      f.reset();
                    });
                  }}
                >
                  {topic && (
                    <select name="action" aria-label={t("操作", "Action")}>
                      <option value="rename">
                        {t("Topic名変更", "Rename topic")}
                      </option>
                      <option value="board">
                        {t("Board追加", "Add board")}
                      </option>
                      <option value="conversation">
                        {t("会話追加", "Add conversation")}
                      </option>
                    </select>
                  )}
                  <input
                    name="name"
                    aria-label={t("名前", "Name")}
                    placeholder={t("名前", "Name")}
                    required
                    maxLength={200}
                  />
                  <button disabled={busy}>
                    {topic ? t("保存", "Save") : t("Topic作成", "Create topic")}
                  </button>
                </form>
              </article>
            ))}
          </>
        )}
        <p role="status">{msg}</p>
      </section>
    </>
  );
}
