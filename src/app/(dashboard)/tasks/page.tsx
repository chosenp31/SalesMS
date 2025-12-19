import { createClient } from "@/lib/supabase/server";
import { TaskList } from "@/components/features/tasks/task-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskDialog } from "@/components/features/tasks/task-dialog";

export default async function TasksPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(`
      *,
      deal:deals(
        id,
        title,
        deal_number,
        customer:customers(company_name, customer_number)
      ),
      contract:contracts(id, title, phase, status, contract_number),
      assigned_user:users(*)
    `)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error);
  }

  // Get all users for assignment
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("name");

  // Get all deals for linking
  const { data: deals } = await supabase
    .from("deals")
    .select("id, title, customer:customers(company_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">タスク管理</h1>
          <p className="text-sm text-gray-500">タスクの一覧と管理</p>
        </div>
        <TaskDialog
          users={users || []}
          deals={deals || []}
          currentUserId={authUser?.id || ""}
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規タスク
            </Button>
          }
        />
      </div>
      <TaskList
        tasks={tasks || []}
        users={users || []}
        deals={deals || []}
        currentUserId={authUser?.id || ""}
      />
    </div>
  );
}
