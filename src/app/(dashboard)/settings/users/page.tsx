import { createClient } from "@/lib/supabase/server";
import { UserManagement } from "@/components/features/settings/user-management";

export default async function UsersSettingsPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  // Get current user to check admin status
  // デモモードでは最初のユーザーを使用
  const currentUser = users?.[0];
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <p className="text-gray-500">
          {isAdmin
            ? "ユーザーの追加、編集、権限の設定を行います"
            : "ユーザー一覧を表示しています（編集には管理者権限が必要です）"
          }
        </p>
      </div>

      <UserManagement users={users || []} isAdmin={isAdmin} />
    </div>
  );
}
