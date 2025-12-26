-- マイグレーション: phase → stage, status → step への名称変更
-- 実行日: 2025-12-26

-- 1. contracts テーブルのカラム名変更
ALTER TABLE contracts RENAME COLUMN phase TO stage;
ALTER TABLE contracts RENAME COLUMN status TO step;

-- 2. contract_status_history テーブルのカラム名変更
ALTER TABLE contract_status_history RENAME COLUMN previous_phase TO previous_stage;
ALTER TABLE contract_status_history RENAME COLUMN new_phase TO new_stage;
ALTER TABLE contract_status_history RENAME COLUMN previous_status TO previous_step;
ALTER TABLE contract_status_history RENAME COLUMN new_status TO new_step;

-- 3. デフォルト値の変更（もし設定されている場合）
-- contracts テーブルのデフォルト値
ALTER TABLE contracts ALTER COLUMN stage SET DEFAULT '商談中';
ALTER TABLE contracts ALTER COLUMN step SET DEFAULT '商談待ち';
