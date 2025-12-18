import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">入金管理</h1>
        <p className="text-sm text-gray-500">入金の一覧と管理</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            入金管理機能
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            この機能はPhase 2で実装予定です。
            <br />
            入金予定の管理、入金確認、レポート機能などが可能になります。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
