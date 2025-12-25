"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Activity, StatusChangeHistory } from "@/types";
import { CONTRACT_STATUS_LABELS } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { MessageSquare, User, Pencil, Trash2, Loader2, ArrowRightLeft, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/use-toast";

// ステータス履歴の型（ユーザー情報付き）
type StatusHistoryWithUser = StatusChangeHistory & {
  user?: { name: string } | null;
};

interface ActivityListProps {
  activities: Activity[];
  statusHistory?: StatusHistoryWithUser[];
}

// 統合された履歴アイテムの型
type UnifiedHistoryItem =
  | { type: "activity"; data: Activity; timestamp: Date }
  | { type: "status_change"; data: StatusHistoryWithUser; timestamp: Date };

// デフォルト表示件数
const DEFAULT_DISPLAY_COUNT = 5;

// 1時間 = 60分 * 60秒 * 1000ミリ秒
const ONE_HOUR_MS = 60 * 60 * 1000;

// 編集・削除可能かどうかを判定（作成から1時間以内）
const isEditable = (createdAt: string): boolean => {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  return now - createdTime < ONE_HOUR_MS;
};

// 残り時間を計算（分単位）
const getRemainingMinutes = (createdAt: string): number => {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const remaining = ONE_HOUR_MS - (now - createdTime);
  return Math.max(0, Math.ceil(remaining / (60 * 1000)));
};

export function ActivityList({ activities, statusHistory = [] }: ActivityListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // 活動履歴とステータス変更履歴を統合して時系列でソート
  const unifiedHistory = useMemo(() => {
    const items: UnifiedHistoryItem[] = [];

    // 活動履歴を追加
    activities.forEach((activity) => {
      items.push({
        type: "activity",
        data: activity,
        timestamp: new Date(activity.created_at),
      });
    });

    // ステータス変更履歴を追加
    statusHistory.forEach((status) => {
      items.push({
        type: "status_change",
        data: status,
        timestamp: new Date(status.created_at),
      });
    });

    // 新しい順にソート
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [activities, statusHistory]);

  // 表示する履歴
  const displayedHistory = showAll
    ? unifiedHistory
    : unifiedHistory.slice(0, DEFAULT_DISPLAY_COUNT);

  const hasMore = unifiedHistory.length > DEFAULT_DISPLAY_COUNT;

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setEditContent(activity.content);
  };

  const handleSaveEdit = async () => {
    if (!editingActivity || !editContent.trim()) return;

    if (!isEditable(editingActivity.created_at)) {
      toast({
        title: "編集できません",
        description: "作成から1時間以上経過したため編集できません。",
        variant: "destructive",
      });
      setEditingActivity(null);
      return;
    }

    setEditLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("activities")
        .update({ content: editContent.trim() })
        .eq("id", editingActivity.id);

      if (error) throw error;

      toast({
        title: "活動履歴を更新しました",
      });

      setEditingActivity(null);
      router.refresh();
    } catch (err) {
      toast({
        title: "更新に失敗しました",
        description: err instanceof Error ? err.message : "エラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (activity: Activity) => {
    if (!isEditable(activity.created_at)) {
      toast({
        title: "削除できません",
        description: "作成から1時間以上経過したため削除できません。",
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(activity.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", activity.id);

      if (error) throw error;

      toast({
        title: "活動履歴を削除しました",
      });

      router.refresh();
    } catch (err) {
      toast({
        title: "削除に失敗しました",
        description: err instanceof Error ? err.message : "エラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  if (unifiedHistory.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        活動履歴がありません
      </p>
    );
  }

  // ステータス変更アイテムをレンダリング
  const renderStatusChangeItem = (item: StatusHistoryWithUser) => (
    <div
      key={`status-${item.id}`}
      className="flex space-x-4 p-4 bg-orange-50 rounded-lg border border-orange-100"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
        <ArrowRightLeft className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              ステータス変更
            </Badge>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <User className="h-3 w-3" />
              {item.user?.name || "不明"}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            {format(new Date(item.created_at), "yyyy/MM/dd HH:mm", {
              locale: ja,
            })}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm flex-wrap">
          {item.previous_status && (
            <>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                {CONTRACT_STATUS_LABELS[item.previous_status] || item.previous_status}
              </span>
              <span className="text-gray-400">→</span>
            </>
          )}
          <span className="px-2 py-0.5 bg-primary/10 rounded text-primary font-medium">
            {CONTRACT_STATUS_LABELS[item.new_status] || item.new_status}
          </span>
        </div>
        {item.comment && (
          <div className="mt-2 flex items-start gap-2 text-sm text-gray-600 bg-white rounded p-2 border">
            <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
            <span className="whitespace-pre-wrap">{item.comment}</span>
          </div>
        )}
      </div>
    </div>
  );

  // 活動アイテムをレンダリング
  const renderActivityItem = (activity: Activity) => {
    const canEdit = isEditable(activity.created_at);
    const remainingMinutes = getRemainingMinutes(activity.created_at);

    return (
      <div
        key={`activity-${activity.id}`}
        className="flex space-x-4 p-4 bg-gray-50 rounded-lg"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-600">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <Badge variant="secondary">
                活動記録
              </Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <User className="h-3 w-3" />
                {activity.user?.name || "不明"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <span className="text-xs text-gray-400">
                  あと{remainingMinutes}分で編集不可
                </span>
              )}
              <span className="text-xs text-gray-400">
                {format(new Date(activity.created_at), "yyyy/MM/dd HH:mm", {
                  locale: ja,
                })}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {activity.content}
          </p>
          {canEdit && (
            <div className="mt-2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleEdit(activity)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                編集
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deleteLoading === activity.id}
                  >
                    {deleteLoading === activity.id ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-1" />
                    )}
                    削除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>活動履歴を削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この活動履歴を削除します。この操作は取り消せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(activity)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      削除する
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {displayedHistory.map((item) =>
          item.type === "status_change"
            ? renderStatusChangeItem(item.data)
            : renderActivityItem(item.data)
        )}
      </div>

      {/* もっと見る / 閉じる ボタン */}
      {hasMore && (
        <div className="mt-4 text-center">
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

      {/* 編集ダイアログ */}
      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>活動履歴を編集</DialogTitle>
            <DialogDescription>
              活動内容を編集してください。作成から1時間以内のみ編集可能です。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingActivity(null)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveEdit} disabled={editLoading || !editContent.trim()}>
              {editLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
