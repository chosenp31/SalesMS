-- Add display number columns for human-readable IDs

-- Customers: customer_number for generating IDs like "C001"
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_number SERIAL;

-- Deals: deal_number for generating IDs like "C001-01" (customer_number-deal_number)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_number INTEGER DEFAULT 1;

-- Contracts: contract_number for generating IDs like "C001-01-01"
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_number INTEGER DEFAULT 1;

-- Tasks: task_number for generating IDs like "C001-01-01-01"
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_number INTEGER DEFAULT 1;

-- Create function to auto-increment deal_number per customer
CREATE OR REPLACE FUNCTION set_deal_number()
RETURNS TRIGGER AS $$
BEGIN
    SELECT COALESCE(MAX(deal_number), 0) + 1 INTO NEW.deal_number
    FROM deals
    WHERE customer_id = NEW.customer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deal_number
DROP TRIGGER IF EXISTS set_deal_number_trigger ON deals;
CREATE TRIGGER set_deal_number_trigger
    BEFORE INSERT ON deals
    FOR EACH ROW
    EXECUTE FUNCTION set_deal_number();

-- Create function to auto-increment contract_number per deal
CREATE OR REPLACE FUNCTION set_contract_number()
RETURNS TRIGGER AS $$
BEGIN
    SELECT COALESCE(MAX(contract_number), 0) + 1 INTO NEW.contract_number
    FROM contracts
    WHERE deal_id = NEW.deal_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contract_number
DROP TRIGGER IF EXISTS set_contract_number_trigger ON contracts;
CREATE TRIGGER set_contract_number_trigger
    BEFORE INSERT ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION set_contract_number();

-- Create function to auto-increment task_number per contract
CREATE OR REPLACE FUNCTION set_task_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contract_id IS NOT NULL THEN
        SELECT COALESCE(MAX(task_number), 0) + 1 INTO NEW.task_number
        FROM tasks
        WHERE contract_id = NEW.contract_id;
    ELSE
        SELECT COALESCE(MAX(task_number), 0) + 1 INTO NEW.task_number
        FROM tasks
        WHERE deal_id = NEW.deal_id AND contract_id IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task_number
DROP TRIGGER IF EXISTS set_task_number_trigger ON tasks;
CREATE TRIGGER set_task_number_trigger
    BEFORE INSERT ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_task_number();

-- Update existing records with sequential numbers
-- Customers already have SERIAL

-- Update deals
WITH numbered_deals AS (
    SELECT id, customer_id,
           ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at) as rn
    FROM deals
)
UPDATE deals SET deal_number = numbered_deals.rn
FROM numbered_deals
WHERE deals.id = numbered_deals.id;

-- Update contracts
WITH numbered_contracts AS (
    SELECT id, deal_id,
           ROW_NUMBER() OVER (PARTITION BY deal_id ORDER BY created_at) as rn
    FROM contracts
)
UPDATE contracts SET contract_number = numbered_contracts.rn
FROM numbered_contracts
WHERE contracts.id = numbered_contracts.id;

-- Update tasks
WITH numbered_tasks AS (
    SELECT id, contract_id, deal_id,
           ROW_NUMBER() OVER (PARTITION BY COALESCE(contract_id, deal_id) ORDER BY created_at) as rn
    FROM tasks
)
UPDATE tasks SET task_number = numbered_tasks.rn
FROM numbered_tasks
WHERE tasks.id = numbered_tasks.id;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_customer_number ON customers(customer_number);
CREATE INDEX IF NOT EXISTS idx_deals_customer_deal_number ON deals(customer_id, deal_number);
CREATE INDEX IF NOT EXISTS idx_contracts_deal_contract_number ON contracts(deal_id, contract_number);
CREATE INDEX IF NOT EXISTS idx_tasks_contract_task_number ON tasks(contract_id, task_number);
