# 要件・設計管理

## 基本情報

| 項目 | 値 |
|------|-----|
| プロジェクト名 | Sales MS（リース販売管理システム） |
| バージョン | ver02 |
| 作成日 | 2025/12/19 |
| 最終更新日 | 2025/12/19 |

---

## 業務要件・システム要件・設計

| No | 業務：大分類 | 大分類ID | 業務：中分類 | 中分類ID | 業務 | 業務ID | 詳細 | SRID | 概要 | 詳細 | 決定理由 | 概要 | 詳細 | 決定理由 | 関連ファイル | 優先度 | ステータス | 却下理由 | 課題No | 起票日 |
|----|-------------|----------|-------------|----------|------|--------|------|------|------|------|----------|------|------|----------|--------------|--------|-----------|----------|--------|--------|
| 1 | デプロイメント管理 | BIZ-001 | Git運用 | BIZ-001-01 | ブランチマージ | BIZ-001-01-01 | version1ブランチの変更をmainブランチにマージし、本番環境に反映する | SYS-001-01-01-01 | Gitブランチマージ | 1. git fetchでリモートの最新情報を取得する<br>2. ローカル変更を破棄または退避する<br>3. git mergeでブランチをマージする<br>4. git pushでリモートに反映する | 1. ローカルとリモートの差分を正確に把握するため<br>2. マージコンフリクトを回避するため<br>3. Fast-forwardマージでコミット履歴を保つため<br>4. リモートリポジトリを最新状態にするため | Git CLIによるマージ操作 | 1. `git fetch origin` - リモート最新取得<br>2. `git checkout -- . && git clean -fd` - ローカル変更破棄<br>3. `git merge origin/claude/version-1-initial-setup-o44OO` - マージ実行<br>4. `git push origin main` - リモートへプッシュ | 1. リモートブランチの確認は必ずfetch後に行う（ローカルキャッシュは古い可能性がある）<br>2. Fast-forwardマージはWebhookをトリガーしない場合がある<br>3. ローカル変更の破棄は--forceではなくcheckout --とcleanを使用 | - | 高 | 完了 | - | - | 2025/12/19 |
| 2 | デプロイメント管理 | BIZ-001 | Vercel運用 | BIZ-001-02 | 自動デプロイ | BIZ-001-02-01 | GitHubへのpush時にVercelで自動的にデプロイが実行される | SYS-001-02-01-01 | Vercel自動デプロイ | 1. GitHubリポジトリとVercelプロジェクトを連携<br>2. pushイベントをWebhookでVercelに通知<br>3. Vercelがビルド・デプロイを実行 | 1. 継続的デプロイメント（CD）を実現するため<br>2. 手動デプロイの手間を削減するため<br>3. デプロイの一貫性を確保するため | GitHub + Vercel Git Integration | 1. Production Branch: main<br>2. Auto Deploy: 有効<br>3. Preview Deployments: 有効 | 1. GitHub WebhookとVercelの連携で自動化<br>2. プロダクションブランチはmainに設定<br>3. Fast-forwardマージではWebhookがトリガーされない場合がある | vercel.json（未作成） | 高 | 課題あり | - | ISS-001 | 2025/12/19 |
| 3 | デプロイメント管理 | BIZ-001 | Vercel運用 | BIZ-001-02 | 手動デプロイ | BIZ-001-02-02 | 自動デプロイが動作しない場合、手動でデプロイを実行する | SYS-001-02-02-01 | Vercel CLIによる手動デプロイ | 1. Vercel CLIをインストール<br>2. プロジェクトをVercelにリンク<br>3. `vercel --prod`コマンドでデプロイ実行 | 1. 自動デプロイの障害時のバックアップ手段<br>2. 即時デプロイが必要な場合の対応<br>3. デプロイ状況の詳細確認が可能 | Vercel CLI | 1. `vercel --prod` - 本番デプロイ実行<br>2. `vercel ls` - デプロイ一覧確認<br>3. `vercel inspect [url]` - デプロイ詳細確認 | 1. CLIはnpm i -g vercelでインストール<br>2. --prodフラグで本番環境にデプロイ<br>3. デプロイURL・ステータス・ビルド時間を確認可能 | - | 中 | 完了 | - | - | 2025/12/19 |
| 4 | ユーザー体験 | BIZ-002 | 検索・フィルタ | BIZ-002-01 | クイックフィルタ | BIZ-002-01-01 | よく使うフィルタを検索バー横にインライン表示し、即座にアクセス可能にする | SYS-002-01-01-01 | クイックフィルタ機能 | 1. FilterOptionにquickFilter:booleanプロパティ追加<br>2. quickFilter:trueのフィルタはインライン表示<br>3. その他は「その他」ボタンでPopover表示 | 1. フィルタへのアクセス時間短縮<br>2. Salesforce/HubSpotのベストプラクティスに準拠<br>3. 頻繁に使うフィルタを目立たせる | SearchFilterBarコンポーネント拡張 | 1. quickFiltersとadvancedFiltersを分離<br>2. インラインSelectコンポーネント<br>3. レスポンシブ対応（sm:block hidden） | 1. 一般的なCRMのUI設計に準拠<br>2. モバイルでは折りたたんでスペース節約 | src/components/ui/search-filter-bar.tsx | 高 | 完了 | - | - | 2025/12/19 |
| 5 | ユーザー体験 | BIZ-002 | 検索・フィルタ | BIZ-002-01 | 日付プリセット | BIZ-002-01-02 | 「今日」「今週」「今月」などの日付範囲をワンクリックで選択可能にする | SYS-002-01-02-01 | 日付プリセット機能 | 1. DATE_PRESETS配列を定義（今日/昨日/今週/今月/先月/過去7日/過去30日）<br>2. getRange関数で日付範囲を動的計算<br>3. FilterOptionにtype:"datePreset"を追加 | 1. 日付フィルタの操作効率向上<br>2. 手動入力ミスの防止<br>3. ユーザーの思考パターンに合致 | date-fns日付計算 | 1. startOfDay/endOfDay/startOfWeek等を使用<br>2. Popoverで選択肢を表示<br>3. 選択時にアクティブ状態を視覚的に表示 | 1. date-fnsは既存依存なので追加インストール不要<br>2. ja localeで週の開始を月曜に設定 | src/components/ui/search-filter-bar.tsx | 中 | 完了 | - | - | 2025/12/19 |
| 6 | ユーザー体験 | BIZ-002 | 検索・フィルタ | BIZ-002-01 | ソートインジケータ改善 | BIZ-002-01-03 | テーブルヘッダーのソート状態を視覚的に明確にし、ホバー時にソート可能を示す | SYS-002-01-03-01 | ソートUI改善 | 1. ソート中の列をprimary色で強調<br>2. 非ソート列はホバー時にアイコン表示<br>3. transition効果で滑らかな切り替え | 1. ソート可能な列を明確化<br>2. 現在のソート状態を一目で把握<br>3. インタラクティブ性の向上 | SortHeaderコンポーネント | 1. sortField === fieldでアクティブ判定<br>2. group/group-hoverでホバー効果<br>3. opacity transitionで滑らかに表示 | 1. Tailwind CSS group機能を活用<br>2. 既存のChevron Up/Downアイコンを流用 | src/components/features/*/list.tsx | 中 | 完了 | - | - | 2025/12/19 |
| 7 | ユーザー体験 | BIZ-002 | 検索・フィルタ | BIZ-002-01 | 検索結果件数表示 | BIZ-002-01-04 | フィルタ適用時に「結果件数 / 全件数」形式で表示し、フィルタ効果を明確化 | SYS-002-01-04-01 | 件数表示改善 | 1. resultCountとtotalCountを両方表示<br>2. 「5 / 150 件」形式<br>3. resultCount != totalCountの場合のみスラッシュ表示 | 1. フィルタの効果を即座に把握<br>2. 全データ量の認識<br>3. 空結果時の原因特定が容易 | SearchFilterBarコンポーネント | 1. totalCountプロパティを追加<br>2. 条件付きレンダリングでスラッシュ表示 | 1. シンプルな表示でUIを複雑にしない | src/components/ui/search-filter-bar.tsx | 低 | 完了 | - | - | 2025/12/19 |

---

## 課題管理

| 課題No | 関連SRID | タイトル | 詳細 | 優先度 | ステータス | 対応策 | 起票日 |
|--------|----------|----------|------|--------|-----------|--------|--------|
| ISS-001 | SYS-001-02-01-01 | Fast-forwardマージ時の自動デプロイ未トリガー | GitHubへのpush（Fast-forwardマージ）時にVercelの自動デプロイがトリガーされなかった。原因として、既存コミットがmainに移動しただけで新規コミットが作成されなかったため、Webhookが「既に見たコミット」として認識しスキップした可能性がある。 | 高 | 要調査 | 1. VercelダッシュボードでGit連携設定を確認<br>2. GitHub WebhookのアクティビティログをWebhook設定で確認<br>3. 必要に応じてマージ時に`--no-ff`オプションを使用して明示的なマージコミットを作成 | 2025/12/19 |

---

## 作業履歴（2025/12/19）

### 作業1: ブランチマージとデプロイ

1. **ブランチマージ**
   - `origin/claude/version-1-initial-setup-o44OO` → `main` へのマージを実施
   - マージコミット: `eacc79e` (feat: 一覧画面のUX大幅改善)
   - 変更ファイル: 8ファイル（+1,603行/-275行）

2. **発生した問題と対応**
   - **問題1**: 初回確認時にリモートの最新コミットを見逃した
     - **原因**: `git fetch`を実行せずにローカルブランチのログを確認したため
     - **対応**: `git fetch origin`を実行してリモート最新情報を取得
   - **問題2**: ローカルに未コミットの変更があり、マージが中断された
     - **対応**: ユーザー確認の上、`git checkout -- . && git clean -fd`でローカル変更を破棄
   - **問題3**: GitHubへのpush後、Vercelの自動デプロイが開始されなかった
     - **原因（推測）**: Fast-forwardマージのため、新規コミット作成なしにHEADが移動。Webhookが既存コミットとして認識しスキップ
     - **対応**: `vercel --prod`コマンドで手動デプロイを実行し、正常にデプロイ完了

3. **デプロイ結果**
   - Production URL: https://sales-ms.vercel.app
   - デプロイ時刻: 2025/12/19 16:35頃
   - ステータス: Ready

### 作業2: 検索UX改善

1. **実装内容**
   - Salesforce/HubSpotのベストプラクティスを調査
   - Phase 1として以下を実装:
     - クイックフィルタチップ（インライン表示）
     - 日付範囲プリセット（今日、今週、今月など）
     - ソートインジケータUI改善
     - 検索結果件数表示改善

2. **変更ファイル**
   - `src/components/ui/search-filter-bar.tsx` - コアコンポーネント拡張
   - `src/components/features/deals/deal-list.tsx` - クイックフィルタ有効化
   - `src/components/features/tasks/task-list.tsx` - クイックフィルタ有効化

3. **デプロイ結果**
   - コミット: `ea14d62` (feat: 検索UX大幅改善)
   - Production URL: https://sales-ms.vercel.app
   - デプロイ時刻: 2025/12/19 17:00頃
   - ステータス: Ready

### 今後の推奨事項

1. **Git操作時は必ず`git fetch`を先に実行する**
   - ローカルブランチの情報は古い可能性があるため

2. **Vercel Git連携の設定確認**
   - https://vercel.com/naotos-projects-6818d7a3/sales-ms/settings/git にアクセスして確認

3. **マージ戦略の検討**
   - 自動デプロイを確実にトリガーするため、`git merge --no-ff`の使用を検討

4. **検索UX Phase 2の検討**
   - 保存済みビュー機能
   - 高度なフィルタパネル（AND/OR条件）

