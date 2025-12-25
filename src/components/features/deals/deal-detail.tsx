"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Deal } from "@/types";
import {
  DEAL_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Loader2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn, formatDealId, formatContractId } from "@/lib/utils";
import { NewContractDialog } from "./new-contract-dialog";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/use-toast";
import { recordDelete, recordUpdate } from "@/lib/history";

interface DealDetailProps {
  deal: Deal;
  currentUserId?: string;
}

const statusColors: Record<string, string> = {
  active: "bg-blue-100 text-blue-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

export function DealDetail({ deal, currentUserId }: DealDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const hasContracts = (deal.contracts?.length || 0) > 0;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === deal.status) return;

    setStatusLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("deals")
        .update({ status: newStatus as "active" | "won" | "lost" | "pending" })
        .eq("id", deal.id);

      if (error) throw error;

      // 履歴を記録
      await recordUpdate(
        supabase,
        "deal",
        deal.id,
        currentUserId || null,
        { status: deal.status },
        { status: newStatus },
        ["status"]
      );

      toast({
        title: "ステータスを更新しました",
        description: `${DEAL_STATUS_LABELS[newStatus]}に変更しました`,
      });

      router.refresh();
    } catch (err) {
      toast({
        title: "更新に失敗しました",
        description: err instanceof Error ? err.message : "エラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const handleDelete = async () => {
    if (hasContracts) {
      toast({
        title: "削除できません",
        description: "関連する契約があるため削除できません。先に契約を削除してください。",
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const supabase = createClient();

      // 削除前に履歴を記録
      await recordDelete(supabase, "deal", deal.id, currentUserId || null);

      // 関連するタスクを削除
      await supabase
        .from("tasks")
        .delete()
        .eq("deal_id", deal.id);

      // 案件を削除
      const { error } = await supabase
        .from("deals")
        .delete()
        .eq("id", deal.id);

      if (error) throw error;

      toast({
        title: "案件を削除しました",
        description: `${deal.title}を削除しました`,
      });

      router.push("/deals");
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
      <div className="space-y-6">
        {/* Deal Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>案件情報</CardTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={hasContracts}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    削除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>案件を削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      {hasContracts ? (
                        <span className="text-red-600">
                          この案件には{deal.contracts?.length}件の契約が関連付けられているため削除できません。
                          先に契約を削除してください。
                        </span>
                      ) : (
                        <>
                          「{deal.title}」を削除します。関連するタスクも削除されます。この操作は取り消せません。
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={hasContracts || deleteLoading}
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
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">案件ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {formatDealId(deal.customer?.customer_number, deal.deal_number)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">顧客</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link
                      href={`/customers/${deal.customer_id}`}
                      className="text-primary hover:underline"
                    >
                      {deal.customer?.company_name || "-"}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    ステータス
                  </dt>
                  <dd className="mt-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild disabled={statusLoading}>
                        <button className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity">
                          <Badge
                            variant="secondary"
                            className={cn(statusColors[deal.status], "cursor-pointer")}
                          >
                            {statusLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            {DEAL_STATUS_LABELS[deal.status] || deal.status}
                          </Badge>
                          <ChevronDown className="h-3 w-3 text-gray-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {Object.entries(DEAL_STATUS_LABELS).map(([value, label]) => (
                          <DropdownMenuItem
                            key={value}
                            onClick={() => handleStatusChange(value)}
                            className={cn(
                              "cursor-pointer",
                              deal.status === value && "bg-blue-50 font-medium"
                            )}
                          >
                            <Badge
                              variant="secondary"
                              className={cn(statusColors[value], "mr-2")}
                            >
                              {label}
                            </Badge>
                            {deal.status === value && <span className="text-xs text-gray-400 ml-auto">現在</span>}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">合計金額</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatAmount(deal.total_amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">営業担当者</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {deal.sales_user?.name || deal.assigned_user?.name || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">アポインター</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {deal.appointer_user?.name || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">契約数</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {deal.contracts?.length || 0}件
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">作成日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(deal.created_at), "yyyy年MM月dd日", {
                      locale: ja,
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">更新日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(deal.updated_at), "yyyy年MM月dd日", {
                      locale: ja,
                    })}
                  </dd>
                </div>
                {deal.description && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">備考</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {deal.description}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Contracts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>契約一覧</CardTitle>
              <NewContractDialog deal={deal} />
            </CardHeader>
            <CardContent>
              {!deal.contracts || deal.contracts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  契約がまだ登録されていません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>契約ID</TableHead>
                      <TableHead>契約種別</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>月額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deal.contracts.map((contract) => (
                      <TableRow
                        key={contract.id}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => window.location.href = `/contracts/${contract.id}`}
                      >
                        <TableCell className="font-medium font-mono text-blue-600">
                          <Link href={`/contracts/${contract.id}`} className="hover:underline">
                            {formatContractId(deal.customer?.customer_number, deal.deal_number, contract.contract_number)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {contract.contract_type ? CONTRACT_TYPE_LABELS[contract.contract_type] : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {contract.status ? (CONTRACT_STATUS_LABELS[contract.status] || contract.status) : "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatAmount(contract.monthly_amount ?? null)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
