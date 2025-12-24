"use client";

import { useState, useMemo } from "react";
import { Deal } from "@/types";
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
import { Eye, Pencil, FileText, Search, X, ExternalLink } from "lucide-react";
import { cn, formatDealId } from "@/lib/utils";

interface DealListProps {
  deals: Deal[];
}

const statusColors: Record<string, string> = {
  // 商談中
  商談待ち: "bg-blue-100 text-blue-800 border-blue-200",
  商談日程調整中: "bg-blue-100 text-blue-800 border-blue-200",
  // 審査・申込中
  "審査・申込対応中": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "審査・申込待ち": "bg-yellow-100 text-yellow-800 border-yellow-200",
  // 下見・工事中
  下見調整中: "bg-purple-100 text-purple-800 border-purple-200",
  下見実施待ち: "bg-purple-100 text-purple-800 border-purple-200",
  工事日程調整中: "bg-purple-100 text-purple-800 border-purple-200",
  工事実施待ち: "bg-purple-100 text-purple-800 border-purple-200",
  // 契約中
  検収確認中: "bg-indigo-100 text-indigo-800 border-indigo-200",
  契約書提出対応中: "bg-indigo-100 text-indigo-800 border-indigo-200",
  契約書確認待ち: "bg-indigo-100 text-indigo-800 border-indigo-200",
  // 入金中
  入金待ち: "bg-green-100 text-green-800 border-green-200",
  入金済: "bg-green-100 text-green-800 border-green-200",
  // 請求中
  初回請求確認待ち: "bg-teal-100 text-teal-800 border-teal-200",
  請求処理対応中: "bg-teal-100 text-teal-800 border-teal-200",
  // 完了
  クローズ: "bg-gray-100 text-gray-800 border-gray-200",
  // 否決
  対応検討中: "bg-red-100 text-red-800 border-red-200",
  失注: "bg-red-100 text-red-800 border-red-200",
  // フェーズ（後方互換性）
  商談中: "bg-blue-100 text-blue-800 border-blue-200",
  "審査・申込中": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "下見・工事中": "bg-purple-100 text-purple-800 border-purple-200",
  契約中: "bg-indigo-100 text-indigo-800 border-indigo-200",
  入金中: "bg-green-100 text-green-800 border-green-200",
  請求中: "bg-teal-100 text-teal-800 border-teal-200",
  完了: "bg-gray-100 text-gray-800 border-gray-200",
  否決: "bg-red-100 text-red-800 border-red-200",
};

type SortField = "deal_id" | "customer" | "contract_status" | "contracts" | "assigned_user";
type SortDirection = "asc" | "desc";

// 契約種類ラベル
const CONTRACT_TYPE_LABELS: Record<string, string> = {
  property: "物件",
  line: "回線",
  maintenance: "保守",
  lease: "リース",
  rental: "レンタル",
  installment: "割賦",
};

// 契約種類：ステータス一覧を取得するヘルパー
const getContractStatusList = (contracts?: { id: string; title: string; contract_type?: string; phase?: string; status?: string; product_category?: string | null }[]): { type: string; status: string }[] => {
  if (!contracts || contracts.length === 0) return [];

  return contracts.map(contract => ({
    type: CONTRACT_TYPE_LABELS[contract.contract_type || ""] || contract.contract_type || "不明",
    status: contract.status || contract.phase || "不明",
  }));
};

export function DealList({ deals }: DealListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState<SortField>("deal_id");
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

  // Handle contract count click - navigate to contracts page with deal filter
  const handleContractCountClick = (e: React.MouseEvent, dealId: string) => {
    e.stopPropagation();
    router.push(`/contracts?deal_id=${dealId}`);
  };

  // Generate filter options from data
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
          deal.assigned_user?.name?.toLowerCase().includes(lowerSearch) ||
          formatDealId(deal.customer?.customer_number, deal.deal_number).toLowerCase().includes(lowerSearch)
      );
    }

    // Apply column filters
    for (const [column, filter] of Object.entries(columnFilters)) {
      if (filter.searchText) {
        const lowerSearch = filter.searchText.toLowerCase();
        result = result.filter((deal) => {
          switch (column) {
            case "deal_id":
              return formatDealId(deal.customer?.customer_number, deal.deal_number).toLowerCase().includes(lowerSearch);
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
          switch (column) {
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
      switch (sortField) {
        case "deal_id":
          const aId = formatDealId(a.customer?.customer_number, a.deal_number);
          const bId = formatDealId(b.customer?.customer_number, b.deal_number);
          comparison = aId.localeCompare(bId);
          break;
        case "customer":
          comparison = (a.customer?.company_name || "").localeCompare(
            b.customer?.company_name || ""
          );
          break;
        case "contracts":
          comparison = (a.contracts?.length || 0) - (b.contracts?.length || 0);
          break;
        case "contract_status":
          const aStatus = getContractStatusList(a.contracts).map(c => `${c.type}:${c.status}`).join(",");
          const bStatus = getContractStatusList(b.contracts).map(c => `${c.type}:${c.status}`).join(",");
          comparison = aStatus.localeCompare(bStatus);
          break;
        case "assigned_user":
          comparison = (a.assigned_user?.name || "").localeCompare(
            b.assigned_user?.name || ""
          );
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [deals, searchValue, columnFilters, sortField, sortDirection]);

  const hasActiveFilters = searchValue.length > 0 || Object.keys(columnFilters).length > 0;

  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-500">案件がまだ登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 検索バー */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 md:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="案件ID、顧客名、担当者で検索..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-10 h-10 bg-white w-full"
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

        <div className="flex items-center justify-between sm:justify-start gap-2">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              <X className="h-4 w-4 mr-1" />
              クリア
            </Button>
          )}

          <div className="text-sm text-gray-500">
            {filteredDeals.length !== deals.length ? (
              <span>{filteredDeals.length}/{deals.length}件</span>
            ) : (
              <span>{deals.length}件</span>
            )}
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border overflow-x-auto -mx-4 md:mx-0">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[120px]">
                <ColumnFilterHeader
                  column="deal_id"
                  label="案件ID"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("deal_id")}
                  searchable
                  activeFilter={columnFilters["deal_id"]}
                  onFilterChange={(f) => handleColumnFilterChange("deal_id", f)}
                />
              </TableHead>
              <TableHead className="w-[200px] min-w-[200px]">
                <ColumnFilterHeader
                  column="customer"
                  label="顧客名"
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
                  column="contracts"
                  label="契約数"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("contracts")}
                  sortable
                  filterable={false}
                />
              </TableHead>
              <TableHead className="w-[200px]">
                <ColumnFilterHeader
                  column="contract_status"
                  label="契約状況"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("contract_status")}
                  sortable
                  filterable={false}
                />
              </TableHead>
              <TableHead>
                <ColumnFilterHeader
                  column="assigned_user"
                  label="主担当者"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("assigned_user")}
                  filterable
                  filterOptions={assignedUserOptions}
                  activeFilter={columnFilters["assigned_user"]}
                  onFilterChange={(f) => handleColumnFilterChange("assigned_user", f)}
                />
              </TableHead>
              <TableHead className="text-right w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeals.map((deal) => {
              const dealDisplayId = formatDealId(deal.customer?.customer_number, deal.deal_number);
              const contractStatusList = getContractStatusList(deal.contracts);
              return (
              <TableRow
                key={deal.id}
                className="cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => router.push(`/deals/${deal.id}`)}
              >
                <TableCell className="font-mono text-sm font-medium text-blue-600">
                  {dealDisplayId}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/customers/${deal.customer_id}`}
                    className="flex items-center gap-1 text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {deal.customer?.company_name || "-"}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </TableCell>
                <TableCell>
                  {deal.contracts && deal.contracts.length > 0 ? (
                    <button
                      className="flex items-center gap-1.5 hover:bg-blue-100 rounded px-2 py-1 transition-colors"
                      onClick={(e) => handleContractCountClick(e, deal.id)}
                    >
                      <FileText className="h-4 w-4 text-blue-500" />
                      <Badge variant="secondary" className="font-medium bg-blue-100 text-blue-700 hover:bg-blue-200">
                        {deal.contracts.length}件
                      </Badge>
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {contractStatusList.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {contractStatusList.map((item, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={cn("text-xs border", statusColors[item.status] || "bg-gray-100")}
                        >
                          {item.type}：{item.status}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-600">
                  {deal.assigned_user?.name || "-"}
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
