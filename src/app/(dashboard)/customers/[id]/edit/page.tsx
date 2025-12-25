import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/features/customers/customer-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !customer) {
    notFound();
  }

  // ユーザーリストを取得してcurrentUserIdを設定
  const { data: users } = await supabase
    .from("users")
    .select("id")
    .order("name")
    .limit(1);

  const currentUserId = users?.[0]?.id || "";

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/customers/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">顧客編集</h1>
          <p className="text-sm text-gray-500">{customer.company_name}</p>
        </div>
      </div>
      <CustomerForm customer={customer} currentUserId={currentUserId} />
    </div>
  );
}
