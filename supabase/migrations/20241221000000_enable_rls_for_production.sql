-- Enable RLS for production
-- This migration re-enables Row Level Security for all tables

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Ensure contracts table has proper RLS policies (added in 20241219000000)
-- Users can view all contracts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contracts' AND policyname = 'Users can view all contracts'
    ) THEN
        CREATE POLICY "Users can view all contracts" ON contracts
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contracts' AND policyname = 'Users can insert contracts'
    ) THEN
        CREATE POLICY "Users can insert contracts" ON contracts
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contracts' AND policyname = 'Users can update contracts'
    ) THEN
        CREATE POLICY "Users can update contracts" ON contracts
            FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'contracts' AND policyname = 'Users can delete contracts'
    ) THEN
        CREATE POLICY "Users can delete contracts" ON contracts
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;
