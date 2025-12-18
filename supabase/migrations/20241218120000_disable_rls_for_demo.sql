-- 認証チェックを一時的に無効化（デモ用）
-- TODO: 本番運用時はRLSを有効化すること

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can view all customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can view all deals" ON deals;
DROP POLICY IF EXISTS "Users can insert deals" ON deals;
DROP POLICY IF EXISTS "Users can update deals" ON deals;
DROP POLICY IF EXISTS "Users can view all lease_applications" ON lease_applications;
DROP POLICY IF EXISTS "Users can insert lease_applications" ON lease_applications;
DROP POLICY IF EXISTS "Users can update lease_applications" ON lease_applications;
DROP POLICY IF EXISTS "Users can view all installations" ON installations;
DROP POLICY IF EXISTS "Users can insert installations" ON installations;
DROP POLICY IF EXISTS "Users can update installations" ON installations;
DROP POLICY IF EXISTS "Users can view all payments" ON payments;
DROP POLICY IF EXISTS "Users can insert payments" ON payments;
DROP POLICY IF EXISTS "Users can update payments" ON payments;
DROP POLICY IF EXISTS "Users can view all activities" ON activities;
DROP POLICY IF EXISTS "Users can insert activities" ON activities;
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;

-- RLSを無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE lease_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE installations DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- デモ用のデフォルトユーザーを作成
INSERT INTO users (id, email, name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'デモユーザー', 'admin')
ON CONFLICT (id) DO NOTHING;
