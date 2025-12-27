import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ContractDetail } from "@/components/features/contracts/contract-detail";
import { HistorySection } from "@/components/features/history/history-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { getHistory } from "@/lib/history";
import { getCurrentUserWithRole } from "@/lib/auth";

interface ContractDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contract, error } = await supabase
    .from("contracts")
    .select(`
      *,
      deal:deals(
        id,
        title,
        deal_number,
        customer:customers(id, company_name, customer_number)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !contract) {
    notFound();
  }

  // Get payments for this contract
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("contract_id", id)
    .order("expected_date", { ascending: true });

  // Get tasks for this contract
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      assigned_user:users!tasks_assigned_user_id_fkey(*),
      deal:deals(
        id,
        title,
        customer:customers(id, company_name)
      ),
      contract:contracts(id, title, step, stage)
    `)
    .eq("contract_id", id)
    .order("due_date", { ascending: true });

  // Get activities for this contract
  const { data: activities } = await supabase
    .from("activities")
    .select(`
      *,
      user:users(*)
    `)
    .eq("contract_id", id)
    .order("created_at", { ascending: false });

  // Get users for task assignment
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("name");

  // Get status history for this contract
  const { data: statusHistory } = await supabase
    .from("contract_status_history")
    .select(`
      *,
      changed_by_user:users(name)
    `)
    .eq("contract_id", id)
    .order("created_at", { ascending: false });

  // 認証ユーザーID取得（認証無効時はデモ用フォールバック）
  const { userId: currentUserId, isAdmin } = await getCurrentUserWithRole();

  // Get history for this contract
  const history = await getHistory(supabase, "contract", id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/deals/${contract.deal_id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              案件へ戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
            <p className="text-sm text-gray-500">契約詳細</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/contracts/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            編集
          </Link>
        </Button>
      </div>
      <ContractDetail
        contract={contract}
        payments={payments || []}
        tasks={tasks || []}
        users={users || []}
        activities={activities || []}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
      <HistorySection
        history={history}
        entityType="contract"
        statusHistory={statusHistory || []}
      />
    </div>
  );
}
