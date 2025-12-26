# エラー管理

## 基本情報

| 項目 | 値 |
|------|-----|
| プロジェクト名 | Sales MS（リース販売管理システム） |
| バージョン | ver03 |
| 作成日 | 2025/12/22 |
| 最終更新日 | 2025/12/26 |

---

## エラー一覧

| エラーNo | BRID | SRID | システム要件詳細 | 発生日付 | 優先度 | タイトル | 再現手順 | 期待される動作 | 実際の動作 | エラー文言/コード | 発生環境 | 起票者 | ステータス | 原因 | 解決策 | 結論 |
|----------|------|------|------------------|----------|--------|----------|----------|----------------|------------|-------------------|----------|--------|-----------|------|--------|------|
| ERR-001 | BIZ-001 | SYS-001-02-03-01 | VercelプロジェクトのGit連携を正しいリポジトリに設定する | 2025/12/22 | 高 | Vercelで物件マッチングツールが表示される | 1. https://sales-ms.vercel.app にアクセスする<br>2. 画面を確認する | Sales MS（リース販売管理システム）のダッシュボードが表示される | 「物件マッチングツール」という別のアプリケーションが表示される。サイドバーに「物件管理」「買主管理」「マッチング」などのメニューが表示される | `<title>物件マッチングツール</title>` がHTMLに含まれる | Vercel本番環境<br>ブラウザ: Chrome<br>URL: https://sales-ms.vercel.app | Claude | 完了 | 【原因】<br>Vercelの`sales-ms`プロジェクトのGit連携が、SalesMSリポジトリではなく「物件マッチングツール」のリポジトリを参照していた。<br><br>【なぜ発生したか】<br>1. 以前、`sales-ms`という名前のVercelプロジェクトを「物件マッチングツール」のリポジトリで作成した<br>2. その後、SalesMSディレクトリから`vercel link`で同じプロジェクト名に接続した<br>3. ローカルからの`vercel --prod`では正しくSalesMSがデプロイされる<br>4. しかしGitHubへpushすると、Git連携されたリポジトリ（物件マッチングツール）がデプロイされる | 【解決策】<br>1. `vercel --prod`でローカルから直接デプロイし、一時的に正しいアプリを表示<br>2. VercelダッシュボードでGit連携を変更するようユーザーに案内:<br>   - Settings → Git → Connected Git Repository<br>   - Disconnectで既存連携を解除<br>   - Connect Git Repositoryで`chosenp31/SalesMS`を選択<br>3. GitHubのデフォルトブランチを`main`に変更:<br>   `gh api repos/chosenp31/SalesMS -X PATCH -f default_branch=main` | ローカルから`vercel --prod`で直接デプロイすることで一時解決。恒久対策としてVercelダッシュボードでのGit連携変更をユーザーに案内。GitHubのデフォルトブランチも`main`に変更完了。 |
| ERR-002 | BIZ-003 | SYS-003-01-01-01 | 新規案件を登録し、顧客・担当者・契約情報を紐づける | 2025/12/22 | 高 | 案件登録時に「エラーが発生しました」と表示される（外部キー制約違反） | 1. 案件管理画面を開く<br>2. 「新規案件」ボタンをクリック<br>3. 顧客を選択する<br>4. 管理者を選択する（プルダウンに値が表示されていない場合がある）<br>5. 契約種類を選択する<br>6. 商材を選択する<br>7. 「登録」ボタンをクリック | 案件が正常に登録され、案件一覧画面に遷移する | 「エラーが発生しました」というトーストが表示され、案件が登録されない | `POST https://xxx.supabase.co/rest/v1/deals?select=* 400 (Bad Request)`<br><br>コンソールエラー: 外部キー制約違反（assigned_user_id） | Vercel本番環境<br>ブラウザ: Chrome<br>認証: 無効化（デモモード） | Claude | 完了 | 【原因】<br>認証が無効化されているため、`authUser?.id`が`undefined`または`null`になり、`currentUserId`が空文字列になる。空文字列がそのまま`assigned_user_id`としてINSERTされると、外部キー制約違反が発生する。<br><br>【発生箇所】<br>- `src/app/(dashboard)/deals/new/page.tsx`<br>- `src/components/features/deals/deal-form.tsx` | 【解決策】<br>1. `deal-form.tsx`でフォールバックロジックを追加:<br>   `const effectiveUserId = currentUserId \|\| users[0]?.id \|\| ""`<br>2. フォームのデフォルト値を`effectiveUserId`で設定<br>3. 同様の修正を以下のファイルにも適用:<br>   - `src/app/(dashboard)/tasks/page.tsx`<br>   - `src/app/(dashboard)/deals/[id]/page.tsx` | デモモード時に認証ユーザーIDが取得できない場合、usersテーブルの最初のユーザーIDをフォールバックとして使用する実装を追加。これにより外部キー制約違反を回避。 |
| ERR-003 | BIZ-003 | SYS-003-01-01-01 | 新規案件を登録し、顧客・担当者・契約情報を紐づける | 2025/12/22 | 高 | 案件登録時に「Could not find the 'description' column」エラー | 1. 案件管理画面を開く<br>2. 「新規案件」ボタンをクリック<br>3. 必要項目を入力する<br>4. 「登録」ボタンをクリック | 案件が正常に登録され、案件一覧画面に遷移する | 「エラーが発生しました」というトーストが表示され、案件が登録されない | `POST https://xxx.supabase.co/rest/v1/deals?select=* 400 (Bad Request)`<br><br>コンソールエラー:<br>`{code: 'PGRST204', details: null, hint: null, message: "Could not find the 'description' column of 'deals' in the schema cache"}` | Vercel本番環境<br>ブラウザ: Chrome | Claude | 完了 | 【原因】<br>コードでは`description`カラムをINSERTしようとしているが、Supabaseの`deals`テーブルには`description`カラムが存在しない。コードとデータベーススキーマに不整合がある。<br><br>【発生箇所】<br>`src/components/features/deals/deal-form.tsx` 256-262行目:<br>```javascript<br>const dealData = {<br>  title: dealTitle,<br>  customer_id: data.customer_id,<br>  assigned_user_id: data.assigned_user_id,<br>  status: "active",<br>  description: data.description \|\| null, // ← この行<br>  total_amount: null,<br>};<br>``` | 【解決策】<br>1. `deal-form.tsx`から`description`フィールドを完全に削除:<br>   - フォームスキーマから削除<br>   - デフォルト値から削除<br>   - dealDataオブジェクトから削除<br>   - 備考入力欄のUI要素を削除<br>2. 不要になった`Textarea`インポートを削除 | `description`カラムへの参照を全て削除し、UIからも備考入力欄を削除。ローカルビルドで問題ないことを確認後、デプロイ完了。 |
| ERR-004 | BIZ-003 | SYS-003-01-02-01 | 契約に紐づくタスクを登録する | 2025/12/22 | 高 | タスク登録時に「保存中にエラーが発生しました」と表示される | 1. 契約管理画面を開く<br>2. 任意の契約をクリックして詳細画面を開く<br>3. タスクカードの「タスクを追加」ボタンをクリック<br>4. タスク名を入力する<br>5. 担当者を選択する<br>6. 「作成」ボタンをクリック | タスクが正常に登録され、タスクカードに表示される | 「保存中にエラーが発生しました」というトーストが表示され、タスクが登録されない | `POST https://xxx.supabase.co/rest/v1/tasks 400 (Bad Request)`<br><br>Supabaseエラー: カラム不存在（phase, contract_status） | Vercel本番環境<br>ブラウザ: Chrome | Claude | 完了 | 【原因】<br>`contract-task-card.tsx`でタスクを登録する際に、`tasks`テーブルに存在しない`phase`と`contract_status`カラムをINSERTしようとしていた。<br><br>【発生箇所】<br>`src/components/features/contracts/contract-task-card.tsx` 141-154行目（修正前）:<br>```javascript<br>const phase = STATUS_TO_PHASE[contract.status] \|\| "商談中";<br>const taskData = {<br>  ...<br>  phase: phase, // ← 存在しないカラム<br>  contract_status: contract.status, // ← 存在しないカラム<br>};<br>```<br><br>【なぜ発生したか】<br>UIに表示するための情報（フェーズ・ステータス）をデータベースにも保存しようとしたが、スキーマ設計ではこれらは契約テーブルから取得する想定だった。 | 【解決策】<br>1. `contract-task-card.tsx`の`taskData`から不要なカラムを削除:<br>   - `phase`を削除<br>   - `contract_status`を削除<br>2. `STATUS_TO_PHASE`のインポートは表示用に残す（ダイアログ内の読み取り専用情報表示で使用）<br><br>【修正後のtaskData】<br>```javascript<br>const taskData = {<br>  title: data.title,<br>  description: null,<br>  deal_id: contract.deal_id,<br>  contract_id: contract.id,<br>  assigned_user_id: data.assigned_user_id,<br>  due_date: data.due_date \|\| null,<br>  status: data.status,<br>  priority: data.priority,<br>};<br>``` | `tasks`テーブルのスキーマに合わせて、存在しないカラムへの参照を削除。タスク登録が正常に動作することを確認。 |
| ERR-005 | BIZ-003 | SYS-003-01-01-01 | 新規案件を登録し、顧客・担当者・契約情報を紐づける | 2025/12/22 | 中 | ビルド時に「Module not found: Can't resolve 'cmdk'」エラー | 1. ローカルで`npm run build`を実行する | ビルドが成功する | ビルドが失敗し、エラーが表示される | `Module not found: Can't resolve 'cmdk'`<br><br>Import trace for requested module:<br>`./src/components/ui/command.tsx`<br>`./src/components/features/deals/deal-form.tsx` | ローカル開発環境<br>Node.js: 20.x<br>npm: 10.x | Claude | 完了 | 【原因】<br>`command.tsx`コンポーネントが`cmdk`パッケージに依存しているが、このパッケージがインストールされていなかった。<br><br>【なぜ発生したか】<br>`deal-form.tsx`で使用している`Command`コンポーネントは`cmdk`に依存するが、`package.json`にはこのパッケージが含まれていなかった。 | 【解決策】<br>`npm install cmdk`を実行してパッケージをインストール | `cmdk`パッケージをインストールし、ビルドが成功することを確認。 |
| ERR-006 | BIZ-004 | SYS-004-01-01-01 | 案件一覧画面で各案件の契約状況を「契約種別：ステータス」形式で表示する | 2025/12/23 | 中 | 案件一覧の契約状況が「不明：商談待ち」と表示される | 1. 案件管理画面を開く<br>2. 案件一覧を確認する<br>3. 「契約状況」列を確認する | 契約状況が「回線：商談待ち」のような形式で表示される | 契約状況が「不明：商談待ち」と表示される。契約種別が「不明」になっている | 表示上の問題（エラーメッセージなし）<br><br>表示例: `不明：商談待ち` | Vercel本番環境<br>ブラウザ: Chrome<br>案件一覧画面 | Claude | 完了 | 【原因】<br>`src/app/(dashboard)/deals/page.tsx`のSupabaseクエリで、contractsの取得時に`contract_type`カラムが含まれていなかった。<br><br>【発生箇所】<br>`src/app/(dashboard)/deals/page.tsx` 16行目（修正前）:<br>```javascript<br>contracts(id, title, phase, status, product_category, contract_number)<br>```<br><br>【表示ロジック】<br>`src/components/features/deals/deal-list.tsx`の`getContractStatusList`関数で`contract.contract_type`を参照しているが、クエリに含まれていないため`undefined`となり、フォールバックの「不明」が表示されていた。 | 【解決策】<br>`src/app/(dashboard)/deals/page.tsx`のcontractsクエリに`contract_type`を追加:<br><br>【修正前】<br>```javascript<br>contracts(id, title, phase, status, product_category, contract_number)<br>```<br><br>【修正後】<br>```javascript<br>contracts(id, title, contract_type, phase, status, product_category, contract_number)<br>``` | クエリに`contract_type`を追加することで、契約状況が「回線：商談待ち」のような正しい形式で表示されるようになった。 |
| ERR-007 | BIZ-003 | SYS-003-03-01-01 | エンティティ（顧客・案件・契約・タスク・入金）の作成・更新・削除を履歴として自動記録する | 2025/12/26 | 高 | 案件詳細で情報を修正しても変更履歴に反映されない | 1. 案件管理画面を開く<br>2. 任意の案件をクリックして詳細画面を開く<br>3. 「編集」ボタンをクリック<br>4. 営業担当者やアポインターを変更する<br>5. 「更新」ボタンをクリック<br>6. 案件詳細画面に戻り、変更履歴を確認する | 変更履歴に「〇〇が更新しました」という記録が表示される。営業担当者やアポインターの変更前後の値が表示される | 変更履歴に何も表示されない。または変更履歴セクション自体が表示されない | エラーメッセージなし（サイレント失敗）<br><br>コンソールエラー:<br>`Failed to record history: {code: '42P01', ...}` (entity_historyテーブルが存在しない場合) | Vercel本番環境<br>ブラウザ: Chrome<br>案件編集画面 | ユーザー | 完了 | 【原因1: 編集画面でcurrentUserIdが渡されていない】<br>編集画面（`deals/[id]/edit/page.tsx`, `customers/[id]/edit/page.tsx`, `contracts/[id]/edit/page.tsx`）で、フォームコンポーネントに`currentUserId`が渡されていなかった。<br><br>【発生箇所】<br>`src/app/(dashboard)/deals/[id]/edit/page.tsx`:<br>```javascript<br>// 修正前: currentUserIdが渡されていない<br><DealForm<br>  deal={deal}<br>  customers={customers \|\| []}<br>  users={users \|\| []}<br>/><br>```<br><br>【原因2: entity_historyテーブルが存在しない】<br>データベースにentity_historyテーブルが作成されていない場合、履歴記録が失敗する。<br><br>【recordUpdate関数の動作】<br>`lib/history.ts`の`recordUpdate`関数は、`currentUserId`が空の場合でも`null`として記録を試みるが、テーブルが存在しないとエラーになる。 | 【解決策1: 編集画面でcurrentUserIdを渡す】<br>1. `src/app/(dashboard)/deals/[id]/edit/page.tsx`を修正:<br>```javascript<br>// ユーザーリストを取得してcurrentUserIdを設定<br>const currentUserId = users?.[0]?.id \|\| "";<br><br><DealForm<br>  deal={deal}<br>  customers={customers \|\| []}<br>  users={users \|\| []}<br>  currentUserId={currentUserId}<br>/><br>```<br><br>2. 同様の修正を以下のファイルにも適用:<br>   - `src/app/(dashboard)/customers/[id]/edit/page.tsx`<br>   - `src/app/(dashboard)/contracts/[id]/edit/page.tsx`<br><br>【解決策2: entity_historyテーブルを作成】<br>Supabaseで以下のSQLを実行してテーブルを作成:<br>```sql<br>CREATE TABLE entity_history (<br>  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),<br>  entity_type TEXT NOT NULL,<br>  entity_id UUID NOT NULL,<br>  action TEXT NOT NULL,<br>  user_id UUID REFERENCES users(id),<br>  changes JSONB,<br>  comment TEXT,<br>  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()<br>);<br>CREATE INDEX idx_entity_history_entity ON entity_history(entity_type, entity_id);<br>``` | 1. 編集画面で`currentUserId`をフォームに渡すよう修正<br>2. ユーザーにentity_historyテーブル作成SQLを提供し、実行を依頼<br>3. 修正後、案件・顧客・契約の編集時に変更履歴が正しく記録されることを確認 |

---

## 優先度の基準

| 優先度 | 基準 |
|--------|------|
| 高 | システム停止、データ消失、主要業務（ログイン・決済・登録等）の不可。即日対応必須。 |
| 中 | エラーは出るが回避策がある、または仕様と挙動が異なる。通常のバグ。 |
| 低 | 表示崩れ、誤字脱字、使い勝手の問題。 |

---

## ステータスの定義

| ステータス | 定義 |
|-----------|------|
| 未着手 | 調査・対応が開始されていない |
| 調査中 | 原因を調査している |
| 対応中 | 修正を実施している |
| 完了 | 修正が完了し、デプロイ済み |
| 保留 | 対応を一時停止している（理由を結論に記載） |

---

## 注意事項

1. **エラー発生時の初動**
   - ブラウザのコンソール（F12 → Console）を確認し、エラーメッセージを正確に記録する
   - ネットワークタブでHTTPステータスコードとレスポンスボディを確認する
   - 再現手順を詳細に記録する

2. **原因記載のルール**
   - 直接的な技術原因を明記する
   - なぜ問題が発生したかの背景も記載する
   - 類似エラーとの違いがあれば明記する

3. **解決策記載のルール**
   - 試した解決策を順番に記載する
   - 具体的なコード変更やコマンドを記載する
   - 参照したドキュメントやリソースがあれば記載する
