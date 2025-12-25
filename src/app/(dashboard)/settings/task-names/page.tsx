import { createClient } from "@/lib/supabase/server";
import { TaskNameManagement } from "@/components/features/settings/task-name-management";

export default async function TaskNamesSettingsPage() {
  const supabase = await createClient();

  const { data: taskNames } = await supabase
    .from("task_name_master")
    .select("*")
    .order("contract_type")
    .order("display_order");

  // Get users to check admin status
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  // デモモードでは最初のユーザーを使用
  const currentUser = users?.[0];
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">タスク名マスタ</h1>
        <p className="text-gray-500">
          {isAdmin
            ? "タスク名のプルダウン選択肢を管理します"
            : "タスク名一覧を表示しています（編集には管理者権限が必要です）"
          }
        </p>
      </div>

      <TaskNameManagement taskNames={taskNames || []} isAdmin={isAdmin} />
    </div>
  );
}
