"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Task, User } from "@/types";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  CONTRACT_STEP_LABELS,
} from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ClipboardList,
  User as UserIcon,
  Calendar,
  Flag,
  FileText,
  Building2,
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn, formatDealId, formatContractId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/use-toast";
import { recordDelete } from "@/lib/history";
import { TaskDialog } from "./task-dialog";

interface TaskDetailProps {
  task: Task;
  users: User[];
  currentUserId: string;
  isAdmin?: boolean;
}

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const statusColors = {
  未着手: "bg-gray-100 text-gray-800",
  進行中: "bg-blue-100 text-blue-800",
  完了: "bg-green-100 text-green-800",
};

export function TaskDetail({ task, users, currentUserId, isAdmin = false }: TaskDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!isAdmin) {
      toast({
        title: "削除できません",
        description: "削除は管理者のみ実行可能です。",
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const supabase = createClient();

      // 削除前に履歴を記録
      await recordDelete(supabase, "task", task.id, currentUserId || null);

      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id);

      if (error) throw error;

      toast({
        title: "タスクを削除しました",
        description: `${task.title}を削除しました`,
      });

      router.push("/tasks");
      router.refresh();
    } catch (err) {
      toast({
        title: "削除に失敗しました",
        description: err instanceof Error ? err.message : "エラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 戻るボタン */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/tasks">
          <ArrowLeft className="h-4 w-4 mr-2" />
          タスク一覧に戻る
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メイン情報 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <ClipboardList className="h-5 w-5 mr-2" />
                タスク情報
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  編集
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={!isAdmin}
                      onClick={(e) => {
                        if (!isAdmin) {
                          e.preventDefault();
                          toast({
                            title: "削除できません",
                            description: "削除は管理者のみ実行可能です。",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>タスクを削除しますか？</AlertDialogTitle>
                      <AlertDialogDescription>
                        {!isAdmin ? (
                          <span className="text-red-600">
                            削除は管理者のみ実行可能です。
                          </span>
                        ) : (
                          <>
                            「{task.title}」を削除します。この操作は取り消せません。
                          </>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={!isAdmin || deleteLoading}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            削除中...
                          </>
                        ) : (
                          "削除する"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">タイトル</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {task.title}
                  </dd>
                </div>
                {task.description && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">説明</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {task.description}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                  <dd className="mt-1">
                    <Badge className={cn(statusColors[task.status])}>
                      {TASK_STATUS_LABELS[task.status]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">優先度</dt>
                  <dd className="mt-1">
                    <Badge className={cn(priorityColors[task.priority])}>
                      <Flag className="h-3 w-3 mr-1" />
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">期限</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {task.due_date
                      ? format(new Date(task.due_date), "yyyy年MM月dd日", { locale: ja })
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">担当者</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    {task.assigned_user?.name || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">作成日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(task.created_at), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">更新日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(task.updated_at), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 関連情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">関連情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 案件 */}
              {task.deal && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    案件
                  </dt>
                  <dd className="mt-1">
                    <Link
                      href={`/deals/${task.deal.id}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <span className="font-mono text-xs">
                        {formatDealId(task.deal.customer?.customer_number, task.deal.deal_number)}
                      </span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {task.deal.customer?.company_name}
                    </p>
                  </dd>
                </div>
              )}

              {/* 契約 */}
              {task.contract && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    契約
                  </dt>
                  <dd className="mt-1">
                    <Link
                      href={`/contracts/${task.contract.id}`}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <span className="font-mono text-xs">
                        {formatContractId(
                          task.deal?.customer?.customer_number,
                          task.deal?.deal_number,
                          task.contract.contract_number
                        )}
                      </span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    {task.contract.step && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {CONTRACT_STEP_LABELS[task.contract.step] || task.contract.step}
                      </Badge>
                    )}
                  </dd>
                </div>
              )}

              {!task.deal && !task.contract && (
                <p className="text-sm text-gray-500">関連する案件・契約はありません</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 編集ダイアログ */}
      {isEditDialogOpen && (
        <TaskDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          task={task}
          users={users}
          deals={task.deal ? [{ id: task.deal.id, title: task.deal.title || "" }] : []}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
