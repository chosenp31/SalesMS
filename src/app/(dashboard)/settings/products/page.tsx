import { createClient } from "@/lib/supabase/server";
import { ProductManagement } from "@/components/features/settings/product-management";

export default async function ProductsSettingsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("product_master")
    .select("*")
    .order("contract_type")
    .order("display_order");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">商材マスタ</h1>
        <p className="text-gray-500">契約種別ごとの商材を管理します</p>
      </div>

      <ProductManagement products={products || []} />
    </div>
  );
}
