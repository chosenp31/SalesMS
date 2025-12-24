"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "@/types";
import { ACTIVITY_TYPE_LABELS } from "@/constants";
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
import { Phone, User, Mail, Video, MoreHorizontal, FileText, Pencil, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/use-toast";

interface ActivityListProps {
  activities: Activity[];
}

const activityIcons = {
  phone: Phone,
  visit: User,
  email: Mail,
  online_meeting: Video,
  other: MoreHorizontal,
};

const activityColors = {
  phone: "bg-blue-100 text-blue-600",
  visit: "bg-green-100 text-green-600",
  email: "bg-yellow-100 text-yellow-600",
  online_meeting: "bg-purple-100 text-purple-600",
  other: "bg-gray-100 text-gray-600",
};

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

export function ActivityList({ activities }: ActivityListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

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

  if (activities.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        活動履歴がありません
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.activity_type];
          const canEdit = isEditable(activity.created_at);
          const remainingMinutes = getRemainingMinutes(activity.created_at);

          return (
            <div
              key={activity.id}
              className="flex space-x-4 p-4 bg-gray-50 rounded-lg"
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  activityColors[activity.activity_type]
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <Badge variant="secondary">
                      {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                    </Badge>
                    {activity.contract && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {activity.contract.title}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500">
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
        })}
      </div>

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
