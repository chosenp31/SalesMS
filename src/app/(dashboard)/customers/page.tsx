import { createClient } from "@/lib/supabase/server";
import { CustomerList } from "@/components/features/customers/customer-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function CustomersPage() {
  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching customers:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
          <p className="text-sm text-gray-500">
            顧客情報の一覧と管理
          </p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="h-4 w-4 mr-2" />
            新規顧客
          </Link>
        </Button>
      </div>
      <CustomerList customers={customers || []} />
    </div>
  );
}
