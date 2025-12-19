"use client";

import { useState, useMemo } from "react";
import { Task, User, DealOption } from "@/types";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/constants";
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
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ChevronUp, ChevronDown, CheckSquare, AlertCircle } from "lucide-react";
import { TaskDialog } from "./task-dialog";
import Link from "next/link";

interface TaskListProps {
  tasks: Task[];
  users: User[];
  deals: DealOption[];
  currentUserId: string;
}

const priorityColors = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const statusColors = {
  not_started: "bg-gray-100 text-gray-800 border-gray-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

type SortField = "title" | "deal" | "priority" | "status" | "assigned_user" | "due_date";
type SortDirection = "asc" | "desc";

export function TaskList({ tasks, users, deals, currentUserId }: TaskListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortField, setSortField] = useState<SortField>("due_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      key: "status",
      label: "ステータス",
      type: "select",
      quickFilter: true, // インライン表示
      options: Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      key: "priority",
      label: "優先度",
      type: "select",
      quickFilter: true, // インライン表示
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
    const newStatus = task.status === "completed" ? "not_started" : "completed";

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
    const statusOrder = { not_started: 0, in_progress: 1, completed: 2 };

    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "deal":
          comparison = (a.deal?.title || "").localeCompare(b.deal?.title || "");
          break;
        case "priority":
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "status":
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "assigned_user":
          comparison = (a.assigned_user?.name || "").localeCompare(
            b.assigned_user?.name || ""
          );
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

  const getDueDateStyle = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "completed") return "";
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
    const completed = tasks.filter((t) => t.status === "completed").length;
    const overdue = tasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.due_date &&
        isPast(new Date(t.due_date)) &&
        !isToday(new Date(t.due_date))
    ).length;
    const highPriority = tasks.filter(
      (t) => t.status !== "completed" && t.priority === "high"
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

      <SearchFilterBar
        placeholder="タスク名、説明、関連案件、担当者で検索..."
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
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-[250px]">
                <SortHeader field="title">タスク名</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="deal">関連案件</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="priority">優先度</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="status">ステータス</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="assigned_user">担当者</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="due_date">期限</SortHeader>
              </TableHead>
              <TableHead className="text-right w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow
                key={task.id}
                className={cn(
                  "cursor-pointer hover:bg-blue-50 transition-colors",
                  task.status === "completed" && "opacity-60 bg-gray-50"
                )}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={() => {
                      const e = { stopPropagation: () => { } } as React.MouseEvent;
                      handleStatusToggle(task, e);
                    }}
                  />
                </TableCell>
                <TableCell
                  className={cn(
                    "font-medium",
                    task.status === "completed" && "line-through"
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {task.status !== "completed" &&
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
                  {task.deal ? (
                    <Link
                      href={`/deals/${task.deal.id}`}
                      className="text-primary hover:underline text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.deal.title}
                    </Link>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
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
                <TableCell className="text-gray-600">
                  {task.assigned_user?.name || "-"}
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
            ))}
          </TableBody>
        </Table>
        {filteredTasks.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            条件に一致するタスクがありません
          </div>
        )}
      </div>
    </div>
  );
}
