import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ContractForm } from "@/components/features/contracts/contract-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface NewContractPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewContractPage({ params }: NewContractPageProps) {
  const { id: dealId } = await params;
  const supabase = await createClient();

  // Verify deal exists
  const { data: deal, error } = await supabase
    .from("deals")
    .select("id, title, customer:customers(company_name)")
    .eq("id", dealId)
    .single();

  if (error || !deal) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/deals/${dealId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            商談へ戻る
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新規契約登録</h1>
          <p className="text-sm text-gray-500">
            {deal.title} - {deal.customer?.company_name}
          </p>
        </div>
      </div>
      <ContractForm dealId={dealId} />
    </div>
  );
}
