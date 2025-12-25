"use client";

import { StatusChangeHistory } from "@/types";
import { CONTRACT_STATUS_LABELS } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { History, ArrowRight, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusHistoryWithUser = StatusChangeHistory & {
  user?: { name: string } | null;
};

interface StatusHistoryCardProps {
  history: StatusHistoryWithUser[];
}

export function StatusHistoryCard({ history }: StatusHistoryCardProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            ステータス変更履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">変更履歴はありません</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="h-5 w-5 mr-2" />
          ステータス変更履歴
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "relative pl-6 pb-4",
                index < history.length - 1 && "border-l-2 border-gray-200"
              )}
            >
              {/* タイムライン上の点 */}
              <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-white" />

              <div className="space-y-2">
                {/* 日時と変更者 */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    {format(new Date(item.created_at), "yyyy/MM/dd HH:mm", {
                      locale: ja,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.user?.name || "不明"}
                  </span>
                </div>

                {/* ステータス変更 */}
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  {item.previous_status && (
                    <>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                        {CONTRACT_STATUS_LABELS[item.previous_status] || item.previous_status}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </>
                  )}
                  <span className="px-2 py-0.5 bg-primary/10 rounded text-primary font-medium">
                    {CONTRACT_STATUS_LABELS[item.new_status] || item.new_status}
                  </span>
                </div>

                {/* コメント */}
                {item.comment && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 rounded p-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span className="whitespace-pre-wrap">{item.comment}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
