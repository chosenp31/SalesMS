import { createClient } from "@/lib/supabase/server";
import { ContractList } from "@/components/features/contracts/contract-list";

interface ContractsPageProps {
  searchParams: Promise<{ deal_id?: string }>;
}

export default async function ContractsPage({ searchParams }: ContractsPageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const dealIdFilter = params.deal_id;

  let query = supabase
    .from("contracts")
    .select(`
      *,
      deal:deals(
        id,
        title,
        deal_number,
        customer:customers(id, company_name, customer_number),
        assigned_user:users(id, name)
      ),
      tasks(id, status)
    `)
    .order("created_at", { ascending: false });

  // Apply deal_id filter if provided
  if (dealIdFilter) {
    query = query.eq("deal_id", dealIdFilter);
  }

  const { data: contracts, error } = await query;

  if (error) {
    console.error("Error fetching contracts:", error);
  }

  // Get the deal title for display if filtered
  let filterDealTitle: string | null = null;
  if (dealIdFilter && contracts && contracts.length > 0) {
    filterDealTitle = contracts[0].deal?.title || null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">契約管理</h1>
          <p className="text-sm text-gray-500">
            {filterDealTitle
              ? `「${filterDealTitle}」の契約一覧`
              : "契約の一覧と管理"
            }
          </p>
        </div>
      </div>
      <ContractList
        contracts={contracts || []}
        filterDealId={dealIdFilter}
      />
    </div>
  );
}
