import { createClient } from "@/lib/supabase/server";
import { TaskNameManagement } from "@/components/features/settings/task-name-management";

export default async function TaskNamesSettingsPage() {
  const supabase = await createClient();

  const { data: taskNames } = await supabase
    .from("task_name_master")
    .select("*")
    .order("contract_type")
    .order("display_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">タスク名マスタ</h1>
        <p className="text-gray-500">タスク名のプルダウン選択肢を管理します</p>
      </div>

      <TaskNameManagement taskNames={taskNames || []} />
    </div>
  );
}
