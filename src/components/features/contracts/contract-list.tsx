"use client";

import { useState, useMemo } from "react";
import { Contract, TaskStatus } from "@/types";
import {
  CONTRACT_PHASE_LABELS,
  CONTRACT_STATUS_LABELS,
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
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Search, X, FileText, ExternalLink, ClipboardList } from "lucide-react";
import { cn, formatContractId, formatDealId } from "@/lib/utils";

interface ContractTask {
  id: string;
  status: TaskStatus;
}

interface ContractWithRelations extends Omit<Contract, 'deal'> {
  deal?: {
    id: string;
    title: string;
    deal_number?: number;
    customer?: {
      id: string;
      company_name: string;
      customer_number?: number;
    };
    assigned_user?: {
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

type SortField = "contract_id" | "title" | "contract_type" | "phase" | "status" | "deal" | "customer" | "all_tasks" | "incomplete_tasks" | "created_at";
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
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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
          formatContractId(
            contract.deal?.customer?.customer_number,
            contract.deal?.deal_number,
            contract.contract_number
          ).toLowerCase().includes(lowerSearch)
      );
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
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "contract_type":
          comparison = a.contract_type.localeCompare(b.contract_type);
          break;
        case "phase":
          comparison = a.phase.localeCompare(b.phase);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "deal":
          const aDealId = formatDealId(a.deal?.customer?.customer_number, a.deal?.deal_number);
          const bDealId = formatDealId(b.deal?.customer?.customer_number, b.deal?.deal_number);
          comparison = aDealId.localeCompare(bDealId);
          break;
        case "customer":
          comparison = (a.deal?.customer?.company_name || "").localeCompare(b.deal?.customer?.company_name || "");
          break;
        case "all_tasks":
          comparison = getTaskCounts(a.tasks).total - getTaskCounts(b.tasks).total;
          break;
        case "incomplete_tasks":
          comparison = getTaskCounts(a.tasks).incomplete - getTaskCounts(b.tasks).incomplete;
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [contracts, searchValue, sortField, sortDirection]);

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
        <p className="text-gray-500">契約がまだ登録されていません</p>
        {filterDealId && (
          <Button variant="outline" className="mt-4" onClick={handleClearFilter}>
            全ての契約を表示
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* フィルター表示 & 検索バー */}
      <div className="flex flex-wrap items-center gap-3">
        {filterDealId && (
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            <span>案件でフィルタ中</span>
            <button onClick={handleClearFilter} className="ml-1 hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="契約ID、契約名、案件名、顧客名で検索..."
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
        <div className="text-sm text-gray-500">
          {filteredContracts.length !== contracts.length ? (
            <span>{filteredContracts.length} / {contracts.length} 件</span>
          ) : (
            <span>{contracts.length} 件</span>
          )}
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[140px]">
                <SortHeader field="contract_id">契約ID</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="title">契約名</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="contract_type">種別</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="phase">大分類</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="status">小分類</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="deal">案件ID</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="customer">顧客名</SortHeader>
              </TableHead>
              <TableHead className="w-[80px]">
                <SortHeader field="all_tasks">全タスク</SortHeader>
              </TableHead>
              <TableHead className="w-[80px]">
                <SortHeader field="incomplete_tasks">未完了</SortHeader>
              </TableHead>
              <TableHead className="text-right w-[100px]">操作</TableHead>
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
                  <TableCell className="font-mono text-sm font-medium text-blue-600">
                    {contractDisplayId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {contract.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {CONTRACT_TYPE_LABELS[contract.contract_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("border", phaseColors[contract.phase])}
                    >
                      {CONTRACT_PHASE_LABELS[contract.phase]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("border", statusColors[contract.status])}
                    >
                      {CONTRACT_STATUS_LABELS[contract.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contract.deal ? (
                      <Link
                        href={`/deals/${contract.deal.id}`}
                        className="flex items-center gap-1 text-primary hover:underline text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-mono text-xs">{dealDisplayId}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contract.deal?.customer ? (
                      <Link
                        href={`/customers/${contract.deal.customer.id}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contract.deal.customer.company_name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {taskCounts.total > 0 ? (
                      <button
                        className="flex items-center gap-1 hover:bg-blue-100 rounded px-2 py-1 transition-colors"
                        onClick={(e) => handleTaskCountClick(e, contract.id, false)}
                      >
                        <ClipboardList className="h-4 w-4 text-blue-500" />
                        <Badge variant="secondary" className="font-medium bg-blue-100 text-blue-700 hover:bg-blue-200">
                          {taskCounts.total}件
                        </Badge>
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {taskCounts.incomplete > 0 ? (
                      <button
                        className="flex items-center gap-1 hover:bg-orange-100 rounded px-2 py-1 transition-colors"
                        onClick={(e) => handleTaskCountClick(e, contract.id, true)}
                      >
                        <Badge variant="secondary" className="font-medium bg-orange-100 text-orange-700 hover:bg-orange-200">
                          {taskCounts.incomplete}件
                        </Badge>
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/contracts/${contract.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/contracts/${contract.id}/edit`}>
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
        {filteredContracts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            条件に一致する契約がありません
          </div>
        )}
      </div>
    </div>
  );
}
