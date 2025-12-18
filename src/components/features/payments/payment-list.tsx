"use client";

import { Payment, DealOption } from "@/types";
import { PAYMENT_STATUS_LABELS } from "@/constants";
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
import { format, isPast, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check } from "lucide-react";
import { PaymentDialog } from "./payment-dialog";
import Link from "next/link";

interface PaymentListProps {
  payments: Payment[];
  deals: DealOption[];
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
};

export function PaymentList({ payments, deals }: PaymentListProps) {
  const router = useRouter();

  const handleMarkAsPaid = async (payment: Payment) => {
    const supabase = createClient();
    await supabase
      .from("payments")
      .update({
        status: "paid",
        actual_date: new Date().toISOString().split("T")[0],
        actual_amount: payment.expected_amount,
      })
      .eq("id", payment.id);
    router.refresh();
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm("この入金情報を削除しますか？")) return;

    const supabase = createClient();
    await supabase.from("payments").delete().eq("id", paymentId);
    router.refresh();
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-500">入金情報がまだ登録されていません</p>
      </div>
    );
  }

  const getDateStyle = (date: string | null, status: string) => {
    if (!date || status === "paid") return "";
    const d = new Date(date);
    if (isPast(d) && !isToday(d)) return "text-red-600 font-medium";
    if (isToday(d)) return "text-orange-600 font-medium";
    return "";
  };

  // Calculate totals
  const totalExpected = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (p.expected_amount || 0), 0);
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.actual_amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">入金予定</p>
          <p className="text-2xl font-bold text-yellow-600">
            {formatAmount(totalExpected)}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">入金済み</p>
          <p className="text-2xl font-bold text-green-600">
            {formatAmount(totalPaid)}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">合計</p>
          <p className="text-2xl font-bold">
            {formatAmount(totalExpected + totalPaid)}
          </p>
        </div>
      </div>

      {/* Payment List */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>案件</TableHead>
              <TableHead>リース会社</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="text-right">予定金額</TableHead>
              <TableHead className="text-right">実績金額</TableHead>
              <TableHead>予定日</TableHead>
              <TableHead>入金日</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  {payment.deal ? (
                    <Link
                      href={`/deals/${payment.deal.id}`}
                      className="text-primary hover:underline"
                    >
                      {payment.deal.title}
                    </Link>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{payment.lease_company || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(statusColors[payment.status])}
                  >
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(payment.expected_amount)}
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(payment.actual_amount)}
                </TableCell>
                <TableCell
                  className={getDateStyle(payment.expected_date, payment.status)}
                >
                  {payment.expected_date
                    ? format(new Date(payment.expected_date), "yyyy/MM/dd", {
                        locale: ja,
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  {payment.actual_date
                    ? format(new Date(payment.actual_date), "yyyy/MM/dd", {
                        locale: ja,
                      })
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    {payment.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsPaid(payment)}
                        title="入金済みにする"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    <PaymentDialog
                      payment={payment}
                      deals={deals}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(payment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
