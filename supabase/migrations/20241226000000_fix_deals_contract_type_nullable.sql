-- ========================================
-- deals.contract_type をNULL許可に変更
-- ========================================
--
-- 理由:
-- - 現在の設計では、contract_typeは契約(contracts)テーブルで管理
-- - 案件(deals)は複数の契約を持つ可能性があり、案件レベルでcontract_typeを持つのは不適切
-- - 案件登録フォームにcontract_typeフィールドがないため、NOT NULL制約でエラーが発生
--
-- 発見経緯: システムテスト実行時に案件登録でDBエラー発生
-- エラー: "null value in column "contract_type" of relation "deals" violates not-null constraint"

-- 1. NOT NULL制約を解除
ALTER TABLE deals ALTER COLUMN contract_type DROP NOT NULL;

-- 2. CHECK制約を更新（新しいcontract_type値を追加）
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_contract_type_check;
ALTER TABLE deals ADD CONSTRAINT deals_contract_type_check
    CHECK (contract_type IS NULL OR contract_type IN ('lease', 'rental', 'installment', 'property', 'line', 'maintenance'));

-- 3. product_categoryもNULL許可であることを確認（すでにNULL許可だが明示的に）
-- ALTER TABLE deals ALTER COLUMN product_category DROP NOT NULL; -- 既にNULL許可

-- 4. estimated_amountもNULL許可であることを確認（すでにNULL許可だが明示的に）
-- ALTER TABLE deals ALTER COLUMN estimated_amount DROP NOT NULL; -- 既にNULL許可
