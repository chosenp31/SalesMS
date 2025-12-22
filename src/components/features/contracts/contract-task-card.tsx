"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Task, User } from "@/types";
import { Tables } from "@/types/database";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  STATUS_TO_PHASE,
} from "@/constants";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isPast, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { cn, formatDealId, formatContractId } from "@/lib/utils";
import { Plus, CheckSquare, Trash2, AlertCircle } from "lucide-react";

// 契約情報の型
type ContractWithDeal = Tables<"contracts"> & {
  deal?: {
    id: string;
    title: string;
    deal_number?: number;
    customer?: {
      id: string;
      company_name: string;
      customer_number?: number;
    };
  };
};

const taskSchema = z.object({
  title: z.string().min(1, "タスク名は必須です"),
  assigned_user_id: z.string().min(1, "担当者を選択してください"),
  due_date: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["未着手", "進行中", "完了"]),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface ContractTaskCardProps {
  contract: ContractWithDeal;
  tasks: Task[];
  users: User[];
  currentUserId: string;
}

const priorityColors = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const statusColors = {
  未着手: "bg-gray-100 text-gray-800",
  進行中: "bg-blue-100 text-blue-800",
  完了: "bg-green-100 text-green-800",
};

function NewTaskDialog({
  contract,
  users,
  currentUserId,
  trigger,
}: {
  contract: ContractWithDeal;
  users: User[];
  currentUserId: string;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      assigned_user_id: currentUserId,
      due_date: "",
      priority: "medium",
      status: "未着手",
    },
  });

  const onSubmit = async (data: TaskFormValues) => {
    setLoading(true);

    try {
      const supabase = createClient();

      // フェーズを取得
      const phase = STATUS_TO_PHASE[contract.status] || "商談中";

      const taskData = {
        title: data.title,
        description: null,
        deal_id: contract.deal_id,
        contract_id: contract.id,
        assigned_user_id: data.assigned_user_id,
        due_date: data.due_date || null,
        status: data.status,
        priority: data.priority,
        phase: phase,
        contract_status: contract.status,
      };

      const { error } = await supabase.from("tasks").insert(taskData);
      if (error) throw error;

      toast({
        title: "タスクを作成しました",
        description: `${data.title}を作成しました`,
      });

      setOpen(false);
      form.reset();
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "保存中にエラーが発生しました";
      toast({
        title: "エラーが発生しました",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>新規タスク</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 自動設定される情報の表示（読み取り専用） */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-500 font-medium mb-2">以下の項目は契約情報から自動設定されます</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">大分類:</span>
                  <span className="ml-2 font-medium">{STATUS_TO_PHASE[contract.status] || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">小分類:</span>
                  <span className="ml-2 font-medium">{contract.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">顧客:</span>
                  <span className="ml-2 font-medium">{contract.deal?.customer?.company_name || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">案件ID:</span>
                  <span className="ml-2 font-medium font-mono text-xs">
                    {formatDealId(contract.deal?.customer?.customer_number, contract.deal?.deal_number)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">契約ID:</span>
                  <span className="ml-2 font-medium font-mono text-xs">
                    {formatContractId(contract.deal?.customer?.customer_number, contract.deal?.deal_number, contract.contract_number)}
                  </span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タスク名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="タスク名を入力" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigned_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>担当者 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="担当者を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>優先度 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="優先度を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステータス *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="ステータスを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>期限</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "作成中..." : "作成"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ContractTaskCard({
  contract,
  tasks,
  users,
  currentUserId,
}: ContractTaskCardProps) {
  const router = useRouter();

  // この契約に紐づくタスクのみフィルタ
  const contractTasks = tasks.filter((task) => task.contract_id === contract.id);

  const handleStatusToggle = async (task: Task) => {
    const supabase = createClient();
    const newStatus = task.status === "完了" ? "未着手" : "完了";

    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    router.refresh();
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("このタスクを削除しますか？")) return;

    const supabase = createClient();
    await supabase.from("tasks").delete().eq("id", taskId);
    router.refresh();
  };

  const getDueDateStyle = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "完了") return "";
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return "text-red-600 font-medium";
    if (isToday(date)) return "text-orange-600 font-medium";
    return "";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <CheckSquare className="h-5 w-5 mr-2" />
          タスク
        </CardTitle>
        <NewTaskDialog
          contract={contract}
          users={users}
          currentUserId={currentUserId}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              タスク追加
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        {contractTasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            タスクがありません
          </p>
        ) : (
          <div className="space-y-3">
            {contractTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-start justify-between p-3 bg-gray-50 rounded-lg",
                  task.status === "完了" && "opacity-60"
                )}
              >
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={task.status === "完了"}
                    onCheckedChange={() => handleStatusToggle(task)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.status !== "完了" &&
                        task.due_date &&
                        isPast(new Date(task.due_date)) &&
                        !isToday(new Date(task.due_date)) && (
                          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                      <span
                        className={cn(
                          "font-medium text-sm",
                          task.status === "完了" && "line-through"
                        )}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", priorityColors[task.priority])}
                      >
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", statusColors[task.status])}
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>
                      {task.due_date && (
                        <span
                          className={cn(
                            "text-xs text-gray-500",
                            getDueDateStyle(task.due_date, task.status)
                          )}
                        >
                          {format(new Date(task.due_date), "MM/dd", { locale: ja })}
                        </span>
                      )}
                      {task.assigned_user && (
                        <span className="text-xs text-gray-500">
                          {task.assigned_user.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(task.id)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
