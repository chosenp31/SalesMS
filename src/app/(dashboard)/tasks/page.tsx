import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">タスク管理</h1>
        <p className="text-sm text-gray-500">タスクの一覧と管理</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            タスク管理機能
          </h3>
          <p className="text-sm text-gray-500 text-center max-w-md">
            この機能はPhase 2で実装予定です。
            <br />
            タスクの作成、割り当て、進捗管理などが可能になります。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
