"use client";

import { useState, useMemo } from "react";
import { Task, User, DealOption, TaskStatus } from "@/types";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isPast, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { cn, formatContractId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ChevronUp, ChevronDown, CheckSquare, AlertCircle, X, CalendarIcon } from "lucide-react";
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

const contractStatusColors: Record<string, string> = {
  // 新スキーマ - 商談中
  商談待ち: "bg-blue-50 text-blue-700 border-blue-200",
  商談日程調整中: "bg-blue-50 text-blue-700 border-blue-200",
  // 新スキーマ - 審査・申込中
  "審査・申込対応中": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "審査・申込待ち": "bg-yellow-50 text-yellow-700 border-yellow-200",
  // 新スキーマ - 下見・工事中
  下見調整中: "bg-purple-50 text-purple-700 border-purple-200",
  下見実施待ち: "bg-purple-50 text-purple-700 border-purple-200",
  工事日程調整中: "bg-purple-50 text-purple-700 border-purple-200",
  工事実施待ち: "bg-purple-50 text-purple-700 border-purple-200",
  // 新スキーマ - 契約中
  検収確認中: "bg-indigo-50 text-indigo-700 border-indigo-200",
  契約書提出対応中: "bg-indigo-50 text-indigo-700 border-indigo-200",
  契約書確認待ち: "bg-indigo-50 text-indigo-700 border-indigo-200",
  // 新スキーマ - 入金中
  入金待ち: "bg-green-50 text-green-700 border-green-200",
  入金済: "bg-green-100 text-green-800 border-green-200",
  // 新スキーマ - 請求中
  初回請求確認待ち: "bg-teal-50 text-teal-700 border-teal-200",
  請求処理対応中: "bg-teal-50 text-teal-700 border-teal-200",
  // 新スキーマ - 完了・否決
  クローズ: "bg-gray-100 text-gray-800 border-gray-200",
  対応検討中: "bg-orange-50 text-orange-700 border-orange-200",
  失注: "bg-red-100 text-red-800 border-red-200",
  // 旧スキーマ（後方互換性）
  日程調整中: "bg-blue-50 text-blue-700 border-blue-200",
  MTG実施待ち: "bg-blue-50 text-blue-700 border-blue-200",
  見積提出: "bg-blue-50 text-blue-700 border-blue-200",
  受注確定: "bg-blue-100 text-blue-800 border-blue-200",
  書類準備中: "bg-yellow-50 text-yellow-700 border-yellow-200",
  審査結果待ち: "bg-yellow-50 text-yellow-700 border-yellow-200",
  可決: "bg-green-100 text-green-800 border-green-200",
  否決: "bg-red-100 text-red-800 border-red-200",
  下見日程調整中: "bg-purple-50 text-purple-700 border-purple-200",
};

const statusColors: Record<TaskStatus, string> = {
  未着手: "bg-gray-100 text-gray-800 border-gray-200",
  進行中: "bg-blue-100 text-blue-800 border-blue-200",
  完了: "bg-green-100 text-green-800 border-green-200",
};

type SortField = "title" | "contractStatus" | "customer" | "deal" | "contract" | "assigned_user" | "priority" | "status" | "due_date";
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

  // 3値サイクル: 未着手 → 進行中 → 完了 → 未着手
  const handleStatusToggle = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const supabase = createClient();
    const statusCycle: Record<TaskStatus, TaskStatus> = {
      未着手: "進行中",
      進行中: "完了",
      完了: "未着手",
    };
    const newStatus = statusCycle[task.status];

    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    router.refresh();
  };

  // インライン更新用の関数
  const handleInlineUpdate = async (taskId: string, field: string, value: string | null) => {
    const supabase = createClient();
    await supabase.from("tasks").update({ [field]: value }).eq("id", taskId);
    router.refresh();
  };

  const handleDelete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("このタスクを削除しますか？")) return;

    const supabase = createClient();
    await supabase.from("tasks").delete().eq("id", taskId);
    router.refresh();
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
          task.assigned_user?.name?.toLowerCase().includes(lowerSearch)
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
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-[200px]">
                  <SortHeader field="title">タスク名</SortHeader>
                </TableHead>
                <TableHead className="w-[140px]">
                  <SortHeader field="customer">顧客</SortHeader>
                </TableHead>
                <TableHead className="w-[110px]">
                  <SortHeader field="contractStatus">契約ステータス</SortHeader>
                </TableHead>
                <TableHead className="w-[80px]">
                  <SortHeader field="contract">契約ID</SortHeader>
                </TableHead>
                <TableHead className="w-[80px]">
                  <SortHeader field="assigned_user">担当者</SortHeader>
                </TableHead>
                <TableHead className="w-[70px]">
                  <SortHeader field="priority">優先度</SortHeader>
                </TableHead>
                <TableHead className="w-[80px]">
                  <SortHeader field="status">ステータス</SortHeader>
                </TableHead>
                <TableHead className="w-[100px]">
                  <SortHeader field="due_date">期限</SortHeader>
                </TableHead>
                <TableHead className="text-right w-[70px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const contractDisplayId = getContractDisplayId(task);
                return (
                  <TableRow
                    key={task.id}
                    className={cn(
                      "hover:bg-blue-50 transition-colors",
                      task.status === "完了" && "opacity-60 bg-gray-50"
                    )}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()} className="py-2">
                      <Checkbox
                        checked={task.status === "完了"}
                        onCheckedChange={() => {
                          const e = { stopPropagation: () => { } } as React.MouseEvent;
                          handleStatusToggle(task, e);
                        }}
                      />
                    </TableCell>
                    <TableCell className={cn("py-2", task.status === "完了" && "line-through")}>
                      <div className="flex items-center gap-1">
                        {task.status !== "完了" &&
                          task.due_date &&
                          isPast(new Date(task.due_date)) &&
                          !isToday(new Date(task.due_date)) && (
                            <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                          )}
                        <Link
                          href={`/tasks/${task.id}`}
                          className="text-sm truncate text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {task.title}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      {task.deal?.customer ? (
                        <Link
                          href={`/customers/${task.deal.customer.id}`}
                          className="text-sm text-primary hover:underline truncate block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {task.deal.customer.company_name}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      {task.contract?.status ? (
                        <Badge
                          variant="outline"
                          className={cn("border text-xs px-1.5 py-0", contractStatusColors[task.contract.status])}
                        >
                          {CONTRACT_STATUS_LABELS[task.contract.status]}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      {task.contract ? (
                        <Link
                          href={`/contracts/${task.contract.id}`}
                          className="font-mono text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contractDisplayId}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    {/* 担当者 - クリックで変更 */}
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-sm text-left hover:bg-gray-100 rounded px-1 py-0.5 -mx-1 w-full truncate">
                            {task.assigned_user?.name || "-"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                          <div className="space-y-1">
                            {users.map((user) => (
                              <button
                                key={user.id}
                                className={cn(
                                  "w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100",
                                  task.assigned_user_id === user.id && "bg-blue-50 text-blue-700"
                                )}
                                onClick={() => handleInlineUpdate(task.id, "assigned_user_id", user.id)}
                              >
                                {user.name}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    {/* 優先度 - クリックで変更 */}
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button>
                            <Badge
                              variant="outline"
                              className={cn("border text-xs px-1.5 py-0 cursor-pointer hover:opacity-80", priorityColors[task.priority])}
                            >
                              {TASK_PRIORITY_LABELS[task.priority]}
                            </Badge>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-32 p-2" align="start">
                          <div className="space-y-1">
                            {(Object.entries(TASK_PRIORITY_LABELS) as [keyof typeof TASK_PRIORITY_LABELS, string][]).map(([value, label]) => (
                              <button
                                key={value}
                                className={cn(
                                  "w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100",
                                  task.priority === value && "bg-blue-50 text-blue-700"
                                )}
                                onClick={() => handleInlineUpdate(task.id, "priority", value)}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    {/* ステータス - クリックで変更 */}
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button>
                            <Badge
                              variant="outline"
                              className={cn("border text-xs px-1.5 py-0 cursor-pointer hover:opacity-80", statusColors[task.status])}
                            >
                              {TASK_STATUS_LABELS[task.status]}
                            </Badge>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-32 p-2" align="start">
                          <div className="space-y-1">
                            {(Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).map(([value, label]) => (
                              <button
                                key={value}
                                className={cn(
                                  "w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100",
                                  task.status === value && "bg-blue-50 text-blue-700"
                                )}
                                onClick={() => handleInlineUpdate(task.id, "status", value)}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    {/* 期限 - クリックで変更 */}
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className={cn(
                            "text-sm hover:bg-gray-100 rounded px-1 py-0.5 -mx-1 flex items-center gap-1",
                            getDueDateStyle(task.due_date, task.status)
                          )}>
                            <CalendarIcon className="h-3 w-3 text-gray-400" />
                            {task.due_date
                              ? format(new Date(task.due_date), "MM/dd", { locale: ja })
                              : "-"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={task.due_date ? new Date(task.due_date) : undefined}
                            onSelect={(date) => handleInlineUpdate(task.id, "due_date", date ? format(date, "yyyy-MM-dd") : null)}
                            initialFocus
                            locale={ja}
                          />
                          {task.due_date && (
                            <div className="p-2 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-red-500 hover:text-red-600"
                                onClick={() => handleInlineUpdate(task.id, "due_date", null)}
                              >
                                期限をクリア
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="text-right py-2">
                      <div
                        className="flex justify-end space-x-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TaskDialog
                          task={task}
                          users={users}
                          deals={deals}
                          currentUserId={currentUserId}
                          trigger={
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => handleDelete(task.id, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
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
