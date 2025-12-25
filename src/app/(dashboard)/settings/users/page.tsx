import { createClient } from "@/lib/supabase/server";
import { UserManagement } from "@/components/features/settings/user-management";

export default async function UsersSettingsPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <p className="text-gray-500">ユーザーの追加、編集、権限の設定を行います</p>
      </div>

      <UserManagement users={users || []} />
    </div>
  );
}
