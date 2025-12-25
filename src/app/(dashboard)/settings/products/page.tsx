import { createClient } from "@/lib/supabase/server";
import { ProductManagement } from "@/components/features/settings/product-management";

export default async function ProductsSettingsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("product_master")
    .select("*")
    .order("contract_type")
    .order("display_order");

  // Get users to check admin status
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  // デモモードでは最初のユーザーを使用
  const currentUser = users?.[0];
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">商材マスタ</h1>
        <p className="text-gray-500">
          {isAdmin
            ? "契約種別ごとの商材を管理します"
            : "商材一覧を表示しています（編集には管理者権限が必要です）"
          }
        </p>
      </div>

      <ProductManagement products={products || []} isAdmin={isAdmin} />
    </div>
  );
}
