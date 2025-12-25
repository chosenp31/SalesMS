import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DealDetail } from "@/components/features/deals/deal-detail";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

interface DealDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deal, error } = await supabase
    .from("deals")
    .select(`
      *,
      customer:customers(*),
      sales_user:users!sales_user_id(*),
      appointer_user:users!appointer_user_id(*),
      contracts(*)
    `)
    .eq("id", id)
    .single();

  if (error || !deal) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/deals">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">案件詳細</h1>
        </div>
        <Button asChild>
          <Link href={`/deals/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            編集
          </Link>
        </Button>
      </div>
      <DealDetail deal={deal} />
    </div>
  );
}
