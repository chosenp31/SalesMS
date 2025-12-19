"use client";

import { Deal, Activity } from "@/types";
import {
  DEAL_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
} from "@/constants";
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
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ActivityList } from "../activities/activity-list";
import { ActivityForm } from "../activities/activity-form";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";

interface DealDetailProps {
  deal: Deal;
  activities: Activity[];
  currentUserId: string;
}

const statusColors: Record<string, string> = {
  active: "bg-blue-100 text-blue-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

export function DealDetail({ deal, activities, currentUserId }: DealDetailProps) {
  const formatAmount = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>商談情報</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">商談名</dt>
                  <dd className="mt-1 text-sm text-gray-900">{deal.title}</dd>
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
                    <Badge
                      variant="secondary"
                      className={cn(statusColors[deal.status])}
                    >
                      {DEAL_STATUS_LABELS[deal.status] || deal.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">合計金額</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatAmount(deal.total_amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">担当者</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {deal.assigned_user?.name || "-"}
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
              <Button size="sm" asChild>
                <Link href={`/deals/${deal.id}/contracts/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  新規契約
                </Link>
              </Button>
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
                      <TableHead>契約名</TableHead>
                      <TableHead>契約種別</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>月額</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deal.contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          {contract.title}
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
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/contracts/${contract.id}`}>
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

          {/* Activities */}
          <Card>
            <CardHeader>
              <CardTitle>活動履歴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ActivityForm dealId={deal.id} userId={currentUserId} />
              <ActivityList activities={activities} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>顧客情報</CardTitle>
            </CardHeader>
            <CardContent>
              {deal.customer ? (
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">会社名</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {deal.customer.company_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      代表者名
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {deal.customer.representative_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      電話番号
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {deal.customer.phone || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">メール</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {deal.customer.email || "-"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">顧客情報がありません</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
