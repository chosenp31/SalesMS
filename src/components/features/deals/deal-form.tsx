"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Customer, Deal, User, DealStatus } from "@/types";
import { DEAL_STATUS_LABELS } from "@/constants";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent } from "@/components/ui/card";

const dealSchema = z.object({
  title: z.string().min(1, "商談名は必須です"),
  customer_id: z.string().min(1, "顧客を選択してください"),
  assigned_user_id: z.string().min(1, "担当者を選択してください"),
  status: z.enum(["active", "won", "lost", "pending"]),
  description: z.string().optional(),
  total_amount: z.string().optional().refine(
    (val) => !val || parseFloat(val) >= 0,
    { message: "合計金額は0以上で入力してください" }
  ),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormProps {
  deal?: Deal;
  customers: Customer[];
  users: User[];
  defaultCustomerId?: string;
  currentUserId?: string;
}

export function DealForm({
  deal,
  customers,
  users,
  defaultCustomerId,
  currentUserId,
}: DealFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: deal?.title || "",
      customer_id: deal?.customer_id || defaultCustomerId || "",
      assigned_user_id: deal?.assigned_user_id || currentUserId || "",
      status: deal?.status || "active",
      description: deal?.description || "",
      total_amount: deal?.total_amount?.toString() || "",
    },
  });

  const onSubmit = async (data: DealFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const dealData = {
        title: data.title,
        customer_id: data.customer_id,
        assigned_user_id: data.assigned_user_id,
        status: data.status as DealStatus,
        description: data.description || null,
        total_amount: data.total_amount
          ? parseFloat(data.total_amount)
          : null,
      };

      if (deal) {
        const { error: updateError } = await supabase
          .from("deals")
          .update(dealData)
          .eq("id", deal.id);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "案件を更新しました",
          description: `${data.title}の情報を更新しました`,
        });
      } else {
        const { error: insertError } = await supabase.from("deals").insert(dealData);

        if (insertError) {
          throw insertError;
        }

        toast({
          title: "案件を登録しました",
          description: `${data.title}を新規登録しました`,
        });
      }

      router.push("/deals");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "保存中にエラーが発生しました";
      setError(errorMessage);
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
    <Card>
      <CardContent className="pt-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>商談名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="OA機器導入商談" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>顧客 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="顧客を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.company_name}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステータス *</FormLabel>
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
                        {Object.entries(DEAL_STATUS_LABELS).map(
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
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>合計金額</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備考</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="商談に関するメモを入力..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "保存中..." : deal ? "更新" : "登録"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
