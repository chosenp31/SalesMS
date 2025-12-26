import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CustomerDetail } from "@/components/features/customers/customer-detail";
import { HistorySection } from "@/components/features/history/history-section";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { getHistory } from "@/lib/history";
import { getCurrentUserIdOrFallback } from "@/lib/auth";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !customer) {
    notFound();
  }

  // Get deals for this customer
  const { data: deals } = await supabase
    .from("deals")
    .select(`
      *,
      sales_user:users!sales_user_id(*),
      appointer_user:users!appointer_user_id(*),
      contracts(id, title, contract_type, phase, status, monthly_amount, product_category, contract_number)
    `)
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  // 認証ユーザーID取得（認証無効時はデモ用フォールバック）
  const currentUserId = await getCurrentUserIdOrFallback();

  // Get history for this customer
  const history = await getHistory(supabase, "customer", id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.company_name}
            </h1>
            <p className="text-sm text-gray-500">顧客詳細</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/customers/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            編集
          </Link>
        </Button>
      </div>
      <CustomerDetail customer={customer} deals={deals || []} currentUserId={currentUserId} />
      <HistorySection history={history} entityType="customer" />
    </div>
  );
}
