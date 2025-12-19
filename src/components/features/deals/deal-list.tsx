"use client";

import { useState, useMemo } from "react";
import { Deal } from "@/types";
import {
  DEAL_STATUS_LABELS,
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
import {
  SearchFilterBar,
  FilterOption,
  ActiveFilter,
} from "@/components/ui/search-filter-bar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, ChevronUp, ChevronDown, FileText } from "lucide-react";
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

type SortField = "title" | "customer" | "phase" | "status" | "contracts" | "total_amount" | "created_at";
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
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      key: "status",
      label: "ステータス",
      type: "select",
      options: Object.entries(DEAL_STATUS_LABELS).map(([value, label]) => ({
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

  // Filter and sort deals
  const filteredDeals = useMemo(() => {
    let result = deals;

    // Apply search
    if (searchValue) {
      const lowerSearch = searchValue.toLowerCase();
      result = result.filter(
        (deal) =>
          deal.title.toLowerCase().includes(lowerSearch) ||
          deal.customer?.company_name?.toLowerCase().includes(lowerSearch) ||
          deal.assigned_user?.name?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply filters
    for (const filter of activeFilters) {
      if (filter.key === "status") {
        result = result.filter((deal) => deal.status === filter.value);
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
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [deals, searchValue, activeFilters, sortField, sortDirection]);

  const formatAmount = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
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
      {sortField === field && (
        sortDirection === "asc" ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      )}
    </button>
  );

  if (deals.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-500">商談がまだ登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchFilterBar
        placeholder="商談名、顧客名、担当者で検索..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onFilterRemove={handleFilterRemove}
        onClearAll={handleClearAll}
        resultCount={filteredDeals.length}
      />

      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[200px]">
                <SortHeader field="title">案件名</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="customer">顧客</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="phase">ステータス大分類</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="status">ステータス小分類</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="contracts">契約</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="total_amount" className="justify-end">
                  合計金額
                </SortHeader>
              </TableHead>
              <TableHead>担当者</TableHead>
              <TableHead>
                <SortHeader field="created_at">作成日</SortHeader>
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
            条件に一致する商談がありません
          </div>
        )}
      </div>
    </div>
  );
}
