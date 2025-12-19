import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ContractForm } from "@/components/features/contracts/contract-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EditContractPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContractPage({
  params,
}: EditContractPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contract, error } = await supabase
    .from("contracts")
    .select(`
      *,
      deal:deals(id, title, customer:customers(company_name))
    `)
    .eq("id", id)
    .single();

  if (error || !contract) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/contracts/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            契約詳細へ戻る
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">契約編集</h1>
          <p className="text-sm text-gray-500">
            {contract.deal?.title} - {contract.deal?.customer?.company_name}
          </p>
        </div>
      </div>
      <ContractForm dealId={contract.deal_id} contract={contract} />
    </div>
  );
}
