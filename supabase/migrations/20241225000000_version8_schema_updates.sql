-- Version 8: Schema Updates
-- 1. 活動履歴を案件から契約に移動
-- 2. 案件の担当者を営業担当者・アポインターに変更
-- 3. タスク名マスタテーブルを追加
-- 4. 商材マスタテーブルを追加
-- 5. ステータス変更履歴テーブルを追加（contract_status_history）
-- 6. タスク履歴テーブルを追加
-- 7. ユーザー権限を2段階（admin/user）に変更

-- ========================================
-- 1. 活動履歴の変更
-- ========================================

-- contract_idカラムを追加（まだない場合）
ALTER TABLE activities ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- 既存データを契約に紐付け（deal_idから最初の契約を取得）
UPDATE activities a
SET contract_id = (
    SELECT c.id FROM contracts c WHERE c.deal_id = a.deal_id ORDER BY c.created_at LIMIT 1
)
WHERE a.contract_id IS NULL AND a.deal_id IS NOT NULL;

-- 契約が紐づかない活動履歴を削除（契約がない案件の活動履歴）
DELETE FROM activities WHERE contract_id IS NULL;

-- contract_idを必須に変更
ALTER TABLE activities ALTER COLUMN contract_id SET NOT NULL;

-- deal_idカラムを削除
ALTER TABLE activities DROP COLUMN IF EXISTS deal_id;

-- インデックスを削除（deal_id用）
DROP INDEX IF EXISTS idx_activities_deal_id;

-- contract_id用のインデックスを追加
CREATE INDEX IF NOT EXISTS idx_activities_contract_id ON activities(contract_id);

-- ========================================
-- 2. 案件の担当者変更
-- ========================================

-- 営業担当者カラムを追加（既存のassigned_user_idを流用）
ALTER TABLE deals RENAME COLUMN assigned_user_id TO sales_user_id;

-- アポインターカラムを追加（NULLを一時的に許可）
ALTER TABLE deals ADD COLUMN appointer_user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 既存データは営業担当者をアポインターにもコピー
UPDATE deals SET appointer_user_id = sales_user_id WHERE appointer_user_id IS NULL;

-- NOT NULL制約を追加
ALTER TABLE deals ALTER COLUMN appointer_user_id SET NOT NULL;

-- インデックスを更新
DROP INDEX IF EXISTS idx_deals_assigned_user_id;
CREATE INDEX idx_deals_sales_user_id ON deals(sales_user_id);
CREATE INDEX idx_deals_appointer_user_id ON deals(appointer_user_id);

-- ========================================
-- 3. タスク名マスタテーブル
-- ========================================

CREATE TABLE IF NOT EXISTS task_name_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_type TEXT NOT NULL CHECK (contract_type IN ('property', 'line', 'maintenance')),
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 初期データ挿入（重複を避けるため、存在しない場合のみ）
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'property', '商談', 1 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'property' AND name = '商談');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'property', '見積作成', 2 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'property' AND name = '見積作成');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'property', '審査申込', 3 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'property' AND name = '審査申込');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'property', '契約書作成', 4 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'property' AND name = '契約書作成');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'property', '工事立会', 5 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'property' AND name = '工事立会');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'property', '検収確認', 6 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'property' AND name = '検収確認');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'property', '入金確認', 7 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'property' AND name = '入金確認');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'property', 'その他', 99 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'property' AND name = 'その他');

INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'line', '商談', 1 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'line' AND name = '商談');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'line', '申込書作成', 2 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'line' AND name = '申込書作成');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'line', '開通日調整', 3 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'line' AND name = '開通日調整');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'line', '開通確認', 4 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'line' AND name = '開通確認');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'line', '請求確認', 5 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'line' AND name = '請求確認');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'line', 'その他', 99 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'line' AND name = 'その他');

INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'maintenance', '商談', 1 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'maintenance' AND name = '商談');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'maintenance', '契約書作成', 2 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'maintenance' AND name = '契約書作成');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'maintenance', 'サービス開始確認', 3 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'maintenance' AND name = 'サービス開始確認');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'maintenance', '請求確認', 4 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'maintenance' AND name = '請求確認');
INSERT INTO task_name_master (contract_type, name, display_order)
SELECT 'maintenance', 'その他', 99 WHERE NOT EXISTS (SELECT 1 FROM task_name_master WHERE contract_type = 'maintenance' AND name = 'その他');

-- トリガー追加
DROP TRIGGER IF EXISTS update_task_name_master_updated_at ON task_name_master;
CREATE TRIGGER update_task_name_master_updated_at
    BEFORE UPDATE ON task_name_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS無効化（デモモード）
ALTER TABLE task_name_master DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. 商材マスタテーブル
-- ========================================

CREATE TABLE IF NOT EXISTS product_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_type TEXT NOT NULL CHECK (contract_type IN ('property', 'line', 'maintenance')),
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 初期データ挿入（重複を避けるため、存在しない場合のみ）
INSERT INTO product_master (contract_type, name, display_order)
SELECT 'property', 'UTM', 1 WHERE NOT EXISTS (SELECT 1 FROM product_master WHERE contract_type = 'property' AND name = 'UTM');
INSERT INTO product_master (contract_type, name, display_order)
SELECT 'property', 'ルーター', 2 WHERE NOT EXISTS (SELECT 1 FROM product_master WHERE contract_type = 'property' AND name = 'ルーター');
INSERT INTO product_master (contract_type, name, display_order)
SELECT 'property', '複合機', 3 WHERE NOT EXISTS (SELECT 1 FROM product_master WHERE contract_type = 'property' AND name = '複合機');
INSERT INTO product_master (contract_type, name, display_order)
SELECT 'property', 'その他', 99 WHERE NOT EXISTS (SELECT 1 FROM product_master WHERE contract_type = 'property' AND name = 'その他');

INSERT INTO product_master (contract_type, name, display_order)
SELECT 'line', 'インターネット', 1 WHERE NOT EXISTS (SELECT 1 FROM product_master WHERE contract_type = 'line' AND name = 'インターネット');
INSERT INTO product_master (contract_type, name, display_order)
SELECT 'line', '電話', 2 WHERE NOT EXISTS (SELECT 1 FROM product_master WHERE contract_type = 'line' AND name = '電話');
INSERT INTO product_master (contract_type, name, display_order)
SELECT 'line', 'その他', 99 WHERE NOT EXISTS (SELECT 1 FROM product_master WHERE contract_type = 'line' AND name = 'その他');

INSERT INTO product_master (contract_type, name, display_order)
SELECT 'maintenance', 'インターネット', 1 WHERE NOT EXISTS (SELECT 1 FROM product_master WHERE contract_type = 'maintenance' AND name = 'インターネット');
INSERT INTO product_master (contract_type, name, display_order)
SELECT 'maintenance', '電話', 2 WHERE NOT EXISTS (SELECT 1 FROM product_master WHERE contract_type = 'maintenance' AND name = '電話');
INSERT INTO product_master (contract_type, name, display_order)
SELECT 'maintenance', 'その他', 99 WHERE NOT EXISTS (SELECT 1 FROM product_master WHERE contract_type = 'maintenance' AND name = 'その他');

-- トリガー追加
DROP TRIGGER IF EXISTS update_product_master_updated_at ON product_master;
CREATE TRIGGER update_product_master_updated_at
    BEFORE UPDATE ON product_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS無効化（デモモード）
ALTER TABLE product_master DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. ステータス変更履歴テーブル
-- ========================================

CREATE TABLE IF NOT EXISTS contract_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    changed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_phase TEXT,
    new_phase TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_status_history_contract_id ON contract_status_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_status_history_user_id ON contract_status_history(changed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_contract_status_history_created_at ON contract_status_history(created_at);

-- RLS無効化（デモモード）
ALTER TABLE contract_status_history DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. タスク履歴テーブル
-- ========================================

CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'deleted')),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at);

-- RLS無効化（デモモード）
ALTER TABLE task_history DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. タスクに契約種別参照を追加（タスク名プルダウン用）
-- ========================================

-- タスクテーブルにtask_name_master_idを追加
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_name_master_id UUID REFERENCES task_name_master(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_task_name_master_id ON tasks(task_name_master_id);

-- ========================================
-- 8. 活動履歴にステータス変更フラグを追加
-- ========================================

ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_status_change BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS status_change_id UUID REFERENCES contract_status_history(id) ON DELETE SET NULL;

-- ========================================
-- 9. ユーザー権限を2段階（admin/user）に変更
-- ========================================

-- 制約を変更（PostgreSQLでは直接ALTER TABLE...ALTER COLUMNでCHECKを変更できないため、一度削除して再作成）
-- 先に制約を削除
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 既存のrole値を新しい値に変更
-- まず既存のmanagerをadminに変更
UPDATE users SET role = 'admin' WHERE role = 'manager';
-- salesをuserに変更
UPDATE users SET role = 'user' WHERE role = 'sales';

-- 新しい制約を追加
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));

-- デフォルト値を変更
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- ユーザー作成トリガーを更新（新規ユーザーはuserロールで作成）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
