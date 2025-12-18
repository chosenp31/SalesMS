"use client";

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
import { format, isPast, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { TaskDialog } from "./task-dialog";
import Link from "next/link";

interface TaskListProps {
  tasks: Task[];
  users: User[];
  deals: DealOption[];
  currentUserId: string;
}

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const statusColors = {
  not_started: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

export function TaskList({ tasks, users, deals, currentUserId }: TaskListProps) {
  const router = useRouter();

  const handleStatusToggle = async (task: Task) => {
    const supabase = createClient();
    const newStatus = task.status === "completed" ? "not_started" : "completed";

    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    router.refresh();
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("このタスクを削除しますか？")) return;

    const supabase = createClient();
    await supabase.from("tasks").delete().eq("id", taskId);
    router.refresh();
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-500">タスクがまだ登録されていません</p>
      </div>
    );
  }

  const getDueDateStyle = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "completed") return "";
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return "text-red-600 font-medium";
    if (isToday(date)) return "text-orange-600 font-medium";
    return "";
  };

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>タスク名</TableHead>
            <TableHead>関連案件</TableHead>
            <TableHead>優先度</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>担当者</TableHead>
            <TableHead>期限</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className={cn(task.status === "completed" && "opacity-60")}
            >
              <TableCell>
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={() => handleStatusToggle(task)}
                />
              </TableCell>
              <TableCell
                className={cn(
                  "font-medium",
                  task.status === "completed" && "line-through"
                )}
              >
                <div>
                  {task.title}
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
                  >
                    {task.deal.title}
                  </Link>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(priorityColors[task.priority])}
                >
                  {TASK_PRIORITY_LABELS[task.priority]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn(statusColors[task.status])}
                >
                  {TASK_STATUS_LABELS[task.status]}
                </Badge>
              </TableCell>
              <TableCell>{task.assigned_user?.name || "-"}</TableCell>
              <TableCell
                className={getDueDateStyle(task.due_date, task.status)}
              >
                {task.due_date
                  ? format(new Date(task.due_date), "yyyy/MM/dd", { locale: ja })
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-1">
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
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
