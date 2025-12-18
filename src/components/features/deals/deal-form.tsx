"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Customer, Deal, User } from "@/types";
import {
  CONTRACT_TYPE_LABELS,
  DEAL_STATUS_LABELS,
  PHASE_STATUSES,
  PRODUCT_CATEGORIES,
} from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  title: z.string().min(1, "案件名は必須です"),
  customer_id: z.string().min(1, "顧客を選択してください"),
  assigned_user_id: z.string().min(1, "担当者を選択してください"),
  contract_type: z.enum(["lease", "rental", "installment"]),
  status: z.string().min(1, "ステータスを選択してください"),
  product_category: z.string().optional(),
  estimated_amount: z.string().optional(),
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
  const [loading, setLoading] = useState(false);

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: deal?.title || "",
      customer_id: deal?.customer_id || defaultCustomerId || "",
      assigned_user_id: deal?.assigned_user_id || currentUserId || "",
      contract_type: deal?.contract_type || "lease",
      status: deal?.status || "appointment_acquired",
      product_category: deal?.product_category || "",
      estimated_amount: deal?.estimated_amount?.toString() || "",
    },
  });

  const onSubmit = async (data: DealFormValues) => {
    setLoading(true);
    const supabase = createClient();

    const dealData = {
      title: data.title,
      customer_id: data.customer_id,
      assigned_user_id: data.assigned_user_id,
      contract_type: data.contract_type,
      status: data.status,
      product_category: data.product_category || null,
      estimated_amount: data.estimated_amount
        ? parseFloat(data.estimated_amount)
        : null,
    };

    if (deal) {
      const { error } = await supabase
        .from("deals")
        .update(dealData)
        .eq("id", deal.id);

      if (error) {
        console.error("Error updating deal:", error);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("deals").insert(dealData);

      if (error) {
        console.error("Error creating deal:", error);
        setLoading(false);
        return;
      }
    }

    router.push("/deals");
    router.refresh();
  };

  // Get all statuses for the select
  const allStatuses = Object.values(PHASE_STATUSES).flat();

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>案件名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="複合機リース契約" {...field} />
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
                name="contract_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>契約種別 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="契約種別を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CONTRACT_TYPE_LABELS).map(
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
                        {allStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {DEAL_STATUS_LABELS[status]}
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
                name="product_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>商品カテゴリ</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="商品カテゴリを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                name="estimated_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>見込金額</FormLabel>
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
