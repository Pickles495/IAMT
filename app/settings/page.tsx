"use client";
import { useLocale } from "@/components/locale";
import { useState } from "react";
import { Download, Trash2, ShieldCheck } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
export default function Settings() {
  const { t: tx, en } = useLocale();
  const { state, setState, clear } = useDemo();
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  function exportData() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              ...state,
              board: JSON.parse(
                localStorage.getItem("iamt-board-v4") || "null",
              ),
              answerDrafts: Object.fromEntries(
                Object.keys(localStorage)
                  .filter((k) => k.startsWith("iamt-answer-"))
                  .map((k) => [k, localStorage.getItem(k)]),
              ),
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "iamt-demo-data.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice(tx("JSONを書き出しました。", "JSON exported."));
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE IT YOURS</div>
          <h1>{tx("設定", "Settings")}</h1>
          <p>
            {tx(
              "設定はいつでも変更できます。このブラウザにだけ保存されます。",
              "Settings are saved in this browser and can be changed at any time.",
            )}
          </p>
        </div>
      </div>
      <div className="settings-layout">
        <section className="panel content-pad">
          <h2>{tx("学習の表示", "Learning display")}</h2>
          <label className="setting-row">
            <span>
              <strong>{tx("Boardの解説量", "Board detail")}</strong>
              <small>
                {tx(
                  "明示的な設定を優先します。",
                  "Your display preference takes priority.",
                )}
              </small>
            </span>
            <select
              aria-label={tx("Boardの解説量", "Board detail")}
              value={state.preferences.detail}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  preferences: {
                    ...s.preferences,
                    detail: e.target.value as "compact" | "detailed",
                  },
                }))
              }
            >
              <option value="detailed">{tx("詳しく", "Detailed")}</option>
              <option value="compact">{tx("簡潔に", "Compact")}</option>
            </select>
          </label>
          <h2>{tx("分析とパーソナライズ", "Analysis and personalization")}</h2>
          <Toggle
            label={tx(
              "会話からの学習傾向分析を許可",
              "Allow conversation analysis",
            )}
            text={tx(
              "初期設定はオフ。現在は設定の保存のみで、分析は実行しません。",
              "Off by default. This demo saves the preference but does not perform analysis.",
            )}
            checked={state.preferences.analytics}
            onChange={(value) =>
              setState((s) => ({
                ...s,
                preferences: { ...s.preferences, analytics: value },
              }))
            }
          />
          <Toggle
            label={tx(
              "学習傾向を提案・表示に利用",
              "Use learning patterns for recommendations",
            )}
            text={tx(
              "現在は未接続。オンにしても、このデモの内容は変わりません。",
              "Not connected. Enabling this does not change demo content.",
            )}
            checked={state.preferences.personalization}
            onChange={(value) =>
              setState((s) => ({
                ...s,
                preferences: { ...s.preferences, personalization: value },
              }))
            }
          />
          <p className="fine-print">
            {tx(
              "本番の分析・外部AIへの送信を開始する際は、別途、機能とデータの扱いを明示する必要があります。",
              "Analysis and external AI data handling must be explained before enabling those services.",
            )}
          </p>
          <h2>{tx("デモデータの管理", "Demo data")}</h2>
          <p>
            {tx(
              "会話・演習・Board・下書き・保存トピック・学習設定を管理します。",
              "Manage conversations, attempts, saved topics, board elements, answer drafts and preferences.",
            )}
          </p>
          <div className="button-row">
            <button className="button secondary" onClick={exportData}>
              <Download size={16} />
              {tx("JSONを書き出す", "Export JSON")}
            </button>
            <button className="button danger" onClick={() => setConfirm(true)}>
              <Trash2 size={16} />
              {tx("このブラウザの記録を削除", "Delete browser records")}
            </button>
          </div>
          {confirm && (
            <div className="delete-confirm" role="alert">
              <p>
                {tx(
                  "学習データと学習設定を削除します。UI言語・サイドバー表示は保持します。先に必要なデータを書き出してください。",
                  "Delete learning data and learning preferences. Language and sidebar display are retained. Export any data you need first.",
                )}
              </p>
              <div className="button-row">
                <button
                  className="button danger"
                  onClick={() => {
                    clear();
                    setConfirm(false);
                    setNotice(
                      tx(
                        "このブラウザのデモ記録を削除しました。",
                        "Demo records deleted.",
                      ),
                    );
                  }}
                >
                  {tx("すべて削除する", "Delete all")}
                </button>
                <button
                  className="button secondary"
                  onClick={() => setConfirm(false)}
                >
                  {tx("キャンセル", "Cancel")}
                </button>
              </div>
            </div>
          )}
          <p role="status">{notice}</p>
        </section>
        <aside className="soft-card">
          <ShieldCheck size={25} />
          <h2>{tx("このドラフトの接続状況", "Service connections")}</h2>
          <dl className="connection-list">
            <div>
              <dt>{tx("実AI", "Live AI")}</dt>
              <dd>{tx("未接続", "Not connected")}</dd>
            </div>
            <div>
              <dt>{tx("認証・アカウント", "Authentication / accounts")}</dt>
              <dd>{tx("未接続", "Not connected")}</dd>
            </div>
            <div>
              <dt>{tx("クラウドDB", "Cloud database")}</dt>
              <dd>{tx("未接続", "Not connected")}</dd>
            </div>
            <div>
              <dt>Organizer / Progress AI</dt>
              <dd>{tx("未接続", "Not connected")}</dd>
            </div>
            <div>
              <dt>{tx("ブラウザ保存", "Browser storage")}</dt>
              <dd>localStorage</dd>
            </div>
          </dl>
          <p className="fine-print">
            {tx(
              "共有端末では、このブラウザを使う他の人が記録を閲覧できます。外部の解析サービスやモデルには送信しません。",
              "Other users of a shared browser can see these records. Data is not sent to analytics services or AI models.",
            )}
          </p>
        </aside>
      </div>
    </>
  );
}
function Toggle({
  label,
  text,
  checked,
  onChange,
}: {
  label: string;
  text: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="setting-row">
      <span>
        <strong>{label}</strong>
        <small>{text}</small>
      </span>
      <input
        type="checkbox"
        className="toggle"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
