import { CustomerForm } from "@/components/features/customers/customer-form";
import { getCurrentUserIdOrFallback } from "@/lib/auth";

export default async function NewCustomerPage() {
  // 現在のユーザーIDを取得（認証優先、デモモード対応）
  const currentUserId = await getCurrentUserIdOrFallback();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">新規顧客登録</h1>
        <p className="text-sm text-gray-500">
          新しい顧客情報を登録します
        </p>
      </div>
      <CustomerForm currentUserId={currentUserId} />
    </div>
  );
}
