"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Customer, Deal } from "@/types";
import { BUSINESS_TYPE_LABELS, DEAL_STATUS_LABELS } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import Link from "next/link";
import { Eye, Plus, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/use-toast";
import { recordDelete } from "@/lib/history";

interface CustomerDetailProps {
  customer: Customer;
  deals: Deal[];
  currentUserId?: string;
  isAdmin?: boolean;
}

const statusColors: Record<string, string> = {
  active: "bg-blue-100 text-blue-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

export function CustomerDetail({ customer, deals, currentUserId, isAdmin = false }: CustomerDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const hasDeals = deals.length > 0;
  const canDelete = isAdmin && !hasDeals;

  const handleDelete = async () => {
    if (!isAdmin) {
      toast({
        title: "削除できません",
        description: "削除は管理者のみ実行可能です。",
        variant: "destructive",
      });
      return;
    }

    if (hasDeals) {
      toast({
        title: "削除できません",
        description: "関連する案件があるため削除できません。先に案件を削除してください。",
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const supabase = createClient();

      // 削除前に履歴を記録
      await recordDelete(supabase, "customer", customer.id, currentUserId || null);

      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id);

      if (error) throw error;

      toast({
        title: "顧客を削除しました",
        description: `${customer.company_name}を削除しました`,
      });

      router.push("/customers");
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>基本情報</CardTitle>
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
                <AlertDialogTitle>顧客を削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  {!isAdmin ? (
                    <span className="text-red-600">
                      削除は管理者のみ実行可能です。
                    </span>
                  ) : hasDeals ? (
                    <span className="text-red-600">
                      この顧客には{deals.length}件の案件が関連付けられているため削除できません。
                      先に案件を削除してください。
                    </span>
                  ) : (
                    <>
                      「{customer.company_name}」を削除します。この操作は取り消せません。
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
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">会社名</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {customer.company_name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">代表者名</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {customer.representative_name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">事業形態</dt>
              <dd className="mt-1">
                <Badge variant="secondary">
                  {BUSINESS_TYPE_LABELS[customer.business_type]}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">電話番号</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {customer.phone || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">メール</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {customer.email || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">住所</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {customer.address || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">登録日</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(customer.created_at), "yyyy年MM月dd日", {
                  locale: ja,
                })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>案件一覧</CardTitle>
          <Button size="sm" asChild>
            <Link href={`/deals/new?customer_id=${customer.id}`}>
              <Plus className="h-4 w-4 mr-2" />
              新規案件
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              案件がありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商談名</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>契約数</TableHead>
                  <TableHead>担当者</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(statusColors[deal.status])}
                      >
                        {DEAL_STATUS_LABELS[deal.status] || deal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {deal.contracts?.length || 0}件
                    </TableCell>
                    <TableCell>
                      {deal.sales_user?.name || deal.assigned_user?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(deal.created_at), "yyyy/MM/dd", {
                        locale: ja,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/deals/${deal.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
