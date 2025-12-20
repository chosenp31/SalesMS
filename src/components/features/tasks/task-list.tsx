"use client";

import { useState, useMemo } from "react";
import { Task, User, DealOption, TaskStatus } from "@/types";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  SearchFilterBar,
  FilterOption,
  ActiveFilter,
} from "@/components/ui/search-filter-bar";
import { format, isPast, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { cn, formatDealId, formatContractId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ChevronUp, ChevronDown, CheckSquare, AlertCircle, Building2, ExternalLink, X } from "lucide-react";
import { TaskDialog } from "./task-dialog";
import Link from "next/link";

interface TaskListProps {
  tasks: Task[];
  users: User[];
  deals: DealOption[];
  currentUserId: string;
  filterContractId?: string;
  filterStatus?: string;
}

const priorityColors = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const phaseColors: Record<string, string> = {
  商談中: "bg-blue-100 text-blue-800 border-blue-200",
  審査中: "bg-yellow-100 text-yellow-800 border-yellow-200",
  工事中: "bg-purple-100 text-purple-800 border-purple-200",
  入金中: "bg-green-100 text-green-800 border-green-200",
  失注: "bg-red-100 text-red-800 border-red-200",
  クローズ: "bg-gray-100 text-gray-800 border-gray-200",
};

const contractStatusColors: Record<string, string> = {
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

const statusColors: Record<TaskStatus, string> = {
  未着手: "bg-gray-100 text-gray-800 border-gray-200",
  進行中: "bg-blue-100 text-blue-800 border-blue-200",
  完了: "bg-green-100 text-green-800 border-green-200",
};

type SortField = "title" | "phase" | "contractStatus" | "customer" | "deal" | "contract" | "company" | "assigned_user" | "priority" | "status" | "due_date";
type SortDirection = "asc" | "desc";

export function TaskList({ tasks, users, deals, currentUserId, filterContractId, filterStatus }: TaskListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortField, setSortField] = useState<SortField>("due_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      key: "status",
      label: "タスクステータス",
      type: "select",
      quickFilter: true,
      options: Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      key: "priority",
      label: "優先度",
      type: "select",
      quickFilter: true,
      options: Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      key: "assigned_user",
      label: "担当者",
      type: "select",
      options: users.map((user) => ({
        value: user.id,
        label: user.name,
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

  // Clear URL-based filters
  const handleClearUrlFilters = () => {
    router.push("/tasks");
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

  const handleStatusToggle = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const supabase = createClient();
    const newStatus: TaskStatus = task.status === "完了" ? "未着手" : "完了";

    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    router.refresh();
  };

  const handleDelete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("このタスクを削除しますか？")) return;

    const supabase = createClient();
    await supabase.from("tasks").delete().eq("id", taskId);
    router.refresh();
  };

  // Helper to get deal display ID
  const getDealDisplayId = (task: Task) => {
    return formatDealId(
      task.deal?.customer?.customer_number,
      task.deal?.deal_number
    );
  };

  // Helper to get contract display ID
  const getContractDisplayId = (task: Task) => {
    return formatContractId(
      task.deal?.customer?.customer_number,
      task.deal?.deal_number,
      task.contract?.contract_number
    );
  };

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Apply search
    if (searchValue) {
      const lowerSearch = searchValue.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(lowerSearch) ||
          task.description?.toLowerCase().includes(lowerSearch) ||
          task.deal?.title?.toLowerCase().includes(lowerSearch) ||
          task.deal?.customer?.company_name?.toLowerCase().includes(lowerSearch) ||
          task.contract?.title?.toLowerCase().includes(lowerSearch) ||
          task.assigned_user?.name?.toLowerCase().includes(lowerSearch) ||
          task.company?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply filters
    for (const filter of activeFilters) {
      if (filter.key === "status") {
        result = result.filter((task) => task.status === filter.value);
      } else if (filter.key === "priority") {
        result = result.filter((task) => task.priority === filter.value);
      } else if (filter.key === "assigned_user") {
        result = result.filter((task) => task.assigned_user_id === filter.value);
      }
    }

    // Apply sort
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const statusOrder: Record<TaskStatus, number> = { 未着手: 0, 進行中: 1, 完了: 2 };

    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "phase":
          comparison = (a.contract?.phase || "").localeCompare(b.contract?.phase || "");
          break;
        case "contractStatus":
          comparison = (a.contract?.status || "").localeCompare(b.contract?.status || "");
          break;
        case "customer":
          comparison = (a.deal?.customer?.company_name || "").localeCompare(b.deal?.customer?.company_name || "");
          break;
        case "deal":
          comparison = (a.deal?.title || "").localeCompare(b.deal?.title || "");
          break;
        case "contract":
          comparison = (a.contract?.title || "").localeCompare(b.contract?.title || "");
          break;
        case "company":
          comparison = (a.company || "").localeCompare(b.company || "");
          break;
        case "assigned_user":
          comparison = (a.assigned_user?.name || "").localeCompare(b.assigned_user?.name || "");
          break;
        case "priority":
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "status":
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "due_date":
          const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          comparison = aDate - bDate;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [tasks, searchValue, activeFilters, sortField, sortDirection]);

  const getDueDateStyle = (dueDate: string | null, status: TaskStatus) => {
    if (!dueDate || status === "完了") return "";
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return "text-red-600 font-medium";
    if (isToday(date)) return "text-orange-600 font-medium";
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
        "flex items-center gap-1 font-medium transition-colors group",
        sortField === field ? "text-primary" : "text-gray-600 hover:text-gray-900",
        className
      )}
      onClick={() => handleSort(field)}
    >
      {children}
      <span className={cn(
        "transition-opacity",
        sortField === field ? "opacity-100" : "opacity-0 group-hover:opacity-50"
      )}>
        {sortField === field && sortDirection === "asc" ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </span>
    </button>
  );

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "完了").length;
    const overdue = tasks.filter(
      (t) =>
        t.status !== "完了" &&
        t.due_date &&
        isPast(new Date(t.due_date)) &&
        !isToday(new Date(t.due_date))
    ).length;
    const highPriority = tasks.filter(
      (t) => t.status !== "完了" && t.priority === "high"
    ).length;
    return { total, completed, overdue, highPriority };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <CheckSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">タスクがまだ登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">全タスク</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">完了</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">期限超過</p>
          <p className={cn("text-2xl font-bold", stats.overdue > 0 && "text-red-600")}>
            {stats.overdue}
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">高優先度</p>
          <p className={cn("text-2xl font-bold", stats.highPriority > 0 && "text-orange-600")}>
            {stats.highPriority}
          </p>
        </div>
      </div>

      {/* URL-based filter display */}
      {(filterContractId || filterStatus) && (
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
            <span>フィルタ適用中</span>
            <button onClick={handleClearUrlFilters} className="ml-1 hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      <SearchFilterBar
        placeholder="タスク名、顧客名、案件名、契約名、担当者で検索..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onFilterRemove={handleFilterRemove}
        onClearAll={handleClearAll}
        resultCount={filteredTasks.length}
        totalCount={tasks.length}
      />

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-[180px]">
                  <SortHeader field="title">タスク名</SortHeader>
                </TableHead>
                <TableHead>
                  <SortHeader field="phase">大分類</SortHeader>
                </TableHead>
                <TableHead>
                  <SortHeader field="contractStatus">小分類</SortHeader>
                </TableHead>
                <TableHead>
                  <SortHeader field="customer">顧客</SortHeader>
                </TableHead>
                <TableHead>
                  <SortHeader field="deal">案件ID</SortHeader>
                </TableHead>
                <TableHead>
                  <SortHeader field="contract">契約ID</SortHeader>
                </TableHead>
                <TableHead>
                  <SortHeader field="company">担当会社</SortHeader>
                </TableHead>
                <TableHead>
                  <SortHeader field="assigned_user">担当者</SortHeader>
                </TableHead>
                <TableHead>
                  <SortHeader field="priority">優先度</SortHeader>
                </TableHead>
                <TableHead>
                  <SortHeader field="status">ステータス</SortHeader>
                </TableHead>
                <TableHead>
                  <SortHeader field="due_date">期限</SortHeader>
                </TableHead>
                <TableHead className="text-right w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const dealDisplayId = getDealDisplayId(task);
                const contractDisplayId = getContractDisplayId(task);
                return (
                  <TableRow
                    key={task.id}
                    className={cn(
                      "cursor-pointer hover:bg-blue-50 transition-colors",
                      task.status === "完了" && "opacity-60 bg-gray-50"
                    )}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={task.status === "完了"}
                        onCheckedChange={() => {
                          const e = { stopPropagation: () => { } } as React.MouseEvent;
                          handleStatusToggle(task, e);
                        }}
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-medium",
                        task.status === "完了" && "line-through"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {task.status !== "完了" &&
                            task.due_date &&
                            isPast(new Date(task.due_date)) &&
                            !isToday(new Date(task.due_date)) && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          {task.title}
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.contract?.phase ? (
                        <Badge
                          variant="outline"
                          className={cn("border", phaseColors[task.contract.phase])}
                        >
                          {CONTRACT_PHASE_LABELS[task.contract.phase as keyof typeof CONTRACT_PHASE_LABELS]}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.contract?.status ? (
                        <Badge
                          variant="outline"
                          className={cn("border", contractStatusColors[task.contract.status])}
                        >
                          {CONTRACT_STATUS_LABELS[task.contract.status]}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.deal?.customer ? (
                        <Link
                          href={`/customers/${task.deal.customer.id}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {task.deal.customer.company_name}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.deal ? (
                        <Link
                          href={`/deals/${task.deal.id}`}
                          className="flex items-center gap-1 text-primary hover:underline text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="font-mono text-xs text-gray-500">{dealDisplayId}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.contract ? (
                        <Link
                          href={`/contracts/${task.contract.id}`}
                          className="flex items-center gap-1 text-primary hover:underline text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="font-mono text-xs text-gray-500">{contractDisplayId}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.company ? (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="text-sm">{task.company}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {task.assigned_user?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("border", priorityColors[task.priority])}
                      >
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("border", statusColors[task.status])}
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={getDueDateStyle(task.due_date, task.status)}
                    >
                      {task.due_date
                        ? format(new Date(task.due_date), "yyyy/MM/dd", { locale: ja })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex justify-end space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TaskDialog
                          task={task}
                          users={users}
                          deals={deals}
                          currentUserId={currentUserId}
                          trigger={
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(task.id, e)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filteredTasks.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            条件に一致するタスクがありません
          </div>
        )}
      </div>
    </div>
  );
}
