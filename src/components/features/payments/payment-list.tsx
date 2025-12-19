"use client";

import { useState, useMemo } from "react";
import { Payment, ContractOption } from "@/types";
import { PAYMENT_STATUS_LABELS, PAYMENT_TYPE_LABELS } from "@/constants";
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
import {
  SearchFilterBar,
  FilterOption,
  ActiveFilter,
} from "@/components/ui/search-filter-bar";
import { format, isPast, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  Check,
  ChevronUp,
  ChevronDown,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { PaymentDialog } from "./payment-dialog";
import Link from "next/link";

interface PaymentListProps {
  payments: Payment[];
  contracts: ContractOption[];
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-green-100 text-green-800 border-green-200",
};

type SortField =
  | "contract"
  | "customer"
  | "payment_type"
  | "status"
  | "expected_amount"
  | "actual_amount"
  | "expected_date"
  | "actual_date";
type SortDirection = "asc" | "desc";

export function PaymentList({ payments, contracts }: PaymentListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortField, setSortField] = useState<SortField>("expected_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      key: "status",
      label: "ステータス",
      type: "select",
      options: Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      key: "payment_type",
      label: "種別",
      type: "select",
      options: Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
  ];

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    if (value === "__all__" || value === "") {
      setActiveFilters((prev) => prev.filter((f) => f.key !== key));
    } else {
      const filterOption = filterOptions.find((f) => f.key === key);
      const option = filterOption?.options?.find((o) => o.value === value);
      setActiveFilters((prev) => {
        const existing = prev.findIndex((f) => f.key === key);
        const newFilter = {
          key,
          value,
          label: filterOption?.label || key,
          displayValue: option?.label || value,
        };
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newFilter;
          return updated;
        }
        return [...prev, newFilter];
      });
    }
  };

  const handleFilterRemove = (key: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.key !== key));
  };

  const handleClearAll = () => {
    setSearchValue("");
    setActiveFilters([]);
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleMarkAsPaid = async (payment: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDelete = async (paymentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    let result = payments;

    // Apply search
    if (searchValue) {
      const lowerSearch = searchValue.toLowerCase();
      result = result.filter(
        (payment) =>
          payment.contract?.title?.toLowerCase().includes(lowerSearch) ||
          payment.contract?.deal?.customer?.company_name
            ?.toLowerCase()
            .includes(lowerSearch) ||
          payment.notes?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply filters
    for (const filter of activeFilters) {
      if (filter.key === "status") {
        result = result.filter((payment) => payment.status === filter.value);
      } else if (filter.key === "payment_type") {
        result = result.filter(
          (payment) => payment.payment_type === filter.value
        );
      }
    }

    // Apply sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "contract":
          comparison = (a.contract?.title || "").localeCompare(
            b.contract?.title || ""
          );
          break;
        case "customer":
          comparison = (
            a.contract?.deal?.customer?.company_name || ""
          ).localeCompare(b.contract?.deal?.customer?.company_name || "");
          break;
        case "payment_type":
          comparison = a.payment_type.localeCompare(b.payment_type);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "expected_amount":
          comparison = (a.expected_amount || 0) - (b.expected_amount || 0);
          break;
        case "actual_amount":
          comparison = (a.actual_amount || 0) - (b.actual_amount || 0);
          break;
        case "expected_date":
          const aExpDate = a.expected_date
            ? new Date(a.expected_date).getTime()
            : Infinity;
          const bExpDate = b.expected_date
            ? new Date(b.expected_date).getTime()
            : Infinity;
          comparison = aExpDate - bExpDate;
          break;
        case "actual_date":
          const aActDate = a.actual_date
            ? new Date(a.actual_date).getTime()
            : Infinity;
          const bActDate = b.actual_date
            ? new Date(b.actual_date).getTime()
            : Infinity;
          comparison = aActDate - bActDate;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [payments, searchValue, activeFilters, sortField, sortDirection]);

  const getDateStyle = (date: string | null, status: string) => {
    if (!date || status === "paid") return "";
    const d = new Date(date);
    if (isPast(d) && !isToday(d)) return "text-red-600 font-medium";
    if (isToday(d)) return "text-orange-600 font-medium";
    return "";
  };

  const SortHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      className={cn(
        "flex items-center gap-1 hover:text-primary transition-colors font-medium",
        className
      )}
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field &&
        (sortDirection === "asc" ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        ))}
    </button>
  );

  // Calculate totals
  const stats = useMemo(() => {
    const totalExpected = payments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (p.expected_amount || 0), 0);
    const totalPaid = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.actual_amount || 0), 0);
    const overdue = payments.filter(
      (p) =>
        p.status === "pending" &&
        p.expected_date &&
        isPast(new Date(p.expected_date)) &&
        !isToday(new Date(p.expected_date))
    ).length;
    return { totalExpected, totalPaid, overdue };
  }, [payments]);

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">入金情報がまだ登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">入金予定</p>
          <p className="text-2xl font-bold text-yellow-600">
            {formatAmount(stats.totalExpected)}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">入金済み</p>
          <p className="text-2xl font-bold text-green-600">
            {formatAmount(stats.totalPaid)}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">合計</p>
          <p className="text-2xl font-bold">
            {formatAmount(stats.totalExpected + stats.totalPaid)}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">期限超過</p>
          <p
            className={cn(
              "text-2xl font-bold",
              stats.overdue > 0 && "text-red-600"
            )}
          >
            {stats.overdue}件
          </p>
        </div>
      </div>

      <SearchFilterBar
        placeholder="契約名、顧客名、備考で検索..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onFilterRemove={handleFilterRemove}
        onClearAll={handleClearAll}
        resultCount={filteredPayments.length}
      />

      {/* Payment List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>
                <SortHeader field="contract">契約</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="customer">顧客</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="payment_type">種別</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="status">ステータス</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="expected_amount" className="justify-end">
                  予定金額
                </SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="actual_amount" className="justify-end">
                  実績金額
                </SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="expected_date">予定日</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="actual_date">入金日</SortHeader>
              </TableHead>
              <TableHead className="text-right w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow
                key={payment.id}
                className={cn(
                  "hover:bg-blue-50 transition-colors",
                  payment.status === "paid" && "bg-gray-50/50"
                )}
              >
                <TableCell>
                  {payment.contract ? (
                    <Link
                      href={`/contracts/${payment.contract.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {payment.contract.title}
                    </Link>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {payment.contract?.deal?.customer ? (
                    <Link
                      href={`/customers/${payment.contract.deal.customer.id}`}
                      className="text-gray-700 hover:text-primary hover:underline"
                    >
                      {payment.contract.deal.customer.company_name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {PAYMENT_TYPE_LABELS[payment.payment_type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {payment.status === "pending" &&
                      payment.expected_date &&
                      isPast(new Date(payment.expected_date)) &&
                      !isToday(new Date(payment.expected_date)) && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    <Badge
                      variant="outline"
                      className={cn("border", statusColors[payment.status])}
                    >
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatAmount(payment.expected_amount)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {payment.status === "paid" ? (
                    <span className="text-green-600">
                      {formatAmount(payment.actual_amount)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
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
                  {payment.actual_date ? (
                    <span className="text-green-600">
                      {format(new Date(payment.actual_date), "yyyy/MM/dd", {
                        locale: ja,
                      })}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    {payment.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleMarkAsPaid(payment, e)}
                        title="入金済みにする"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    <PaymentDialog
                      payment={payment}
                      contracts={contracts}
                      trigger={
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(payment.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredPayments.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            条件に一致する入金情報がありません
          </div>
        )}
      </div>
    </div>
  );
}
