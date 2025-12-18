-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (営業担当)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'manager', 'sales')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers table (顧客)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    representative_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    business_type TEXT NOT NULL CHECK (business_type IN ('corporation', 'sole_proprietor', 'new_corporation')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deals table (案件)
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    assigned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'appointment_acquired',
    contract_type TEXT NOT NULL CHECK (contract_type IN ('lease', 'rental', 'installment')),
    product_category TEXT,
    estimated_amount DECIMAL(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lease applications table (リース審査申請)
CREATE TABLE lease_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    lease_company TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'reviewing', 'approved', 'rejected', 'conditionally_approved')),
    submitted_at TIMESTAMPTZ,
    result_at TIMESTAMPTZ,
    conditions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Installations table (工事・設置)
CREATE TABLE installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID UNIQUE NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'survey_scheduling', 'survey_completed', 'installation_scheduling', 'installation_completed')),
    survey_date DATE,
    installation_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments table (入金)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    lease_company TEXT,
    expected_amount DECIMAL(15, 2),
    actual_amount DECIMAL(15, 2),
    expected_date DATE,
    actual_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities table (活動履歴・議事録)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('phone', 'visit', 'email', 'online_meeting', 'other')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table (タスク)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    assigned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_deals_customer_id ON deals(customer_id);
CREATE INDEX idx_deals_assigned_user_id ON deals(assigned_user_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_lease_applications_deal_id ON lease_applications(deal_id);
CREATE INDEX idx_installations_deal_id ON installations(deal_id);
CREATE INDEX idx_payments_deal_id ON payments(deal_id);
CREATE INDEX idx_activities_deal_id ON activities(deal_id);
CREATE INDEX idx_tasks_deal_id ON tasks(deal_id);
CREATE INDEX idx_tasks_assigned_user_id ON tasks(assigned_user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lease_applications_updated_at
    BEFORE UPDATE ON lease_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installations_updated_at
    BEFORE UPDATE ON installations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (basic read access)
-- Users can read all users
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can view all customers
CREATE POLICY "Users can view all customers" ON customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert customers" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update customers" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Users can view all deals
CREATE POLICY "Users can view all deals" ON deals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert deals" ON deals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update deals" ON deals
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Users can view all lease applications
CREATE POLICY "Users can view all lease_applications" ON lease_applications
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert lease_applications" ON lease_applications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update lease_applications" ON lease_applications
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Users can view all installations
CREATE POLICY "Users can view all installations" ON installations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert installations" ON installations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update installations" ON installations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Users can view all payments
CREATE POLICY "Users can view all payments" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert payments" ON payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update payments" ON payments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Users can view all activities
CREATE POLICY "Users can view all activities" ON activities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert activities" ON activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can view all tasks
CREATE POLICY "Users can view all tasks" ON tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert tasks" ON tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update tasks" ON tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'sales'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
