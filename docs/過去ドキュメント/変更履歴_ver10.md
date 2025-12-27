# 変更履歴

## バージョン管理

| バージョン | 更新日 | 更新者 | 変更内容 |
|-----------|--------|--------|----------|
| ver10 | 2025/12/26 | Claude | コードレビュー対応。カラー定義の共通化（8ファイル→1ファイル）。非推奨エイリアス削除（8個）。未使用コンポーネント削除（status-history-card.tsx）。 |
| ver09 | 2025/12/26 | Claude | システムテストで発見されたバグ修正（ERR-008〜ERR-012）。活動種別選択機能の実装。ステータス変更時の活動履歴自動記録。顧客一覧クイックフィルター改善。 |
| ver08 | 2025/12/26 | Claude | 変更履歴機能の強化（entity_historyテーブル、履歴記録ユーティリティ）。変更履歴と活動履歴の分離（HistorySection/ActivityList）。編集画面のcurrentUserId対応修正。ERR-007追加。 |
| ver07 | 2025/12/24 | Claude | 案件詳細UIリファクタリング（商談→案件用語統一、顧客情報削除）。案件・契約テーブルレイアウト改善。タスクインライン編集機能追加。Google Analytics・Vercel Analytics導入。 |
| ver06 | 2025/12/24 | Claude | ログイン機能有効化（Supabase認証）。デモログインボタン追加。デモアカウント作成（demoslaesms@example.com）。 |
| ver05 | 2025/12/23 | Claude | 活動履歴機能改善（契約種別選択必須、入力欄拡大）。検索機能改善（契約一覧にSearchFilterBar追加）。案件一覧の契約状況表示バグ修正（ERR-006）。 |
| ver04 | 2025/12/22 | Claude | 登録機能のエラー修正（ERR-001〜ERR-005）を追加。デプロイメント管理にGit連携設定・デフォルトブランチ設定を追加。データ管理（案件登録・タスク登録・デモモード対応）を追加。エラー管理ドキュメントを新規作成。 |
| ver03 | 2025/12/22 | Claude | 契約フェーズ・ステータス一覧を追加。各ステータスの状態概要・補足・必要なアクションを定義。商材一覧と契約種類ごとの審査・申込内容を追加。 |
| ver02 | 2025/12/19 | Claude | 検索UX改善機能（クイックフィルタ・日付プリセット・ソートUI改善）を追加。 |
| ver01 | 2025/12/19 | Claude | 初版作成。デプロイメント管理（Git運用・Vercel運用）の要件・設計を記載。 |

---

## 詳細履歴

### ver10（2025/12/26）

#### 追加

**要件・設計書**
- **コード品質（BIZ-006）新規追加**
  - リファクタリング（BIZ-006-01）
    - カラー定義共通化（BIZ-006-01-01 / SYS-006-01-01-01）
    - 未使用コード削除（BIZ-006-01-02 / SYS-006-01-02-01）
- **コードレビュー対応セクション新規追加**
  - REV-001: システムコードレビュー対応（2025/12/26）
    - 対応する指摘と対応しない指摘の整理
    - 判断理由の詳細記載
- **作業履歴（2025/12/26）追加分**
  - コードレビュー対応作業の詳細記録

**新規ファイル**
- `src/constants/colors.ts`: カラー定義の共通化ファイル
  - stageColors: 契約ステージの色定義
  - stepColors: 契約ステップの色定義
  - dealStepColors: 案件ステップの色定義
  - workflowStageColors: ワークフロー用ステージ色定義
  - priorityColors: 優先度の色定義
  - taskStatusColors: タスクステータスの色定義

#### 変更

**コード修正（DRY原則対応）**
- `src/components/features/contracts/contract-list.tsx`
  - ローカルのstageColors/stepColors定義（54行）を削除
  - `@/constants/colors`からインポートに変更
- `src/components/features/deals/deal-list.tsx`
  - ローカルのstepColors定義（37行）を削除
  - `@/constants/colors`からdealStepColorsをインポート
- `src/components/features/tasks/task-list.tsx`
  - ローカルのpriorityColors/contractStepColors/statusColors定義（49行）を削除
  - `@/constants/colors`からインポートに変更
  - contractStepColors → stepColors、statusColors → taskStatusColorsに変更
- `src/components/features/deals/status-workflow.tsx`
  - ローカルのstageColors定義（75行）を削除
  - `@/constants/colors`からworkflowStageColorsをインポート
- `src/components/features/tasks/task-detail.tsx`
  - ローカルのpriorityColors/statusColors定義（11行）を削除
  - `@/constants/colors`からインポートに変更
  - statusColors → taskStatusColorsに変更
- `src/components/features/contracts/contract-task-card.tsx`
  - ローカルのpriorityColors/statusColors定義（11行）を削除
  - `@/constants/colors`からインポートに変更
  - statusColors → taskStatusColorsに変更

**定数ファイル修正**
- `src/constants/index.ts`
  - 非推奨エイリアス8個を削除:
    - CONTRACT_PHASE_LABELS
    - CONTRACT_STATUS_LABELS
    - STATUS_TO_PHASE
    - PHASE_STATUSES
    - NEXT_PHASE_FIRST_STATUS
    - ALL_CONTRACT_STATUSES
    - STATUS_DETAILS
    - STATUS_COMPLETION_MESSAGES

#### 削除

- `src/components/features/contracts/status-history-card.tsx`
  - 未使用コンポーネント（grep確認済み）を削除

#### コードレビュー対応詳細

| 指摘No | 重要度 | 指摘内容 | 対応 | 理由 |
|--------|--------|----------|------|------|
| 1 | CRITICAL | .env.localに秘密鍵がハードコード | 対応しない | 誤検知。.env.localは.gitignoreに含まれておりgit履歴にも存在しない |
| 2 | MAJOR | UIコンポーネントでDB操作 | 対応しない | Next.js App Router + Supabaseの設計方針。Server Componentsでのデータ取得は推奨パターン |
| 3 | MAJOR | クライアント側のみの認可チェック | 対応しない | Supabase RLSでサーバー側認可を実施済み。UIは利便性のためのチェック |
| 4 | MAJOR | DRY違反（カラー定義重複） | 対応する | 8ファイルで237行の重複。src/constants/colors.tsに共通化 |
| 5 | MINOR | 大規模コンポーネント（300行超） | 対応しない | 現状の規模では過度な分割は複雑性を増す。必要に応じて将来対応 |
| 6 | MINOR | フォーム送信パターンの重複 | 対応しない | 抽象化は過度な複雑性を招く。現状維持が適切 |
| 7 | MINOR | データアクセス層の欠如 | 対応しない | Supabase clientが抽象化層として機能。追加の層は不要 |
| 8 | MINOR | 履歴記録失敗時のサイレント無視 | 対応しない | 意図的な設計。メイン操作の成功を優先 |
| 9 | INFO | string型の多用 | 対応しない | 低優先度。将来的なリファクタリング候補 |
| 10 | INFO | 非推奨エイリアスの残存 | 対応する | 使用箇所なしを確認後削除 |
| 11 | INFO | 未使用コンポーネント | 対応する | grep確認後削除 |

---

### ver09（2025/12/26）

#### 追加

**要件・設計書**
- **ユーザー体験（BIZ-002）**
  - 顧客一覧クイックフィルター（BIZ-002-01-06 / SYS-002-01-06-01）
    - 事業形態フィルターをインライン表示に変更
    - quickFilter: trueを追加
- **データ管理（BIZ-003）**
  - 活動履歴登録機能の拡張（SYS-003-01-03-01更新）
    - 活動種別選択機能を実装（電話/訪問/メール/オンライン商談/その他）
    - ActivityType型を定義し型安全性を確保
    - 各活動種別にアイコンを設定
  - ステータス変更時の活動履歴自動記録（BIZ-003-01-04 / SYS-003-01-04-01）
    - StatusWorkflowでステータス変更時にactivitiesテーブルへ自動記録
    - activity_type: "status_change"で記録
    - 変更内容とコメントを記録
- **データ表示（BIZ-004）**
  - 活動履歴の活動種別表示（BIZ-004-02-03 / SYS-004-02-03-01）
    - 活動種別に応じたアイコンと背景色を表示
    - 活動種別をBadgeで表示
    - activityTypeConfigで種別ごとのスタイルを定義
- **作業履歴（2025/12/26 追加分）**
  - システムテストで発見されたバグ修正
  - 活動履歴機能の改善

**エラー管理**
- ERR-008: 案件登録時のcontract_type NOT NULL制約エラー
  - deals.contract_typeのNOT NULL制約を解除
  - マイグレーションファイルを作成
- ERR-009: 顧客一覧の事業形態フィルター非表示
  - quickFilter: trueを追加してインライン表示に変更
- ERR-010: 顧客新規登録時のcurrentUserId未渡し
  - getCurrentUserIdOrFallback()を使用してcurrentUserIdを取得・渡す
- ERR-011: 活動種別選択機能の未実装
  - 活動種別選択ドロップダウンを実装
  - 各種別にアイコンを設定
- ERR-012: ステータス変更時の活動履歴自動記録の欠落
  - activitiesテーブルへの自動記録を追加
  - activity_type: "status_change"として記録

#### 変更

- **活動登録フォーム（activity-form.tsx）**
  - activity_type固定値("other")から選択式に変更
  - ActivityType型を追加し型安全性を確保
  - 活動種別選択UIを追加
- **活動一覧（activity-list.tsx）**
  - 固定のMessageSquareアイコンから種別ごとのアイコンに変更
  - 活動種別バッジを追加
  - activityTypeConfigで種別ごとのスタイルを定義
- **ステータスワークフロー（status-workflow.tsx）**
  - ステータス変更時にactivitiesテーブルへも記録を追加
- **顧客一覧（customer-list.tsx）**
  - business_typeフィルターにquickFilter: trueを追加
- **顧客新規登録画面（customers/new/page.tsx）**
  - currentUserIdを取得してCustomerFormに渡すよう修正
- **マイグレーション**
  - deals.contract_typeのNOT NULL制約を解除
  - entity_historyマイグレーションにIF NOT EXISTSを追加

#### 削除

- なし

---

### ver08（2025/12/26）

#### 追加

**要件・設計書**
- **データ管理（BIZ-003）**
  - 変更履歴記録（BIZ-003-03-01 / SYS-003-03-01-01）
    - entity_historyテーブルによる統一履歴管理
    - recordCreate/recordUpdate/recordDelete関数の実装
    - 変更内容をJSONBで保存（{field: {old, new}}形式）
  - 編集画面のcurrentUserId対応（BIZ-003-03-02 / SYS-003-03-02-01）
    - 案件編集画面でcurrentUserIdを取得しフォームに渡す
    - 顧客編集画面でcurrentUserIdを取得しフォームに渡す
    - 契約編集画面でcurrentUserIdを取得しフォームに渡す
- **データ表示（BIZ-004）**
  - 統合変更履歴表示（BIZ-004-02-01 / SYS-004-02-01-01）
    - entity_historyとcontract_status_historyを統合表示
    - タイムスタンプで降順ソート
    - デフォルト5件表示、「もっと見る」で全件表示
  - 活動履歴と変更履歴の分離（BIZ-004-02-02 / SYS-004-02-02-01）
    - 変更履歴: HistorySectionで表示（システム自動記録）
    - 活動履歴: ActivityListで表示（ユーザー手動記録）
    - 契約詳細・タスク詳細は両方を持つ
    - 案件詳細・顧客詳細は変更履歴のみ
- **作業履歴（2025/12/26）**
  - 変更履歴機能の強化
  - 変更履歴と活動履歴の分離

**エラー管理**
- ERR-007: 案件詳細で情報を修正しても変更履歴に反映されない問題
  - 編集画面でcurrentUserIdがフォームに渡されていなかった
  - entity_historyテーブルが存在しない場合に履歴記録が失敗

#### 変更

- HistorySectionコンポーネント: statusHistoryをpropsで受け取り統合表示に対応
- ActivityListコンポーネント: ステータス変更履歴の統合を削除（HistorySectionに移動）
- contract-detail.tsx: statusHistoryをHistorySectionに渡すよう変更

#### 削除

- ContractDetailからstatusHistoryプロパティを削除（HistorySectionで直接処理）

---

### ver07（2025/12/24）

#### 追加

**要件・設計書**
- **データ表示（BIZ-004）**
  - 案件詳細UIリファクタリング（BIZ-004-01-02 / SYS-004-01-02-01）
    - 「商談詳細」→「案件詳細」にタイトル変更
    - 「商談名」→「案件ID」に変更（C001-01形式で表示）
    - 「契約名」→「契約ID」に変更（C001-01-001形式で表示）
    - 契約行をクリックで契約詳細に遷移可能
    - 「商談情報」→「案件情報」に変更
    - 顧客情報サイドバーセクションを削除
  - 案件一覧テーブル改善（BIZ-004-01-03 / SYS-004-01-03-01）
    - テーブルレイアウトの改善
    - 表示項目の最適化
  - タスクインライン編集（BIZ-004-01-04 / SYS-004-01-04-01）
    - タスク一覧でのインライン編集機能
    - ステータス・期限の直接変更対応
- **分析・モニタリング（BIZ-005）**
  - Google Analytics導入（BIZ-005-01-01 / SYS-005-01-01-01）
    - Next.js App RouterでのGA4実装
    - GoogleAnalyticsコンポーネントの作成
  - Vercel Analytics導入（BIZ-005-01-02 / SYS-005-01-02-01）
    - @vercel/analyticsパッケージの導入
    - 自動的なページビュー・Web Vitals計測

**作業履歴（2025/12/24）**
- 案件詳細ページのUI改善
- 用語統一（商談→案件）
- 分析機能の導入

#### 変更

- 案件詳細画面の用語を「商談」から「案件」に統一
- 契約テーブルからアクション列を削除（行クリックで遷移に変更）

#### 削除

- 案件詳細画面の「顧客情報」サイドバーセクション

---

### ver06（2025/12/24）

#### 追加

**要件・設計書**
- **データ管理（BIZ-003）**
  - ログイン機能（BIZ-003-02-02 / SYS-003-02-02-01）
    - Supabase認証によるログイン機能を有効化
    - middlewareで未認証ユーザーを/loginにリダイレクト
    - 認証済みユーザーが/loginにアクセスすると/dealsにリダイレクト
  - デモログイン（BIZ-003-02-03 / SYS-003-02-03-01）
    - ログインページに「デモで試す」ボタンを追加
    - ワンクリックでデモアカウントにログイン可能
    - デモアカウント: demoslaesms@example.com / dn4hkg6xp
- **作業履歴（2025/12/24）**
  - ログイン機能の有効化
  - デモログインボタンの追加
  - デモアカウントの作成

#### 変更

- なし

#### 削除

- なし

---

### ver05（2025/12/23）

#### 追加

**要件・設計書**
- **ユーザー体験（BIZ-002）**
  - 契約一覧フィルタ（BIZ-002-01-05 / SYS-002-01-05-01）
    - 契約一覧画面にSearchFilterBarを追加
    - 大分類（phase）・種別（contract_type）をクイックフィルタとして表示
    - 小分類（status）を通常フィルタとして表示
- **データ管理（BIZ-003）**
  - 活動履歴登録（BIZ-003-01-03 / SYS-003-01-03-01）
    - activitiesテーブルにcontract_idカラムを追加
    - 活動登録フォームで契約種別選択を必須に
    - テキストエリアを250pxに拡大（議事録対応）
    - ラベルを「契約種別」に変更、左上配置（優先度表現）
- **データ表示（BIZ-004）**
  - 案件一覧の契約状況表示（BIZ-004-01-01 / SYS-004-01-01-01）
    - 「契約種別：ステータス」形式での表示機能
- **作業履歴（2025/12/23）**
  - 活動履歴機能の改善
  - 検索機能の改善
  - バグ修正（ERR-006）

**エラー管理**
- ERR-006: 案件一覧の契約状況が「不明」と表示される問題

#### 変更

- なし

#### 削除

- なし

---

### ver04（2025/12/22）

#### 追加

**要件・設計書**
- **デプロイメント管理（BIZ-001）**
  - Git連携設定（BIZ-001-02-03 / SYS-001-02-03-01）
    - VercelプロジェクトのGit連携を正しいリポジトリに設定する手順
  - デフォルトブランチ設定（BIZ-001-03-01 / SYS-001-03-01-01）
    - GitHubリポジトリのデフォルトブランチをmainに設定する手順
- **データ管理（BIZ-003）**
  - 案件登録（BIZ-003-01-01 / SYS-003-01-01-01）
    - 顧客選択、担当者選択、契約種類・商材選択の実装詳細
  - タスク登録（BIZ-003-01-02 / SYS-003-01-02-01）
    - 契約詳細画面からのタスク追加機能の実装詳細
  - デモモード対応（BIZ-003-02-01 / SYS-003-02-01-01）
    - 認証バイパスとフォールバックロジックの実装詳細
- **課題管理**
  - ISS-002: Vercel Git連携が別リポジトリを参照（解決済）
- **作業履歴（2025/12/22）**
  - Vercel Git連携問題の解決
  - 登録機能エラーの修正
  - RLSポリシー設定

**エラー管理（新規作成）**
- ERR-001: Vercelで物件マッチングツールが表示される
- ERR-002: 案件登録時の外部キー制約違反
- ERR-003: 案件登録時のdescriptionカラム不存在エラー
- ERR-004: タスク登録時のphase/contract_statusカラム不存在エラー
- ERR-005: ビルド時のcmdkモジュール不存在エラー

#### 変更

- 課題ISS-001のステータスを「解決済」に更新

#### 削除

- なし

---

### ver03（2025/12/22）

#### 追加
- **契約フェーズ・ステータス一覧**
  - ステータス遷移表（18ステータス）
    - 商談中: 商談待ち、商談日程調整中
    - 審査・申込中: 審査・申込対応中、審査・申込待ち
    - 下見・工事中: 下見調整中、下見実施待ち、工事日程調整中、工事実施待ち
    - 契約中: 検収確認中、契約書提出対応中、契約書確認待ち
    - 入金中: 入金待ち、入金済
    - 請求中: 初回請求確認待ち、請求処理対応中
    - 完了: クローズ
    - 否決: 対応検討中、失注
  - 各ステータスの状態概要・補足・必要なアクションを定義
- **商材一覧**
  - 物件: UTM / ルーター / 複合機 / その他
  - 回線: インターネット / 電話 / その他
  - 保守: インターネット / 電話 / その他
- **契約種類ごとの審査・申込内容**
  - 物件: リース審査
  - 回線: NTT名義・住所確認
  - 保守: 保守契約申込

#### 変更
- なし

#### 削除
- なし

---

### ver02（2025/12/19）

#### 追加
- 業務要件：ユーザー体験（BIZ-002）
  - 検索・フィルタ（BIZ-002-01）
    - クイックフィルタ（BIZ-002-01-01）
    - 日付プリセット（BIZ-002-01-02）
    - ソートインジケータ改善（BIZ-002-01-03）
    - 検索結果件数表示（BIZ-002-01-04）
- 作業履歴：検索UX改善作業を追加

#### 変更
- なし

#### 削除
- なし

---

### ver01（2025/12/19）

#### 追加
- 業務要件：デプロイメント管理（BIZ-001）
  - Git運用（BIZ-001-01）
    - ブランチマージ（BIZ-001-01-01）
  - Vercel運用（BIZ-001-02）
    - 自動デプロイ（BIZ-001-02-01）
    - 手動デプロイ（BIZ-001-02-02）
- 課題：ISS-001（Fast-forwardマージ時の自動デプロイ未トリガー）
- 作業履歴：2025/12/19実施のブランチマージ・デプロイ作業

#### 変更
- なし（初版のため）

#### 削除
- なし（初版のため）
