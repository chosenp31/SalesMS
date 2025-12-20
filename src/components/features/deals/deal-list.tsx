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
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn, formatDealId } from "@/lib/utils";

interface DealListProps {
  deals: Deal[];
}

const phaseColors: Record<string, string> = {
  商談中: "bg-blue-100 text-blue-800",
  審査中: "bg-yellow-100 text-yellow-800",
  工事中: "bg-purple-100 text-purple-800",
  入金中: "bg-green-100 text-green-800",
  失注: "bg-red-100 text-red-800",
  クローズ: "bg-gray-100 text-gray-800",
};

type SortField = "deal_id" | "customer" | "product" | "phase_breakdown" | "contracts" | "assigned_user" | "created_at";
type SortDirection = "asc" | "desc";

// 契約のフェーズ内訳を取得するヘルパー
const getPhaseBreakdown = (contracts?: { id: string; title: string; phase?: string; status?: string; product_category?: string | null }[]): string => {
  if (!contracts || contracts.length === 0) return "-";

  // フェーズごとにカウント
  const phaseCounts: Record<string, number> = {};
  contracts.forEach(contract => {
    const phase = contract.phase || "不明";
    phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
  });

  // "1件:審査中, 1件:工事中" 形式で出力
  return Object.entries(phaseCounts)
    .map(([phase, count]) => `${count}件:${phase}`)
    .join(", ");
};

// 商材一覧を取得するヘルパー
const getProductCategories = (contracts?: { product_category?: string | null }[]): string[] => {
  if (!contracts || contracts.length === 0) return [];
  const categories = contracts.map(c => c.product_category).filter((p): p is string => !!p);
  return Array.from(new Set(categories));
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
        case "product":
          const aProducts = getProductCategories(a.contracts).join(",");
          const bProducts = getProductCategories(b.contracts).join(",");
          comparison = aProducts.localeCompare(bProducts);
          break;
        case "contracts":
          comparison = (a.contracts?.length || 0) - (b.contracts?.length || 0);
          break;
        case "phase_breakdown":
          comparison = getPhaseBreakdown(a.contracts).localeCompare(getPhaseBreakdown(b.contracts));
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
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="案件ID、顧客名、主担当者で検索..."
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
              <TableHead>
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
                  column="product"
                  label="商材"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("product")}
                  sortable
                  filterable={false}
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
                  column="phase_breakdown"
                  label="契約数内訳"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("phase_breakdown")}
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
              const products = getProductCategories(deal.contracts);
              const dealDisplayId = formatDealId(deal.customer?.customer_number, deal.deal_number);
              const phaseBreakdown = getPhaseBreakdown(deal.contracts);
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
                  {products.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {products.slice(0, 2).map((product, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {product}
                        </Badge>
                      ))}
                      {products.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{products.length - 2}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
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
                  {phaseBreakdown !== "-" ? (
                    <div className="flex flex-wrap gap-1">
                      {phaseBreakdown.split(", ").map((item, idx) => {
                        const [, phase] = item.split(":");
                        return (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={cn("text-xs border", phaseColors[phase] || "bg-gray-100")}
                          >
                            {item}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
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
