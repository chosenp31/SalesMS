-- 活動履歴に契約IDを追加（任意項目）
ALTER TABLE activities ADD COLUMN contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- インデックスを追加
CREATE INDEX idx_activities_contract_id ON activities(contract_id);

COMMENT ON COLUMN activities.contract_id IS '関連する契約（任意）';
