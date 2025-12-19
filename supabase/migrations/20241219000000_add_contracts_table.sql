-- Contracts table (契約)
-- 案件(deals)と1:n の関係で、複数の契約を管理
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    contract_type TEXT NOT NULL CHECK (contract_type IN ('lease', 'rental', 'installment')),
    product_category TEXT,
    lease_company TEXT,
    phase TEXT NOT NULL DEFAULT '商談中' CHECK (phase IN ('商談中', '審査中', '工事中', '入金中', '失注', 'クローズ')),
    status TEXT NOT NULL DEFAULT '日程調整中' CHECK (status IN (
        '日程調整中', 'MTG実施待ち', '見積提出', '受注確定',
        '書類準備中', '審査結果待ち', '可決', '否決',
        '下見日程調整中', '下見実施待ち', '工事日程調整中', '工事実施待ち',
        '入金待ち', '入金済', '失注', 'クローズ'
    )),
    monthly_amount DECIMAL(15, 2),
    total_amount DECIMAL(15, 2),
    contract_months INTEGER,
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add contract_id to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;

-- Add company field to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS company TEXT;

-- Update lease_applications to reference contracts instead of deals
ALTER TABLE lease_applications ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE;

-- Update payments to reference contracts instead of deals
ALTER TABLE payments ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('入金予定', '入金済', 'pending', 'paid'));

-- Update tasks status constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('未着手', '進行中', '完了', 'not_started', 'in_progress', 'completed'));

-- Update lease_applications status constraint
ALTER TABLE lease_applications DROP CONSTRAINT IF EXISTS lease_applications_status_check;
ALTER TABLE lease_applications ADD CONSTRAINT lease_applications_status_check CHECK (status IN ('準備中', '審査結果待ち', '可決', '否決', '条件付可決', 'preparing', 'reviewing', 'approved', 'rejected', 'conditionally_approved'));

-- Create index for contracts
CREATE INDEX IF NOT EXISTS idx_contracts_deal_id ON contracts(deal_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_phase ON contracts(phase);
CREATE INDEX IF NOT EXISTS idx_tasks_contract_id ON tasks(contract_id);
CREATE INDEX IF NOT EXISTS idx_lease_applications_contract_id ON lease_applications(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);

-- Create trigger for updated_at on contracts
CREATE OR REPLACE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for contracts
CREATE POLICY "Users can view all contracts" ON contracts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert contracts" ON contracts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update contracts" ON contracts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete contracts" ON contracts
    FOR DELETE USING (auth.role() = 'authenticated');
