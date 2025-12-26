"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Payment, Task, User, Activity } from "@/types";
import { Tables } from "@/types/database";
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STAGE_LABELS,
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
import { StatusWorkflow } from "../deals/status-workflow";
import { ContractTaskCard } from "./contract-task-card";
import { ActivityForm } from "../activities/activity-form";
import { ActivityList } from "../activities/activity-list";
import { CreditCard, FileText, ExternalLink, Trash2, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { formatDealId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/use-toast";
import { recordDelete } from "@/lib/history";

// 契約詳細ページ用の型（部分的なdeal情報を含む）
type ContractWithPartialDeal = Tables<"contracts"> & {
  deal?: {
    id: string;
    title: string;
    deal_number?: number;
    customer?: {
      id: string;
      company_name: string;
      customer_number?: number;
    };
  };
};

interface ContractDetailProps {
  contract: ContractWithPartialDeal;
  payments: Payment[];
  tasks: Task[];
  users: User[];
  activities: Activity[];
  currentUserId: string;
  isAdmin?: boolean;
}

// 削除可能なステップ（商談中ステージのみ）
const DELETABLE_STEPS = ["商談待ち", "商談日程調整中"];

export function ContractDetail({
  contract,
  payments,
  tasks,
  users,
  activities,
  currentUserId,
  isAdmin = false,
}: ContractDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isStepDeletable = DELETABLE_STEPS.includes(contract.step);
  const canDelete = isAdmin && isStepDeletable;

  const formatAmount = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      toast({
        title: "削除できません",
        description: "削除は管理者のみ実行可能です。",
        variant: "destructive",
      });
      return;
    }

    if (!isStepDeletable) {
      toast({
        title: "削除できません",
        description: "ステップが進行しているため削除できません。",
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const supabase = createClient();

      // 削除前に履歴を記録
      await recordDelete(supabase, "contract", contract.id, currentUserId || null);

      // 関連する活動履歴を削除
      await supabase
        .from("activities")
        .delete()
        .eq("contract_id", contract.id);

      // 関連するステータス履歴を削除
      await supabase
        .from("contract_status_history")
        .delete()
        .eq("contract_id", contract.id);

      // 関連する入金情報を削除
      await supabase
        .from("payments")
        .delete()
        .eq("contract_id", contract.id);

      // 関連するタスクを削除
      await supabase
        .from("tasks")
        .delete()
        .eq("contract_id", contract.id);

      // 契約を削除
      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", contract.id);

      if (error) throw error;

      toast({
        title: "契約を削除しました",
        description: `${contract.title}を削除しました`,
      });

      // 案件詳細に戻る
      if (contract.deal?.id) {
        router.push(`/deals/${contract.deal.id}`);
      } else {
        router.push("/contracts");
      }
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
      {/* Status Workflow */}
      <StatusWorkflow contract={contract} currentUserId={currentUserId} />

      {/* Contract Information (with period) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            契約情報
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={!canDelete}
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
                <AlertDialogTitle>契約を削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  {!isAdmin ? (
                    <span className="text-red-600">
                      削除は管理者のみ実行可能です。
                    </span>
                  ) : !isStepDeletable ? (
                    <span className="text-red-600">
                      ステップが「{contract.step}」のため削除できません。
                      商談中ステージの契約のみ削除可能です。
                    </span>
                  ) : (
                    <>
                      「{contract.title}」を削除します。関連する活動履歴、タスク、入金情報、ステータス履歴も削除されます。この操作は取り消せません。
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={!canDelete || deleteLoading}
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
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">案件ID</dt>
              <dd className="mt-1 text-sm">
                {contract.deal ? (
                  <Link
                    href={`/deals/${contract.deal.id}`}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <span className="font-mono text-xs">
                      {formatDealId(contract.deal.customer?.customer_number, contract.deal.deal_number)}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">契約種別</dt>
              <dd className="mt-1">
                <Badge variant="outline">
                  {CONTRACT_TYPE_LABELS[contract.contract_type]}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">商品カテゴリ</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.product_category || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ステージ</dt>
              <dd className="mt-1">
                <Badge variant="outline">
                  {CONTRACT_STAGE_LABELS[contract.stage] || contract.stage}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ステップ</dt>
              <dd className="mt-1">
                <Badge>
                  {CONTRACT_STEP_LABELS[contract.step] || contract.step}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">契約期間</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.contract_months ? `${contract.contract_months}ヶ月` : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">開始日</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.start_date
                  ? format(new Date(contract.start_date), "yyyy年MM月dd日", {
                      locale: ja,
                    })
                  : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">終了日</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {contract.end_date
                  ? format(new Date(contract.end_date), "yyyy年MM月dd日", {
                      locale: ja,
                    })
                  : "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">作成日</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(contract.created_at), "yyyy年MM月dd日", {
                  locale: ja,
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">更新日</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(contract.updated_at), "yyyy年MM月dd日", {
                  locale: ja,
                })}
              </dd>
            </div>
          </dl>
          {contract.notes && (
            <div className="mt-4 pt-4 border-t">
              <dt className="text-sm font-medium text-gray-500">備考</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {contract.notes}
              </dd>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            金額情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">月額</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {formatAmount(contract.monthly_amount)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">合計金額</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {formatAmount(contract.total_amount)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">入金済み</dt>
              <dd className="mt-1 text-lg font-semibold text-green-600">
                {formatAmount(
                  payments
                    .filter((p) => p.status === "入金済")
                    .reduce((sum, p) => sum + (p.actual_amount || 0), 0)
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Activities (with status history) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            活動履歴
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ActivityForm
            contractId={contract.id}
            userId={currentUserId}
          />
          <ActivityList activities={activities} />
        </CardContent>
      </Card>

      {/* Task Card */}
      <ContractTaskCard
        contract={contract}
        tasks={tasks}
        users={users}
        currentUserId={currentUserId}
      />
    </div>
  );
}
