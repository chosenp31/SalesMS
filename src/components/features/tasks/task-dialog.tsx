"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Task, User, DealOption } from "@/types";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const taskSchema = z.object({
  title: z.string().min(1, "タスク名は必須です"),
  description: z.string().optional(),
  deal_id: z.string().optional(),
  assigned_user_id: z.string().min(1, "担当者を選択してください"),
  due_date: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]),
  priority: z.enum(["high", "medium", "low"]),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskDialogProps {
  task?: Task;
  users: User[];
  deals: DealOption[];
  currentUserId: string;
  trigger: React.ReactNode;
}

export function TaskDialog({
  task,
  users,
  deals,
  currentUserId,
  trigger,
}: TaskDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      deal_id: task?.deal_id || "",
      assigned_user_id: task?.assigned_user_id || currentUserId,
      due_date: task?.due_date || "",
      status: task?.status || "not_started",
      priority: task?.priority || "medium",
    },
  });

  const onSubmit = async (data: TaskFormValues) => {
    setLoading(true);
    const supabase = createClient();

    const taskData = {
      title: data.title,
      description: data.description || null,
      deal_id: data.deal_id || null,
      assigned_user_id: data.assigned_user_id,
      due_date: data.due_date || null,
      status: data.status,
      priority: data.priority,
    };

    if (task) {
      await supabase.from("tasks").update(taskData).eq("id", task.id);
    } else {
      await supabase.from("tasks").insert(taskData);
    }

    setLoading(false);
    setOpen(false);
    form.reset();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? "タスク編集" : "新規タスク"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>詳細</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="タスクの詳細を入力"
                      className="resize-none"
                      {...field}
                    />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>優先度</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="優先度を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TASK_PRIORITY_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステータス</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="ステータスを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TASK_STATUS_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="deal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>関連案件</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="案件を選択（任意）" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">なし</SelectItem>
                      {deals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id}>
                          {deal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "保存中..." : task ? "更新" : "作成"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
