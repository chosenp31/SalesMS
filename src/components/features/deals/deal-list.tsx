"use client";

import { useState, useMemo } from "react";
import { Deal } from "@/types";
import {
  CONTRACT_PHASE_LABELS,
  CONTRACT_STATUS_LABELS,
} from "@/constants";
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
import { Input } from "@/components/ui/input";
import {
  ColumnFilterHeader,
  ColumnFilter,
  generateFilterOptions,
} from "@/components/ui/column-filter-header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, FileText, Search, X } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DealListProps {
  deals: Deal[];
}

const phaseColors: Record<string, string> = {
  商談中: "bg-blue-100 text-blue-800 border-blue-200",
  審査中: "bg-yellow-100 text-yellow-800 border-yellow-200",
  工事中: "bg-purple-100 text-purple-800 border-purple-200",
  入金中: "bg-green-100 text-green-800 border-green-200",
  失注: "bg-red-100 text-red-800 border-red-200",
  クローズ: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusColors: Record<string, string> = {
  // 商談中
  日程調整中: "bg-blue-50 text-blue-700 border-blue-200",
  MTG実施待ち: "bg-blue-50 text-blue-700 border-blue-200",
  見積提出: "bg-blue-50 text-blue-700 border-blue-200",
  受注確定: "bg-blue-100 text-blue-800 border-blue-200",
  // 審査中
  書類準備中: "bg-yellow-50 text-yellow-700 border-yellow-200",
  審査結果待ち: "bg-yellow-50 text-yellow-700 border-yellow-200",
  可決: "bg-green-100 text-green-800 border-green-200",
  否決: "bg-red-100 text-red-800 border-red-200",
  // 工事中
  下見日程調整中: "bg-purple-50 text-purple-700 border-purple-200",
  下見実施待ち: "bg-purple-50 text-purple-700 border-purple-200",
  工事日程調整中: "bg-purple-50 text-purple-700 border-purple-200",
  工事実施待ち: "bg-purple-50 text-purple-700 border-purple-200",
  // 入金中
  入金待ち: "bg-green-50 text-green-700 border-green-200",
  入金済: "bg-green-100 text-green-800 border-green-200",
  // 終了
  失注: "bg-red-100 text-red-800 border-red-200",
  クローズ: "bg-gray-100 text-gray-800 border-gray-200",
};

type SortField = "title" | "customer" | "phase" | "status" | "contracts" | "total_amount" | "created_at" | "assigned_user";
type SortDirection = "asc" | "desc";

// 契約からフェーズとステータスを取得するヘルパー
const getPrimaryContractInfo = (contracts?: { id: string; title: string; phase?: string; status?: string }[]) => {
  if (!contracts || contracts.length === 0) return { phase: null, status: null };
  const primary = contracts[0];
  return { phase: primary.phase || null, status: primary.status || null };
};

export function DealList({ deals }: DealListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({});

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle column filter change
  const handleColumnFilterChange = (column: string, filter: ColumnFilter | null) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev };
      if (filter) {
        newFilters[column] = filter;
      } else {
        delete newFilters[column];
      }
      return newFilters;
    });
  };

  // Clear all filters
  const handleClearAll = () => {
    setSearchValue("");
    setColumnFilters({});
  };

  // Generate filter options from data
  const phaseOptions = useMemo(() => {
    const phases = deals
      .map((d) => getPrimaryContractInfo(d.contracts).phase)
      .filter((p): p is string => p !== null);
    return generateFilterOptions(
      phases.map((p) => ({ phase: p })),
      (item) => item.phase,
      (item) => CONTRACT_PHASE_LABELS[item.phase as keyof typeof CONTRACT_PHASE_LABELS] || item.phase
    );
  }, [deals]);

  const statusOptions = useMemo(() => {
    const statuses = deals
      .map((d) => getPrimaryContractInfo(d.contracts).status)
      .filter((s): s is string => s !== null);
    return generateFilterOptions(
      statuses.map((s) => ({ status: s })),
      (item) => item.status,
      (item) => CONTRACT_STATUS_LABELS[item.status] || item.status
    );
  }, [deals]);

  const customerOptions = useMemo(() => {
    return generateFilterOptions(
      deals.filter((d) => d.customer?.company_name),
      (deal) => deal.customer?.company_name || "",
      (deal) => deal.customer?.company_name || ""
    );
  }, [deals]);

  const assignedUserOptions = useMemo(() => {
    return generateFilterOptions(
      deals.filter((d) => d.assigned_user?.name),
      (deal) => deal.assigned_user?.id || "",
      (deal) => deal.assigned_user?.name || ""
    );
  }, [deals]);

  // Filter and sort deals
  const filteredDeals = useMemo(() => {
    let result = deals;

    // Apply global search
    if (searchValue) {
      const lowerSearch = searchValue.toLowerCase();
      result = result.filter(
        (deal) =>
          deal.title.toLowerCase().includes(lowerSearch) ||
          deal.customer?.company_name?.toLowerCase().includes(lowerSearch) ||
          deal.assigned_user?.name?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply column filters
    for (const [column, filter] of Object.entries(columnFilters)) {
      if (filter.searchText) {
        const lowerSearch = filter.searchText.toLowerCase();
        result = result.filter((deal) => {
          switch (column) {
            case "title":
              return deal.title.toLowerCase().includes(lowerSearch);
            case "customer":
              return deal.customer?.company_name?.toLowerCase().includes(lowerSearch);
            case "assigned_user":
              return deal.assigned_user?.name?.toLowerCase().includes(lowerSearch);
            default:
              return true;
          }
        });
      }
      if (filter.values && filter.values.length > 0) {
        result = result.filter((deal) => {
          const contractInfo = getPrimaryContractInfo(deal.contracts);
          switch (column) {
            case "phase":
              return filter.values.includes(contractInfo.phase || "");
            case "status":
              return filter.values.includes(contractInfo.status || "");
            case "customer":
              return filter.values.includes(deal.customer?.company_name || "");
            case "assigned_user":
              return filter.values.includes(deal.assigned_user?.id || "");
            default:
              return true;
          }
        });
      }
    }

    // Apply sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      const aContract = getPrimaryContractInfo(a.contracts);
      const bContract = getPrimaryContractInfo(b.contracts);
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "customer":
          comparison = (a.customer?.company_name || "").localeCompare(
            b.customer?.company_name || ""
          );
          break;
        case "phase":
          comparison = (aContract.phase || "").localeCompare(bContract.phase || "");
          break;
        case "status":
          comparison = (aContract.status || "").localeCompare(bContract.status || "");
          break;
        case "contracts":
          comparison = (a.contracts?.length || 0) - (b.contracts?.length || 0);
          break;
        case "total_amount":
          comparison = (a.total_amount || 0) - (b.total_amount || 0);
          break;
        case "assigned_user":
          comparison = (a.assigned_user?.name || "").localeCompare(
            b.assigned_user?.name || ""
          );
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [deals, searchValue, columnFilters, sortField, sortDirection]);

  const formatAmount = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const hasActiveFilters = searchValue.length > 0 || Object.keys(columnFilters).length > 0;

  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-500">商談がまだ登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="案件名、顧客名、担当者で検索..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-10 h-10 bg-white"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <X className="h-4 w-4 mr-1" />
            フィルタをクリア
          </Button>
        )}

        <div className="text-sm text-gray-500">
          {filteredDeals.length !== deals.length ? (
            <span>{filteredDeals.length} / {deals.length} 件</span>
          ) : (
            <span>{deals.length} 件</span>
          )}
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[200px]">
                <ColumnFilterHeader
                  column="title"
                  label="案件名"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("title")}
                  searchable
                  activeFilter={columnFilters["title"]}
                  onFilterChange={(f) => handleColumnFilterChange("title", f)}
                />
              </TableHead>
              <TableHead>
                <ColumnFilterHeader
                  column="customer"
                  label="顧客"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("customer")}
                  filterable
                  filterOptions={customerOptions}
                  activeFilter={columnFilters["customer"]}
                  onFilterChange={(f) => handleColumnFilterChange("customer", f)}
                />
              </TableHead>
              <TableHead>
                <ColumnFilterHeader
                  column="phase"
                  label="ステータス大分類"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("phase")}
                  filterable
                  filterOptions={phaseOptions}
                  activeFilter={columnFilters["phase"]}
                  onFilterChange={(f) => handleColumnFilterChange("phase", f)}
                />
              </TableHead>
              <TableHead>
                <ColumnFilterHeader
                  column="status"
                  label="ステータス小分類"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("status")}
                  filterable
                  filterOptions={statusOptions}
                  activeFilter={columnFilters["status"]}
                  onFilterChange={(f) => handleColumnFilterChange("status", f)}
                />
              </TableHead>
              <TableHead>
                <ColumnFilterHeader
                  column="contracts"
                  label="契約"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("contracts")}
                  sortable
                  filterable={false}
                />
              </TableHead>
              <TableHead>
                <ColumnFilterHeader
                  column="total_amount"
                  label="合計金額"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("total_amount")}
                  sortable
                  filterable={false}
                  align="right"
                />
              </TableHead>
              <TableHead>
                <ColumnFilterHeader
                  column="assigned_user"
                  label="担当者"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("assigned_user")}
                  filterable
                  filterOptions={assignedUserOptions}
                  activeFilter={columnFilters["assigned_user"]}
                  onFilterChange={(f) => handleColumnFilterChange("assigned_user", f)}
                />
              </TableHead>
              <TableHead>
                <ColumnFilterHeader
                  column="created_at"
                  label="作成日"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("created_at")}
                  sortable
                  filterable={false}
                />
              </TableHead>
              <TableHead className="text-right w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeals.map((deal) => {
              const contractInfo = getPrimaryContractInfo(deal.contracts);
              return (
              <TableRow
                key={deal.id}
                className="cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => router.push(`/deals/${deal.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {deal.title}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-gray-700">
                    {deal.customer?.company_name || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  {contractInfo.phase ? (
                    <Badge
                      variant="outline"
                      className={cn("border", phaseColors[contractInfo.phase])}
                    >
                      {CONTRACT_PHASE_LABELS[contractInfo.phase as keyof typeof CONTRACT_PHASE_LABELS]}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {contractInfo.status ? (
                    <Badge
                      variant="outline"
                      className={cn("border", statusColors[contractInfo.status])}
                    >
                      {CONTRACT_STATUS_LABELS[contractInfo.status]}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {deal.contracts && deal.contracts.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <Badge variant="secondary" className="font-normal">
                        {deal.contracts.length}件
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatAmount(deal.total_amount)}
                </TableCell>
                <TableCell className="text-gray-600">
                  {deal.assigned_user?.name || "-"}
                </TableCell>
                <TableCell className="text-gray-500">
                  {format(new Date(deal.created_at), "yyyy/MM/dd", {
                    locale: ja,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex justify-end space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
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
              );
            })}
          </TableBody>
        </Table>
        {filteredDeals.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            条件に一致する案件がありません
          </div>
        )}
      </div>
    </div>
  );
}
