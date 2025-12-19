import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ContractDetail } from "@/components/features/contracts/contract-detail";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

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
        customer:customers(id, company_name)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !contract) {
    notFound();
  }

  // Get lease applications for this contract
  const { data: leaseApplications } = await supabase
    .from("lease_applications")
    .select("*")
    .eq("contract_id", id)
    .order("created_at", { ascending: false });

  // Get payments for this contract
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("contract_id", id)
    .order("expected_date", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/deals/${contract.deal_id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              商談へ戻る
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
        leaseApplications={leaseApplications || []}
        payments={payments || []}
      />
    </div>
  );
}
