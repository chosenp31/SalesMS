-- Fix user roles migration
-- This migration fixes the user role constraint that failed in the previous migration

-- 制約を先に削除
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 既存のrole値を新しい値に変更
UPDATE users SET role = 'admin' WHERE role = 'manager';
UPDATE users SET role = 'user' WHERE role = 'sales';

-- 新しい制約を追加
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));

-- デフォルト値を変更
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- ユーザー作成トリガーを更新
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
