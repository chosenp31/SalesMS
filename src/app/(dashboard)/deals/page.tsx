import { createClient } from "@/lib/supabase/server";
import { DealList } from "@/components/features/deals/deal-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function DealsPage() {
  const supabase = await createClient();

  const { data: deals, error } = await supabase
    .from("deals")
    .select(`
      *,
      customer:customers(*),
      assigned_user:users(*),
      contracts(id, title, phase, status)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching deals:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">案件管理</h1>
          <p className="text-sm text-gray-500">案件の一覧と管理</p>
        </div>
        <Button asChild>
          <Link href="/deals/new">
            <Plus className="h-4 w-4 mr-2" />
            新規案件
          </Link>
        </Button>
      </div>
      <DealList deals={deals || []} />
    </div>
  );
}
