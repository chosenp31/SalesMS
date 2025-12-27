"use client";

import { useState, useMemo } from "react";
import { TaskStatus } from "@/types";
import {
  CONTRACT_STAGE_LABELS,
  CONTRACT_STEP_LABELS,
  CONTRACT_TYPE_LABELS,
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
import { Eye, Pencil, FileText } from "lucide-react";
import { cn, formatContractId, formatDealId } from "@/lib/utils";
import { stageColors, stepColors } from "@/constants/colors";

interface ContractTask {
  id: string;
  status: TaskStatus;
}

// データベースから取得した契約データの型（新旧両方の値に対応）
interface ContractWithRelations {
  id: string;
  deal_id: string;
  title: string;
  contract_type: string;
  product_category: string | null;
  lease_company: string | null;
  stage: string;
  step: string;
  monthly_amount: number | null;
  total_amount: number | null;
  contract_months: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  contract_number?: number;
  created_at: string;
  updated_at: string;
  deal?: {
    id: string;
    title: string;
    deal_number?: number;
    customer?: {
      id: string;
      company_name: string;
      customer_number?: number;
    };
    sales_user?: {
      id: string;
      name: string;
    };
    appointer_user?: {
      id: string;
      name: string;
    };
  };
  tasks?: ContractTask[];
}

interface ContractListProps {
  contracts: ContractWithRelations[];
  filterDealId?: string;
}

type SortField = "contract_id" | "contract_type" | "product_category" | "customer" | "stage" | "step" | "deal" | "incomplete_tasks";
type SortDirection = "asc" | "desc";

// タスク数を取得するヘルパー
const getTaskCounts = (tasks?: ContractTask[]) => {
  if (!tasks || tasks.length === 0) return { total: 0, incomplete: 0 };
  const total = tasks.length;
  const incomplete = tasks.filter(t => t.status !== "完了").length;
  return { total, incomplete };
};

export function ContractList({ contracts, filterDealId }: ContractListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortField, setSortField] = useState<SortField>("contract_id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      key: "stage",
      label: "ステージ",
      type: "select",
      quickFilter: true,
      options: Object.entries(CONTRACT_STAGE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      key: "contract_type",
      label: "種別",
      type: "select",
      quickFilter: true,
      options: Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      key: "step",
      label: "ステップ",
      type: "select",
      options: Object.entries(CONTRACT_STEP_LABELS).map(([value, label]) => ({
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

  // Clear filter and go back to all contracts
  const handleClearFilter = () => {
    router.push("/contracts");
  };

  // Handle task count click - navigate to tasks page with contract filter
  const handleTaskCountClick = (e: React.MouseEvent, contractId: string, showIncompleteOnly: boolean) => {
    e.stopPropagation();
    const params = new URLSearchParams();
    params.set("contract_id", contractId);
    if (showIncompleteOnly) {
      params.set("status", "incomplete");
    }
    router.push(`/tasks?${params.toString()}`);
  };

  // Filter and sort contracts
  const filteredContracts = useMemo(() => {
    let result = contracts;

    // Apply search
    if (searchValue) {
      const lowerSearch = searchValue.toLowerCase();
      result = result.filter(
        (contract) =>
          contract.title.toLowerCase().includes(lowerSearch) ||
          contract.deal?.title?.toLowerCase().includes(lowerSearch) ||
          contract.deal?.customer?.company_name?.toLowerCase().includes(lowerSearch) ||
          contract.product_category?.toLowerCase().includes(lowerSearch) ||
          formatContractId(
            contract.deal?.customer?.customer_number,
            contract.deal?.deal_number,
            contract.contract_number
          ).toLowerCase().includes(lowerSearch)
      );
    }

    // Apply filters
    for (const filter of activeFilters) {
      if (filter.key === "stage") {
        result = result.filter((contract) => contract.stage === filter.value);
      } else if (filter.key === "step") {
        result = result.filter((contract) => contract.step === filter.value);
      } else if (filter.key === "contract_type") {
        result = result.filter((contract) => contract.contract_type === filter.value);
      }
    }

    // Apply sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "contract_id":
          const aId = formatContractId(
            a.deal?.customer?.customer_number,
            a.deal?.deal_number,
            a.contract_number
          );
          const bId = formatContractId(
            b.deal?.customer?.customer_number,
            b.deal?.deal_number,
            b.contract_number
          );
          comparison = aId.localeCompare(bId);
          break;
        case "contract_type":
          comparison = a.contract_type.localeCompare(b.contract_type);
          break;
        case "product_category":
          comparison = (a.product_category || "").localeCompare(b.product_category || "");
          break;
        case "customer":
          comparison = (a.deal?.customer?.company_name || "").localeCompare(b.deal?.customer?.company_name || "");
          break;
        case "stage":
          comparison = a.stage.localeCompare(b.stage);
          break;
        case "step":
          comparison = a.step.localeCompare(b.step);
          break;
        case "deal":
          const aDealId = formatDealId(a.deal?.customer?.customer_number, a.deal?.deal_number);
          const bDealId = formatDealId(b.deal?.customer?.customer_number, b.deal?.deal_number);
          comparison = aDealId.localeCompare(bDealId);
          break;
        case "incomplete_tasks":
          comparison = getTaskCounts(a.tasks).incomplete - getTaskCounts(b.tasks).incomplete;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [contracts, searchValue, activeFilters, sortField, sortDirection]);

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
        "flex items-center gap-1 font-medium transition-colors group",
        sortField === field ? "text-primary" : "text-gray-600 hover:text-gray-900",
        className
      )}
      onClick={() => handleSort(field)}
    >
      {children}
      <span className={cn(
        "transition-opacity text-xs",
        sortField === field ? "opacity-100" : "opacity-0 group-hover:opacity-50"
      )}>
        {sortField === field && sortDirection === "asc" ? "↑" : "↓"}
      </span>
    </button>
  );

  if (contracts.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 mb-2">契約がまだ登録されていません</p>
        <p className="text-sm text-gray-400 mb-4">
          案件詳細画面から契約を追加できます
        </p>
        {filterDealId ? (
          <Button variant="outline" onClick={handleClearFilter}>
            全ての契約を表示
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href="/deals">
              案件一覧を見る
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* フィルター表示 */}
      {filterDealId && (
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            <span>案件でフィルタ中</span>
            <button onClick={handleClearFilter} className="ml-1 hover:text-red-500">
              <FileText className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* 検索バー & フィルタ */}
      <SearchFilterBar
        placeholder="契約ID、顧客名、商材、案件名で検索..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onFilterRemove={handleFilterRemove}
        onClearAll={handleClearAll}
        resultCount={filteredContracts.length}
        totalCount={contracts.length}
      />

      {/* テーブル */}
      <div className="bg-white rounded-lg border overflow-x-auto -mx-4 md:mx-0">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[100px]">
                <SortHeader field="contract_id">契約ID</SortHeader>
              </TableHead>
              <TableHead className="w-[60px]">
                <SortHeader field="contract_type">種別</SortHeader>
              </TableHead>
              <TableHead className="w-[100px]">
                <SortHeader field="product_category">商材</SortHeader>
              </TableHead>
              <TableHead className="w-[160px]">
                <SortHeader field="customer">顧客名</SortHeader>
              </TableHead>
              <TableHead className="w-[90px]">
                <SortHeader field="stage">ステージ</SortHeader>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortHeader field="step">ステップ</SortHeader>
              </TableHead>
              <TableHead className="w-[80px]">
                <SortHeader field="deal">案件ID</SortHeader>
              </TableHead>
              <TableHead className="w-[60px]">
                <SortHeader field="incomplete_tasks">未完了</SortHeader>
              </TableHead>
              <TableHead className="text-right w-[60px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.map((contract) => {
              const contractDisplayId = formatContractId(
                contract.deal?.customer?.customer_number,
                contract.deal?.deal_number,
                contract.contract_number
              );
              const dealDisplayId = formatDealId(
                contract.deal?.customer?.customer_number,
                contract.deal?.deal_number
              );
              const taskCounts = getTaskCounts(contract.tasks);
              return (
                <TableRow
                  key={contract.id}
                  className="cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => router.push(`/contracts/${contract.id}`)}
                >
                  <TableCell className="py-2 font-mono text-sm font-medium text-blue-600">
                    {contractDisplayId}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {CONTRACT_TYPE_LABELS[contract.contract_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 text-sm text-gray-600 truncate">
                    {contract.product_category || "-"}
                  </TableCell>
                  <TableCell className="py-2">
                    {contract.deal?.customer ? (
                      <Link
                        href={`/customers/${contract.deal.customer.id}`}
                        className="text-sm text-primary hover:underline truncate block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contract.deal.customer.company_name}
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge
                      className={cn("border text-xs px-1.5 py-0", stageColors[contract.stage])}
                    >
                      {CONTRACT_STAGE_LABELS[contract.stage]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge
                      variant="outline"
                      className={cn("border text-xs px-1.5 py-0", stepColors[contract.step])}
                    >
                      {CONTRACT_STEP_LABELS[contract.step]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    {contract.deal ? (
                      <Link
                        href={`/deals/${contract.deal.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {dealDisplayId}
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    {taskCounts.incomplete > 0 ? (
                      <button
                        className="flex items-center hover:bg-orange-100 rounded px-1.5 py-0.5 transition-colors"
                        onClick={(e) => handleTaskCountClick(e, contract.id, true)}
                      >
                        <Badge variant="secondary" className="text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 px-1.5 py-0">
                          {taskCounts.incomplete}
                        </Badge>
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <div
                      className="flex justify-end space-x-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                        <Link href={`/contracts/${contract.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                        <Link href={`/contracts/${contract.id}/edit`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredContracts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            条件に一致する契約がありません
          </div>
        )}
      </div>
    </div>
  );
}
