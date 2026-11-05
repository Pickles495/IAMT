"use client";
import { suggestedTopic } from "@/lib/question-topic";
import { PersonalBoard } from "@/components/personal-board";
import { useState } from "react";
import { useLocale } from "@/components/locale";
type Topic = {
  id: string;
  name: string;
  revision: number;
  pv_boards: { id: string; title: string }[];
  pv_conversations: { id: string; title: string }[];
};
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
  const [live, setLive] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [topicName, setTopicName] = useState<string | null>(null);
  const suggested = suggestedTopic(prompt, topics);
  async function startQuestion() {
    const name = (topicName ?? suggested).trim(),
      text = prompt.trim();
    if (!name || !text) return;
    let current = topics.find(
      (x) => x.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (!current) {
      const [created] = await request(token, {
        action: "create",
        name,
        locale: en ? "en" : "ja",
      });
      const refreshed: Topic[] = await request(token);
      list(refreshed);
      current = refreshed.find((x) => x.id === created.id);
    }
    const target =
      current?.pv_boards.find((x) => x.title === "Board") ??
      current?.pv_boards[0];
    if (!target || !current)
      throw Error(t("Boardを開けませんでした", "Could not open board"));
    openBoard({
      id: target.id,
      title: current.name + " · " + target.title,
      prompt: text,
    });
    setPrompt("");
    setTopicName(null);
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
  if (board && token)
    return (
      <PersonalBoard
        key={board.id}
        boardId={board.id}
        title={board.title}
        token={token}
        initialPrompt={board.prompt}
        close={() => openBoard(null)}
      />
    );
  return (
    <section className="pv-core">
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
              setPrompt("");
              setTopicName(null);
              list([]);
            }}
          >
            {t("ログアウト", "Sign out")}
          </button>
          <form
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
              <label>
                {t("保存先のTopic", "Topic for this question")}
                <input
                  required
                  maxLength={200}
                  disabled={busy}
                  list="m2-topic-options"
                  value={topicName ?? suggested}
                  onChange={(e) => setTopicName(e.target.value)}
                />
                <datalist id="m2-topic-options">
                  {topics.map((x) => (
                    <option key={x.id} value={x.name} />
                  ))}
                </datalist>
              </label>
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
            <button disabled={busy || !prompt.trim()}>
              {t("質問からBoardを開く", "Open board with question")}
            </button>
          </form>
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
                    payload: { cards, messages: old.messages, original: old },
                  });
                  list(await request(token));
                  notice(t("取り込み済み", "Imported"));
                });
              }}
            />
          </label>
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
                    <option value="board">{t("Board追加", "Add board")}</option>
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
  );
}
