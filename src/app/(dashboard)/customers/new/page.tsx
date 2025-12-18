import { CustomerForm } from "@/components/features/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">新規顧客登録</h1>
        <p className="text-sm text-gray-500">
          新しい顧客情報を登録します
        </p>
      </div>
      <CustomerForm />
    </div>
  );
}
