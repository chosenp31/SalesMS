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
      assigned_user:users(*)
    `)
    .eq("id", id)
    .single();

  if (error || !deal) {
    notFound();
  }

  // Get activities for this deal
  const { data: activities } = await supabase
    .from("activities")
    .select(`
      *,
      user:users(*)
    `)
    .eq("deal_id", id)
    .order("created_at", { ascending: false });

  // Get current user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deal.title}</h1>
            <p className="text-sm text-gray-500">案件詳細</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/deals/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            編集
          </Link>
        </Button>
      </div>
      <DealDetail
        deal={deal}
        activities={activities || []}
        currentUserId={authUser?.id || ""}
      />
    </div>
  );
}
