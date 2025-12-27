"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Task, User, TaskNameMaster, ContractType } from "@/types";
import { Tables } from "@/types/database";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  STEP_TO_STAGE,
} from "@/constants";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, CheckSquare, Trash2, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

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
  task_name_master_id: z.string().min(1, "タスク名を選択してください"),
  custom_title: z.string().optional(),
  assigned_user_id: z.string().min(1, "担当者を選択してください"),
  due_date: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["未着手", "進行中", "完了"]),
});

type TaskFormValues = z.infer<typeof taskSchema>;

import { priorityColors, taskStatusColors } from "@/constants/colors";

interface ContractTaskCardProps {
  contract: ContractWithDeal;
  tasks: Task[];
  users: User[];
  currentUserId: string;
}

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
  const [taskNameMasters, setTaskNameMasters] = useState<TaskNameMaster[]>([]);
  const [isOther, setIsOther] = useState(false);

  // 契約種別に応じたタスク名マスタを取得
  useEffect(() => {
    const fetchTaskNameMasters = async () => {
      const supabase = createClient();
      const contractType = contract.contract_type as ContractType;

      const { data } = await supabase
        .from("task_name_master")
        .select("*")
        .eq("contract_type", contractType)
        .eq("is_active", true)
        .order("display_order");

      if (data) {
        setTaskNameMasters(data as TaskNameMaster[]);
      }
    };

    if (open) {
      fetchTaskNameMasters();
    }
  }, [open, contract.contract_type]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      task_name_master_id: "",
      custom_title: "",
      assigned_user_id: currentUserId,
      due_date: "",
      priority: "medium",
      status: "未着手",
    },
  });

  // タスク名マスタ選択時の処理
  const handleTaskNameChange = (masterId: string) => {
    const master = taskNameMasters.find(m => m.id === masterId);
    setIsOther(master?.name === "その他");
    form.setValue("task_name_master_id", masterId);
    if (master?.name !== "その他") {
      form.setValue("custom_title", "");
    }
  };

  const onSubmit = async (data: TaskFormValues) => {
    setLoading(true);

    try {
      const supabase = createClient();

      // タスク名を決定（「その他」の場合はカスタムタイトル、それ以外はマスタの名前）
      const selectedMaster = taskNameMasters.find(m => m.id === data.task_name_master_id);
      const taskTitle = selectedMaster?.name === "その他"
        ? (data.custom_title || "その他")
        : (selectedMaster?.name || "");

      const taskData = {
        title: taskTitle,
        description: null,
        deal_id: contract.deal_id,
        contract_id: contract.id,
        assigned_user_id: data.assigned_user_id,
        due_date: data.due_date || null,
        status: data.status,
        priority: data.priority,
        task_name_master_id: data.task_name_master_id,
      };

      const { error } = await supabase.from("tasks").insert(taskData);
      if (error) throw error;

      toast({
        title: "タスクを作成しました",
        description: `${taskTitle}を作成しました`,
      });

      setOpen(false);
      form.reset();
      setIsOther(false);
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
                  <span className="text-gray-500">ステージ:</span>
                  <span className="ml-2 font-medium">{STEP_TO_STAGE[contract.step] || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">ステップ:</span>
                  <span className="ml-2 font-medium">{contract.step}</span>
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
              name="task_name_master_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タスク名 *</FormLabel>
                  <Select onValueChange={handleTaskNameChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="タスク名を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {taskNameMasters.map((master) => (
                        <SelectItem key={master.id} value={master.id}>
                          {master.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isOther && (
              <FormField
                control={form.control}
                name="custom_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>タスク名（詳細）*</FormLabel>
                    <FormControl>
                      <Input placeholder="タスク名を入力" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
      <CardContent className="p-0">
        {contractTasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            タスクがありません
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="min-w-[120px]">タスク名</TableHead>
                  <TableHead>ステージ</TableHead>
                  <TableHead>ステップ</TableHead>
                  <TableHead>担当者</TableHead>
                  <TableHead>優先度</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>期限</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className={cn(task.status === "完了" && "opacity-60 bg-gray-50")}
                  >
                    <TableCell>
                      <Checkbox
                        checked={task.status === "完了"}
                        onCheckedChange={() => handleStatusToggle(task)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {task.status !== "完了" &&
                          task.due_date &&
                          isPast(new Date(task.due_date)) &&
                          !isToday(new Date(task.due_date)) && (
                            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        <Link
                          href={`/tasks/${task.id}`}
                          className={cn(
                            "font-medium text-sm text-primary hover:underline flex items-center gap-1",
                            task.status === "完了" && "line-through"
                          )}
                        >
                          {task.title}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {STEP_TO_STAGE[contract.step] || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {contract.step || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {task.assigned_user?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", priorityColors[task.priority])}
                      >
                        {TASK_PRIORITY_LABELS[task.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", taskStatusColors[task.status])}
                      >
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-xs",
                      getDueDateStyle(task.due_date, task.status)
                    )}>
                      {task.due_date
                        ? format(new Date(task.due_date), "MM/dd", { locale: ja })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
