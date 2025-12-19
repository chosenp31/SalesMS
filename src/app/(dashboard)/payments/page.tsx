import { createClient } from "@/lib/supabase/server";
import { PaymentList } from "@/components/features/payments/payment-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PaymentDialog } from "@/components/features/payments/payment-dialog";

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: payments, error } = await supabase
    .from("payments")
    .select(`
      *,
      contract:contracts(
        id,
        title,
        deal:deals(
          id,
          title,
          customer:customers(id, company_name)
        )
      )
    `)
    .order("expected_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching payments:", error);
  }

  // Get all contracts for linking
  const { data: contracts } = await supabase
    .from("contracts")
    .select(`
      id,
      title,
      deal:deals(
        id,
        title,
        customer:customers(company_name)
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">入金管理</h1>
          <p className="text-sm text-gray-500">入金の一覧と管理</p>
        </div>
        <PaymentDialog
          contracts={contracts || []}
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規入金
            </Button>
          }
        />
      </div>
      <PaymentList payments={payments || []} contracts={contracts || []} />
    </div>
  );
}
