-- ========================================
-- 変更履歴テーブル（全エンティティ共通）
-- ========================================

-- 汎用変更履歴テーブル
CREATE TABLE entity_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('customer', 'deal', 'contract', 'task', 'payment')),
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    changes JSONB, -- {field_name: {old: value, new: value}, ...}
    comment TEXT, -- ステータス変更時のコメント用
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_entity_history_entity ON entity_history(entity_type, entity_id);
CREATE INDEX idx_entity_history_user ON entity_history(user_id);
CREATE INDEX idx_entity_history_created_at ON entity_history(created_at DESC);

-- RLSを無効化（デモモード）
ALTER TABLE entity_history DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 既存のcontract_status_historyからデータを移行
-- ========================================

-- 既存のステータス変更履歴をentity_historyに移行
INSERT INTO entity_history (entity_type, entity_id, action, user_id, changes, comment, created_at)
SELECT
    'contract',
    contract_id,
    'updated',
    changed_by_user_id,
    jsonb_build_object(
        'phase', jsonb_build_object('old', previous_phase, 'new', new_phase),
        'status', jsonb_build_object('old', previous_status, 'new', new_status)
    ),
    comment,
    changed_at
FROM contract_status_history
WHERE EXISTS (SELECT 1 FROM contract_status_history LIMIT 1);

-- 注意: contract_status_historyテーブルは残しておく（後方互換性のため）
-- 将来的に削除する場合はコメントアウトを解除
-- DROP TABLE contract_status_history;
