"use client";

import { EntityHistory, EntityType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { History, Plus, Pencil, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACTION_LABELS,
  ENTITY_LABELS,
  getFieldLabel,
  formatValue,
} from "@/lib/history";

interface HistorySectionProps {
  history: EntityHistory[];
  entityType: EntityType;
  title?: string;
}

const actionIcons = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
};

const actionColors = {
  created: "bg-green-100 text-green-800",
  updated: "bg-blue-100 text-blue-800",
  deleted: "bg-red-100 text-red-800",
};

export function HistorySection({
  history,
  entityType,
  title,
}: HistorySectionProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <History className="h-5 w-5 mr-2" />
            {title || "変更履歴"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            変更履歴はありません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base">
          <History className="h-5 w-5 mr-2" />
          {title || "変更履歴"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {history.map((item) => {
            const ActionIcon = actionIcons[item.action];
            const changes = item.changes || {};
            const changeKeys = Object.keys(changes);

            return (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  {/* アクションアイコン */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      actionColors[item.action]
                    )}
                  >
                    <ActionIcon className="h-4 w-4" />
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    {/* ヘッダー */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {item.user?.name || "システム"}
                      </span>
                      <span className="text-gray-500 text-sm">が</span>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", actionColors[item.action])}
                      >
                        {ACTION_LABELS[item.action]}
                      </Badge>
                      <span className="text-gray-500 text-xs">
                        {format(
                          new Date(item.created_at),
                          "yyyy/MM/dd HH:mm",
                          { locale: ja }
                        )}
                      </span>
                    </div>

                    {/* 変更内容（更新の場合） */}
                    {item.action === "updated" && changeKeys.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {changeKeys.map((field) => {
                          const change = changes[field];
                          const fieldLabel = getFieldLabel(field, entityType);
                          const oldValue = formatValue(
                            field,
                            change.old,
                            entityType
                          );
                          const newValue = formatValue(
                            field,
                            change.new,
                            entityType
                          );

                          return (
                            <div
                              key={field}
                              className="text-sm text-gray-600 flex items-start gap-1"
                            >
                              <span className="text-gray-500">・</span>
                              <span className="font-medium">{fieldLabel}:</span>
                              <span className="text-red-600 line-through">
                                {oldValue}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="text-green-600">{newValue}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* コメント */}
                    {item.comment && (
                      <div className="mt-2 flex items-start gap-2 bg-gray-50 rounded p-2">
                        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600">{item.comment}</p>
                      </div>
                    )}

                    {/* 作成時のメッセージ */}
                    {item.action === "created" && (
                      <p className="mt-1 text-sm text-gray-500">
                        {ENTITY_LABELS[entityType]}を作成しました
                      </p>
                    )}

                    {/* 削除時のメッセージ */}
                    {item.action === "deleted" && (
                      <p className="mt-1 text-sm text-gray-500">
                        {ENTITY_LABELS[entityType]}を削除しました
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
