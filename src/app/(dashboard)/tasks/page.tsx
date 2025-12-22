import { createClient } from "@/lib/supabase/server";
import { TaskList } from "@/components/features/tasks/task-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskDialog } from "@/components/features/tasks/task-dialog";

interface TasksPageProps {
  searchParams: Promise<{ contract_id?: string; status?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const contractIdFilter = params.contract_id;
  const statusFilter = params.status;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("tasks")
    .select(`
      *,
      deal:deals(
        id,
        title,
        deal_number,
        customer:customers(id, company_name, customer_number)
      ),
      contract:contracts(id, title, phase, status, contract_number),
      assigned_user:users(*)
    `)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  // Apply contract_id filter if provided
  if (contractIdFilter) {
    query = query.eq("contract_id", contractIdFilter);
  }

  // Apply status filter if provided
  if (statusFilter === "incomplete") {
    query = query.neq("status", "完了");
  }

  const { data: tasks, error } = await query;

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

  // Get filter description
  let filterDescription = "タスクの一覧と管理";
  if (contractIdFilter && tasks && tasks.length > 0) {
    const contractTitle = tasks[0].contract?.title || "契約";
    if (statusFilter === "incomplete") {
      filterDescription = `「${contractTitle}」の未完了タスク`;
    } else {
      filterDescription = `「${contractTitle}」のタスク一覧`;
    }
  } else if (statusFilter === "incomplete") {
    filterDescription = "未完了タスクの一覧";
  }

  // デモモード時のデフォルトユーザーID（認証無効時は最初のユーザーを使用）
  const defaultUserId = authUser?.id || users?.[0]?.id || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">タスク管理</h1>
          <p className="text-sm text-gray-500">{filterDescription}</p>
        </div>
        <TaskDialog
          users={users || []}
          deals={deals || []}
          currentUserId={defaultUserId}
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
        currentUserId={defaultUserId}
        filterContractId={contractIdFilter}
        filterStatus={statusFilter}
      />
    </div>
  );
}
