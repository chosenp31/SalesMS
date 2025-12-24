import { createClient } from "@/lib/supabase/server";
import { TaskDetail } from "@/components/features/tasks/task-detail";
import { notFound, redirect } from "next/navigation";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

  return (
    <div className="container mx-auto py-6">
      <TaskDetail
        task={task}
        users={users || []}
        currentUserId={user.id}
      />
    </div>
  );
}
