import { createClient } from "@/lib/supabase/server";
import { TaskDetail } from "@/components/features/tasks/task-detail";
import { HistorySection } from "@/components/features/history/history-section";
import { notFound } from "next/navigation";
import { getHistory } from "@/lib/history";
import { getCurrentUserIdOrFallback } from "@/lib/auth";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 認証ユーザーID取得（認証無効時はデモ用フォールバック）
  const currentUserId = await getCurrentUserIdOrFallback();

  // Fetch task with related data
  const { data: task, error } = await supabase
    .from("tasks")
    .select(`
      *,
      assigned_user:users!tasks_assigned_user_id_fkey(id, name, email),
      deal:deals!tasks_deal_id_fkey(
        id,
        title,
        deal_number,
        customer:customers!deals_customer_id_fkey(id, company_name, customer_number)
      ),
      contract:contracts!tasks_contract_id_fkey(id, contract_number, status)
    `)
    .eq("id", id)
    .single();

  if (error || !task) {
    notFound();
  }

  // Fetch users for edit dialog
  const { data: users } = await supabase
    .from("users")
    .select("id, name, email")
    .order("name");

  // Get history for this task
  const history = await getHistory(supabase, "task", id);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <TaskDetail
        task={task}
        users={users || []}
        currentUserId={currentUserId}
      />
      <HistorySection history={history} entityType="task" />
    </div>
  );
}
