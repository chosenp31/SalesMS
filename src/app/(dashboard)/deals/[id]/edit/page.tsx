import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DealForm } from "@/components/features/deals/deal-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EditDealPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDealPage({ params }: EditDealPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deal, error } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !deal) {
    notFound();
  }

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

  // 仮のcurrentUserId（認証が無効化されているため最初のユーザーを使用）
  const currentUserId = users?.[0]?.id || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/deals/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">案件編集</h1>
          <p className="text-sm text-gray-500">{deal.title}</p>
        </div>
      </div>
      <DealForm
        deal={deal}
        customers={customers || []}
        users={users || []}
        currentUserId={currentUserId}
      />
    </div>
  );
}
