-- ステータス変更履歴テーブルの追加
-- Supabase SQLエディタで実行してください

-- ============================================
-- 1. contract_status_history テーブルを作成
-- ============================================

CREATE TABLE IF NOT EXISTS contract_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  changed_by_user_id UUID NOT NULL REFERENCES users(id),
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  previous_phase TEXT,
  new_phase TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. インデックスを作成
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contract_status_history_contract_id
  ON contract_status_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_status_history_changed_at
  ON contract_status_history(changed_at DESC);

-- ============================================
-- 3. RLSポリシーを設定（認証が無効化されているためALLOW ALL）
-- ============================================

ALTER TABLE contract_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on contract_status_history" ON contract_status_history
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 完了メッセージ
-- ============================================
-- 上記SQLを実行後、アプリケーションでステータス変更履歴が記録されるようになります
