-- 新体系への移行SQL
-- Supabase SQLエディタで実行してください

-- ============================================
-- 1. 既存のCHECK制約を削除
-- ============================================

-- deals テーブルの contract_type 制約を削除（存在する場合）
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_contract_type_check;

-- contracts テーブルの制約を削除
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_phase_check;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_contract_type_check;

-- ============================================
-- 2. 新体系のCHECK制約を追加
-- ============================================

-- contracts テーブル: 契約種別（新体系）
ALTER TABLE contracts ADD CONSTRAINT contracts_contract_type_check
  CHECK (contract_type IN ('property', 'line', 'maintenance'));

-- contracts テーブル: フェーズ（新体系）
ALTER TABLE contracts ADD CONSTRAINT contracts_phase_check
  CHECK (phase IN ('商談中', '審査・申込中', '下見・工事中', '契約中', '入金中', '請求中', '完了', '否決'));

-- contracts テーブル: ステータス（新体系）
ALTER TABLE contracts ADD CONSTRAINT contracts_status_check
  CHECK (status IN (
    '商談待ち', '商談日程調整中',
    '審査・申込対応中', '審査・申込待ち',
    '下見調整中', '下見実施待ち', '工事日程調整中', '工事実施待ち',
    '検収確認中', '契約書提出対応中', '契約書確認待ち',
    '入金待ち', '入金済',
    '初回請求確認待ち', '請求処理対応中',
    'クローズ',
    '対応検討中', '失注'
  ));

-- ============================================
-- 3. 既存データを削除（新体系でデータを作り直すため）
-- ============================================

-- 外部キー制約の順序で削除
DELETE FROM activities WHERE id IS NOT NULL;
DELETE FROM payments WHERE id IS NOT NULL;
DELETE FROM lease_applications WHERE id IS NOT NULL;
DELETE FROM tasks WHERE id IS NOT NULL;
DELETE FROM contracts WHERE id IS NOT NULL;
DELETE FROM deals WHERE id IS NOT NULL;
DELETE FROM customers WHERE id IS NOT NULL;
-- usersは残す（ログインに必要なため）
-- DELETE FROM users WHERE id IS NOT NULL;

-- ============================================
-- 完了メッセージ
-- ============================================
-- 上記SQLを実行後、新体系のシードデータを投入できます
