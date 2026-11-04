"use client";
import { useState } from "react";
import { Download, Trash2, ShieldCheck } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
export default function Settings() {
  const { state, setState, clear } = useDemo();
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "iamt-demo-data.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("JSONを書き出しました。");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE IT YOURS</div>
          <h1>学び方も、データも、あなたの手に。</h1>
          <p>設定はいつでも変更できます。このブラウザにだけ保存されます。</p>
        </div>
      </div>
      <div className="settings-layout">
        <section className="panel content-pad">
          <h2>学習の表示</h2>
          <label className="setting-row">
            <span>
              <strong>Boardの解説量</strong>
              <small>明示的な設定を優先します。</small>
            </span>
            <select
              aria-label="Boardの解説量"
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
              <option value="detailed">詳しく</option>
              <option value="compact">簡潔に</option>
            </select>
          </label>
          <h2>分析とパーソナライズ</h2>
          <Toggle
            label="会話からの学習傾向分析を許可"
            text="初期設定はオフ。現在は設定の保存のみで、分析は実行しません。"
            checked={state.preferences.analytics}
            onChange={(value) =>
              setState((s) => ({
                ...s,
                preferences: { ...s.preferences, analytics: value },
              }))
            }
          />
          <Toggle
            label="学習傾向を提案・表示に利用"
            text="現在は未接続。オンにしても、このデモの内容は変わりません。"
            checked={state.preferences.personalization}
            onChange={(value) =>
              setState((s) => ({
                ...s,
                preferences: { ...s.preferences, personalization: value },
              }))
            }
          />
          <p className="fine-print">
            本番の分析・外部AIへの送信を開始する際は、別途、機能とデータの扱いを明示する必要があります。
          </p>
          <h2>デモデータの管理</h2>
          <p>会話・演習の記録・保存トピック・設定をまとめて管理します。</p>
          <div className="button-row">
            <button className="button secondary" onClick={exportData}>
              <Download size={16} /> JSONを書き出す
            </button>
            <button className="button danger" onClick={() => setConfirm(true)}>
              <Trash2 size={16} /> このブラウザの記録を削除
            </button>
          </div>
          {confirm && (
            <div className="delete-confirm" role="alert">
              <p>
                会話・演習・設定をすべて削除し、初期状態に戻します。先に必要なデータを書き出してください。
              </p>
              <div className="button-row">
                <button
                  className="button danger"
                  onClick={() => {
                    clear();
                    setConfirm(false);
                    setNotice("このブラウザのデモ記録を削除しました。");
                  }}
                >
                  すべて削除する
                </button>
                <button
                  className="button secondary"
                  onClick={() => setConfirm(false)}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
          <p role="status">{notice}</p>
        </section>
        <aside className="soft-card">
          <ShieldCheck size={25} />
          <h2>このドラフトの接続状況</h2>
          <dl className="connection-list">
            <div>
              <dt>実AI</dt>
              <dd>未接続</dd>
            </div>
            <div>
              <dt>認証・アカウント</dt>
              <dd>未接続</dd>
            </div>
            <div>
              <dt>クラウドDB</dt>
              <dd>未接続</dd>
            </div>
            <div>
              <dt>Organizer / Progress AI</dt>
              <dd>未接続</dd>
            </div>
            <div>
              <dt>ブラウザ保存</dt>
              <dd>localStorage</dd>
            </div>
          </dl>
          <p className="fine-print">
            共有端末では、このブラウザを使う他の人が記録を閲覧できます。外部の解析サービスやモデルには送信しません。
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
