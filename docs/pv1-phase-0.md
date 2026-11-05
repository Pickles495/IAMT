# Integrated AI Math Tutor · PV1 設計レビュー
2026年11月5日。承認対象はPreview環境でのM1〜M6。Productionへのマージ、課金開始、学習記録の外部移送は個別判断とする。

## 基準点と差分
調査基準はPickles495/IAMT の main e07274f。最新の統合済み仕様は docs/technical-specification-v4.md。ローカルに feat/v5-topic-workspaces ブランチがあるが、調査時のリモートにはV5実装・仕様書がない。V5の要望は以下のM1、M2、M3、M4へ取り込む。

|領域|実装済み|PV1で必要な変更|
|---|---|---|
|基盤|Next.js App Router 16、React 19、TypeScript、Node 22、Vercel。ページは静的にビルドできる|認証付きサーバーAPIと利用者ごとの永続化|
|保存|iamt-demo-v1 に会話・試行・設定、iamt-board-v4 にカード配列、問題別下書き。JSON書出しと削除|Topicごとの複数Board、版管理、端末間の復元|
|Board|有限キャンバス、カードの移動・固定幅切替、ズーム、右下Tutor。会話はトピック別、カードは混在|右パネル、要素参照、自由なサイズ、関連線、補記、履歴|
|地図|6個の固定Topic ID、分類と関係を別表現、Tree/Graphで選択を共有|可変ID、分類提案、本人用の関係、近傍展開|
|Practice|6題、テキストとLaTeX、KaTeX表示、ヒント、解答例閲覧後の集計除外|Package・版・対象範囲・視覚入力・検証済み生成問題|
|Progress|実際の試行数と限定照合、架空の分析表示例|期間別の活動、根拠付き仮説、訂正・削除|
|AI・認証|ai/gateway.tsは固定デモ。画面の応答も固定。mainには外部モデル呼出し・認証・DBマイグレーションがない|4役、所有者認可、予算、必要なデータだけの送信|
|デザイン|独自CSS、Lucide、同梱日本語フォント、日英文字列、折り畳みナビ|無彩色トークン、幾何学ロゴ、共通の余白・焦点表示、翻訳カタログ|
|配信|GitHub Actionsで型・整形・単体・build・Playwright。V4のPR PreviewとmainコミットにVercel成功記録あり|Preview用DB・鍵・利用枠を独立。本番ドメイン割当はリリース時に実測|

今回既存単体テスト5件が成功。過去のV4 Preview成功と現在の本番ドメインの内容は別々に扱う。今回の調査で本番ドメインや管理者設定の変更・稼働検査は行っていない。

## 推奨構成とデータ契約
既存Next.jsを維持。ブラウザ→Route Handler→セッション検証→所有者限定Repository→Postgresという流れにする。Supabase Auth + Postgres/RLSを第一候補とし、Previewは招待制。AI呼出しはサーバーから行う。RLSに加え、すべての参照IDが同じworkspaceに属するか検査する。秘密鍵をクライアントに渡さない。

|構造|関連と整合性|
|---|---|
|User / Workspace / Preferences / Consent|PV1は個人所有。分析許可・本文利用・送信言語を個別管理|
|Concept / ConceptLabel / Classification|共有の概念IDと多言語名。分類木の親子参照は循環禁止。個人の新規Topicは公開語彙に自動追加しない|
|Topic / TopicRelation|個人Topicは任意で共有概念を参照。意味、方向、根拠、出所、採否を保存。初期は順序尺度で「主要・補助」を表示し、理解度への換算を避ける|
|Board / Element / Edge / Edit|Topic 1対多 Board。本文・型・座標・寸法、端点、groupId、親要素、revision。履歴は操作と逆操作を対で保存|
|Conversation / Message / ElementRef|所属Topic、任意のBoard、選択要素と参照時の版。質問から解答メモへの参照を保持|
|Package / PackageTopic / PackageCategory / QuestionVersion / Attempt|順序・難度・対象・rubric・解答例。提出時の問題版、原答案、ヒント数、解答例閲覧を固定|
|Activity / Insight / Evidence / Correction|元イベント、対象期間、観測値、仮説、ユーザー訂正。根拠の削除時は再計算または撤回|
|Outbox / Job / Usage|業務変更とイベントを同一トランザクションに記録。イベントID・役割・入力版に一意制約|

移行は追加型。6個の旧IDから新IDへの対応表を使い、旧Boardのカードをtopic別に分割する。会話・試行の原文と時刻を保持。不正な項目は隔離して件数と理由を示す。移行前エクスポート、件数プレビュー、本人による明示インポート、重複防止キー、照合後の復元テストを必須にする。

## AI実行設計
すべての役割が、所有者、Topic、言語、参照可能なID、出力スキーマ、最大トークンを受け取る。モデル名とプロンプト版を記録する。Tutorは対話時に同期実行し、説明と型付き編集案を返す。編集案には対象IDと期待revisionを含め、競合時は差分を示して再確認する。StructureはTopic作成・分類変更イベント、QuestionはPackage生成要求、Analyserは同意のある期間集計後または明示要求で実行する。四役の一斉呼出しを避ける。後三者はPostgresジョブのリース取得・期限・有限回の再試行・失敗状態を実装する。サーバーレスのHTTP終了後にメモリ上で処理を続ける前提を置かない。

数値・有限解集合は定義域・許容誤差・検算規則を持つ。生成問題の解と採点規則を独立検証し、検証できない問題は保留。証明は基準別の講評と根拠を返す。分析は同意撤回時に停止し、データ不足時は事実だけを返す。

## 実装順序と合格条件
|段階・依存|成果物・主な変更先|試験と合格条件|
|---|---|---|
|M1 基盤|lib/domain.tsを段階分割、db/migrations、app/api、ai/gateway.ts、demo-provider、locale、globals.css。Topic CRUD、認証、RLS、ジョブ、移行、予算、デザイントークン|利用者A/Bを用い、ID直指定でも相互アクセス不可。複数Board・会話の保存復元、移行2回で件数不変、トランザクション失敗時に孤児ゼロ|
|M2 Board・Tutor。M1依存|board-workspace、Tutor API、操作検証器。右側Tutor、小画面では開閉式。世界座標とviewportを分離し可視範囲を描画。タイル本文のみ、ドラッグリサイズ、選択時ツール、矢印・グループ、折畳み、Undo/Redo|「√2の像にはなぜ2候補あるか」からTopic作成。説明要素を選択して質問、補記を確認し、移動・Undo・再読込。古いAI応答は新しい手書き編集を保護。実モデルで数学内容と操作を確認|
|M3 知識構造。M1とM2導線依存|app/knowledge、分類seed、Structureワーカー。基礎分類に分野・下位分類を用意。個人用関連線を別管理。焦点周囲を1段ずつ展開|体の拡大→ガロア理論を両ビューで同一IDとして探索。根拠付き提案を採択・棄却し、重複や循環を防ぐ。ズーム・パン・折畳み・キーボード操作を確認|
|M4 Practice。M1・M2・M3の参照契約依存|exercise-list、Question API、採点器。複数Topic／分類に属すPackage、問題版。MathLiveを候補に分数・根号の直接編集と自由記述を比較検証|Board文脈から3題を生成・保存し、別端末で開く。分数を分子分母から入力、ヒント付き再提出、証明の判定保留、元答案から履歴へ追跡|
|M5 分析。M2〜M4の活動依存|app/progress、settings、Analyserワーカー。期間集計と根拠リンク、訂正・削除、任意のFollow-up|既知の試行集合と集計が一致。解答例閲覧後を分離。任意の仮説から元記録を開ける。同意なし・根拠不足・撤回・削除の境界を試験|
|M6 製品検証。M1〜M5依存|翻訳辞書、全画面、アクセシビリティ、Playwright、計測、Release Report|5言語で同じTopic IDを開き、入力・生成・提出・復元。PC・タッチ・キーボードで完走。実モデル誤り、失敗率、費用、待ち時間を実測し残課題を明示|

各段階に分岐ブランチ、PR、隔離Previewを用意する。main自動配信を避けるため、承認前はPV1統合ブランチへ統合する。マイルストーンごとに差分、テスト、受入条件別の結果、未解決事項、次の依存、Preview URLと主要画面の画像を報告。CIでは決定的な代替モデルで契約試験を行い、Previewでは許可された鍵・予算で実モデル経路を通す。ビルド成功だけで合格としない。

## 予算・言語・公開判断
試算例はGPT-5.4 miniの標準入力 $0.75、出力 $4.50（各100万tokens）。Tutor 8回を各入力2000・出力500、他の3役を各1回入力3000・出力800と仮定すると、1セッション入力25000、出力6400で $0.04755。1000セッション約 $47.55。再試行・長い証明・高単価モデルで増える。初期Previewは総額 $10/月のアプリ側上限案。実行前に最大出力相当を予約し、実績との差を解放する。上限到達時は手動Boardと保存済み演習を利用可能にする。

Vercelはプラン・計算時間・転送、Supabaseはプラン・compute・DB容量・転送・認証利用者が費用要因。無料枠内の検証を優先し、追加支出・公開時の契約変更は別途見積もる。商用公開時はVercel Hobbyの利用条件も再確認する。

日英は既存教材・品質基準として先行。简体中文・Español・Françaisを指定候補としてM6受入対象にする。追加候補はヒンディー語・アラビア語を調査対象とし、教育段階別の就学者数と接続可能性、数学用語の校閲・RTL対応の実現性を比較する。国別統計だけでは学習者の使用言語を確定できないため、順位の確定には希望言語の実測を加える。AIの出力言語、教材原文、UI localeを分離する。

公式資料：[モデル料金](https://developers.openai.com/api/docs/models/gpt-5.4-mini)、[Vercel料金](https://vercel.com/pricing)、[Supabase料金](https://supabase.com/pricing)、[ITUの接続統計](https://www.itu.int/itu-d/reports/statistics/facts-figures-2025/)、[UNESCO教育統計](https://www.uis.unesco.org/en)。

## 承認ゲート
承認対象はNext.jsを継続する構成、Supabase Auth/Postgres/RLSの採用案、4役のイベント処理、明示移行、M1〜M6の順番とPreviewでの検証。実API利用は支払い設定・利用上限・鍵の投入を別途確認してから開始する。Production公開はRelease Report確認後の別承認とする。
