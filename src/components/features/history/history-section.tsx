"use client";

import { useState } from "react";
import { EntityHistory, EntityType, StatusChangeHistory } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { History, Plus, Pencil, Trash2, MessageSquare, ArrowRightLeft, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACTION_LABELS,
  ENTITY_LABELS,
  getFieldLabel,
  formatValue,
} from "@/lib/history";
import { CONTRACT_STATUS_LABELS } from "@/constants";

// ステータス履歴の型（ユーザー情報付き）
type StatusHistoryWithUser = Omit<StatusChangeHistory, 'user'> & {
  changed_by_user?: { name: string } | null;
};

// 統合された履歴アイテムの型
type UnifiedHistoryItem =
  | { type: "entity_history"; data: EntityHistory; timestamp: Date }
  | { type: "status_change"; data: StatusHistoryWithUser; timestamp: Date };

interface HistorySectionProps {
  history: EntityHistory[];
  entityType: EntityType;
  title?: string;
  statusHistory?: StatusHistoryWithUser[];
}

// デフォルト表示件数
const DEFAULT_DISPLAY_COUNT = 5;

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
  statusHistory = [],
}: HistorySectionProps) {
  const [showAll, setShowAll] = useState(false);

  // entity_historyとstatus_historyを統合して時系列順にソート
  const unifiedHistory: UnifiedHistoryItem[] = [
    ...history.map((item) => ({
      type: "entity_history" as const,
      data: item,
      timestamp: new Date(item.created_at),
    })),
    ...statusHistory.map((item) => ({
      type: "status_change" as const,
      data: item,
      timestamp: new Date(item.created_at),
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // 表示する履歴
  const displayedHistory = showAll
    ? unifiedHistory
    : unifiedHistory.slice(0, DEFAULT_DISPLAY_COUNT);

  const hasMore = unifiedHistory.length > DEFAULT_DISPLAY_COUNT;

  if (unifiedHistory.length === 0) {
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
          {displayedHistory.map((item) => {
            if (item.type === "status_change") {
              // ステータス変更履歴の表示
              const statusItem = item.data;
              return (
                <div key={`status-${statusItem.id}`} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-800">
                      <ArrowRightLeft className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {statusItem.changed_by_user?.name || "システム"}
                        </span>
                        <span className="text-gray-500 text-sm">が</span>
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                          ステータス変更
                        </Badge>
                        <span className="text-gray-500 text-xs">
                          {format(new Date(statusItem.created_at), "yyyy/MM/dd HH:mm", { locale: ja })}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
                        <span className="text-gray-500">・</span>
                        <span className="font-medium">ステータス:</span>
                        <span className="text-red-600 line-through">
                          {statusItem.previous_status ? (CONTRACT_STATUS_LABELS[statusItem.previous_status] || statusItem.previous_status) : "なし"}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-600">
                          {CONTRACT_STATUS_LABELS[statusItem.new_status] || statusItem.new_status}
                        </span>
                      </div>
                      {statusItem.comment && (
                        <div className="mt-2 flex items-start gap-2 bg-gray-50 rounded p-2">
                          <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-600">{statusItem.comment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // エンティティ履歴の表示
            const historyItem = item.data;
            const ActionIcon = actionIcons[historyItem.action];
            const changes = historyItem.changes || {};
            const changeKeys = Object.keys(changes);

            return (
              <div key={historyItem.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  {/* アクションアイコン */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                      actionColors[historyItem.action]
                    )}
                  >
                    <ActionIcon className="h-4 w-4" />
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    {/* ヘッダー */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {historyItem.user?.name || "システム"}
                      </span>
                      <span className="text-gray-500 text-sm">が</span>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", actionColors[historyItem.action])}
                      >
                        {ACTION_LABELS[historyItem.action]}
                      </Badge>
                      <span className="text-gray-500 text-xs">
                        {format(
                          new Date(historyItem.created_at),
                          "yyyy/MM/dd HH:mm",
                          { locale: ja }
                        )}
                      </span>
                    </div>

                    {/* 変更内容（更新の場合） */}
                    {historyItem.action === "updated" && changeKeys.length > 0 && (
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
                    {historyItem.comment && (
                      <div className="mt-2 flex items-start gap-2 bg-gray-50 rounded p-2">
                        <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600">{historyItem.comment}</p>
                      </div>
                    )}

                    {/* 作成時のメッセージ */}
                    {historyItem.action === "created" && (
                      <p className="mt-1 text-sm text-gray-500">
                        {ENTITY_LABELS[entityType]}を作成しました
                      </p>
                    )}

                    {/* 削除時のメッセージ */}
                    {historyItem.action === "deleted" && (
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

        {/* もっと見る / 閉じる ボタン */}
        {hasMore && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  閉じる
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  過去の履歴をすべて表示（残り{unifiedHistory.length - DEFAULT_DISPLAY_COUNT}件）
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
