"use client";

import { Deal } from "@/types";
import { DEAL_STATUS_LABELS } from "@/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DealListProps {
  deals: Deal[];
}

const statusColors: Record<string, string> = {
  active: "bg-blue-100 text-blue-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

export function DealList({ deals }: DealListProps) {
  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-500">商談がまだ登録されていません</p>
      </div>
    );
  }

  const formatAmount = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>商談名</TableHead>
            <TableHead>顧客</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>契約数</TableHead>
            <TableHead>合計金額</TableHead>
            <TableHead>担当者</TableHead>
            <TableHead>作成日</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow key={deal.id}>
              <TableCell className="font-medium">{deal.title}</TableCell>
              <TableCell>{deal.customer?.company_name || "-"}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(statusColors[deal.status])}
                >
                  {DEAL_STATUS_LABELS[deal.status] || deal.status}
                </Badge>
              </TableCell>
              <TableCell>{deal.contracts?.length || 0}件</TableCell>
              <TableCell>{formatAmount(deal.total_amount)}</TableCell>
              <TableCell>{deal.assigned_user?.name || "-"}</TableCell>
              <TableCell>
                {format(new Date(deal.created_at), "yyyy/MM/dd", {
                  locale: ja,
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/deals/${deal.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/deals/${deal.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
