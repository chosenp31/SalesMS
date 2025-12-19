"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { ContractStatus } from "@/types";
import { Tables } from "@/types/database";
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  PRODUCT_CATEGORIES,
  LEASE_COMPANIES,
  CONTRACT_MONTHS_OPTIONS,
} from "@/constants";
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

const contractSchema = z.object({
  title: z.string().min(1, "契約名は必須です"),
  contract_type: z.enum(["lease", "rental", "installment"]),
  product_category: z.string().optional(),
  lease_company: z.string().optional(),
  status: z.string().min(1, "ステータスを選択してください"),
  monthly_amount: z.string().optional(),
  total_amount: z.string().optional(),
  contract_months: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

interface ContractFormProps {
  dealId: string;
  contract?: Tables<"contracts">;
}

export function ContractForm({ dealId, contract }: ContractFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      title: contract?.title || "",
      contract_type: contract?.contract_type || "lease",
      product_category: contract?.product_category || "",
      lease_company: contract?.lease_company || "",
      status: contract?.status || "negotiating",
      monthly_amount: contract?.monthly_amount?.toString() || "",
      total_amount: contract?.total_amount?.toString() || "",
      contract_months: contract?.contract_months?.toString() || "",
      start_date: contract?.start_date?.split("T")[0] || "",
      end_date: contract?.end_date?.split("T")[0] || "",
      notes: contract?.notes || "",
    },
  });

  const onSubmit = async (data: ContractFormValues) => {
    setLoading(true);
    const supabase = createClient();

    const contractData = {
      deal_id: dealId,
      title: data.title,
      contract_type: data.contract_type,
      product_category: data.product_category || null,
      lease_company: data.lease_company || null,
      status: data.status as ContractStatus,
      monthly_amount: data.monthly_amount
        ? parseFloat(data.monthly_amount)
        : null,
      total_amount: data.total_amount ? parseFloat(data.total_amount) : null,
      contract_months: data.contract_months
        ? parseInt(data.contract_months)
        : null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      notes: data.notes || null,
    };

    if (contract) {
      const { error } = await supabase
        .from("contracts")
        .update(contractData)
        .eq("id", contract.id);

      if (error) {
        console.error("Error updating contract:", error);
        setLoading(false);
        return;
      }
      router.push(`/contracts/${contract.id}`);
    } else {
      const { data: newContract, error } = await supabase
        .from("contracts")
        .insert(contractData)
        .select()
        .single();

      if (error) {
        console.error("Error creating contract:", error);
        setLoading(false);
        return;
      }
      router.push(`/contracts/${newContract.id}`);
    }

    router.refresh();
  };

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
                    <FormLabel>契約名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="複合機リース契約" {...field} />
                    </FormControl>
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
                name="lease_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>リース会社</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="リース会社を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEASE_COMPANIES.map((company) => (
                          <SelectItem key={company} value={company}>
                            {company}
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
                        {Object.entries(CONTRACT_STATUS_LABELS).map(
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
                name="contract_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>契約期間</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="契約期間を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTRACT_MONTHS_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                          >
                            {option.label}
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
                name="monthly_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>月額</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50000" {...field} />
                    </FormControl>
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
                      <Input type="number" placeholder="3000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>開始日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>終了日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備考</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="契約に関するメモを入力..."
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
                {loading ? "保存中..." : contract ? "更新" : "登録"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
