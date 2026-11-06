# PV1無課金フェーズの監査とバックログ

2026-11-06。ユーザーの「PV1軌道修正・品質向上・無課金自律実装指示書」を優先する。

## 確認できた基準点

- main は a8f4c58、pv1/integration は 83ce5cc、開発先 pv1/m2-learning は c6f04a2。
- PR #17 は開発先へマージ済み。PR #18 は変更前後を見せる提案UIのDraft。#7 は開発先から統合先への未マージPR。
- 仕様ファイルは docs/technical-specification-v4.md、docs/pv1-m1.md、docs/pv1-m2.md、docs/pv1-adaptive-plan.md。調査したファイル一覧にV5はない。
- Next.js / React / TypeScript、Supabaseの認証・REST、KaTeX、Playwrightを利用。
- supabase/migrations にTopic、Board、会話、改訂番号、演習、分類とRLSが存在。tests/pv1.test.ts は使い捨てPGliteで所有者分離・保存・改訂競合を検証する。共有Supabaseの適用済み履歴は今回未確認。
- Vercelは未署名コミットをブロックし、GitHub署名済みの同一treeでは成功した。Preview成功はアカウント操作成功の証拠に含めない。
- 過去の画面ではmainがProduction追跡先。現在のVercel設定・無料枠使用量・請求設定は今回直接確認できていない。自動Previewの追加実行はこの確認を依存条件にする。

## コスト境界

旧実装は PV1_LIVE_TUTOR=1 と資格情報で推論に進む。今回 ai/execution-policy.ts を追加し、MOCK / DISABLED / LIVE_GATED を区別する。LIVE_GATEDでも外部推論は禁止する。解除は将来の明示承認とコード変更を必要とする。

Topic推定、Board応答、イベントディスパッチャの境界で有料経路を遮断する。固定例はMOCKだけで利用する。テストはfetchを置換し、直接のAdapter呼び出しでも外部通信が0件であることを検証する。APIキーの設定変更や有料APIの実行は行わない。

## 工程別の達成状況と次の受入条件

| 工程 | 状態    | コード上の現状と不足                                                | 次の受入条件                                                         |
| ---- | ------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| M1   | Partial | Topic/Board/Conversation、RLS、改訂保存。共通AIポリシーを追加       | 旧資格情報が残っていても外部推論0件。既存保存テスト成功              |
| M2   | Partial | 個人Board編集、親子補足、右Tutor、Undo/Redo。視点は再訪時にリセット | Topic内のBoard切替で内容と視点が復元。初期問いへの固定教材フロー改善 |
| M3   | Partial | personal-knowledge.ts の分類・関係をTree/Mapで共有                  | 複数分類所属、focus展開、密度の高い表示を検証                        |
| M4   | Partial | account-practice.tsx と固定Practice catalog、attempt保存            | 数式入力の範囲・等価性判定限界を明示し、Category横断を検証           |
| M5   | Partial | 実提出による集計                                                    | Board活動・履歴から根拠付き導線を追加。AI理解度は未実装              |
| M6   | Partial | 日本語・英語、CI、画面幅テスト                                      | 5候補言語の根拠調査、実画面の横断検証                                |
| AB1  | Partial | ID、parent、memoKind、revision                                      | 意味関係と配置を分離した互換スキーマ、旧データ往復試験               |
| AB2  | Partial | 個人問い→解答、固定教材の近傍展開                                   | 視点復元、深い階層と長い証明、多数Blockの安定性                      |
| AB3  | Partial | 提案確認と競合検出、PR #18で参照元と変更後を提示                    | 型付き操作の拡張・拒否・Undo・競合をfixtureで検証                    |
| AB4  | Partial | Knowledgeから保存Boardへ移動、PracticeとProgressの接続              | 同一TopicのBoard/演習/学習イベントを一貫した導線にする               |
| UI1  | Partial | 無彩色トークンとナビ現在地                                          | 残存色、寸法、余白、コントラストの全画面監査                         |
| UI2  | Partial | Boardと右Tutor、個人画面                                            | モバイルの切替、Topic内複数Boardの発見しやすさ                       |
| UI3  | Partial | inline折り畳み、Escで階層を戻る                                     | 再訪時の焦点維持、編集プレビューの実画面検証                         |
| UI4  | Partial | 前回PC/モバイル比較。現環境ではブラウザの取得に失敗                 | 1440/768/390pxで数式・高密度・エラー状態の証拠を残す                 |

実モデル接続は全ロールでBlocked。基盤コードの存在、fixtureでの成功、実モデル動作は別の証拠として管理する。

## 実装順と依存関係

1. M1の有料経路遮断を独立PRにする。DB変更なし。既存PR #18と競合しないファイルを使用。
2. M2/AB2/UI3のBoard別の視点復元を進める。初期実装は端末内の表示状態のみ保存する。クラウド同期は未実装と明示する。
3. UI1/UI2/UI4のTopic開始・Board/Tutorの幅比とモバイル切替を実画面で評価する。ブラウザが利用できなければ視覚品質を完了にしない。

PRのマージ、mainへの反映、共有DB適用、有料利用、最終ロゴ採用は個別承認が必要。現在のProductionブランチ設定、請求設定、Previewアクセスは外部サービス確認待ち。
