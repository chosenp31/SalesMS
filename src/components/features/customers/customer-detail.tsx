"use client";

import { Customer, Deal } from "@/types";
import { BUSINESS_TYPE_LABELS, DEAL_STATUS_LABELS, CONTRACT_TYPE_LABELS } from "@/constants";
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
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface CustomerDetailProps {
  customer: Customer;
  deals: Deal[];
}

export function CustomerDetail({ customer, deals }: CustomerDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
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
                  <TableHead>案件名</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>契約種別</TableHead>
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
                      <Badge>
                        {DEAL_STATUS_LABELS[deal.status] || deal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {CONTRACT_TYPE_LABELS[deal.contract_type]}
                    </TableCell>
                    <TableCell>
                      {deal.assigned_user?.name || "-"}
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
