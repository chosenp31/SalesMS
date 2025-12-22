import { createClient } from "@/lib/supabase/server";
import { DealForm } from "@/components/features/deals/deal-form";

interface NewDealPageProps {
  searchParams: Promise<{ customer_id?: string }>;
}

export default async function NewDealPage({ searchParams }: NewDealPageProps) {
  const { customer_id } = await searchParams;
  const supabase = await createClient();

  // Get all customers for the select
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("company_name");

  // Get all users for the select
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("name");

  // Get current user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // デモモード時のデフォルトユーザーID（認証無効時は最初のユーザーを使用）
  const defaultUserId = authUser?.id || users?.[0]?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">新規案件登録</h1>
        <p className="text-sm text-gray-500">新しい案件を登録します</p>
      </div>
      <DealForm
        customers={customers || []}
        users={users || []}
        defaultCustomerId={customer_id}
        currentUserId={defaultUserId}
      />
    </div>
  );
}
