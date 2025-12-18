"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Payment, DealOption } from "@/types";
import { PAYMENT_STATUS_LABELS, LEASE_COMPANIES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const paymentSchema = z.object({
  deal_id: z.string().min(1, "案件を選択してください"),
  lease_company: z.string().optional(),
  expected_amount: z.string().optional(),
  actual_amount: z.string().optional(),
  expected_date: z.string().optional(),
  actual_date: z.string().optional(),
  status: z.enum(["pending", "paid"]),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  payment?: Payment;
  deals: DealOption[];
  trigger: React.ReactNode;
}

export function PaymentDialog({ payment, deals, trigger }: PaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      deal_id: payment?.deal_id || "",
      lease_company: payment?.lease_company || "",
      expected_amount: payment?.expected_amount?.toString() || "",
      actual_amount: payment?.actual_amount?.toString() || "",
      expected_date: payment?.expected_date || "",
      actual_date: payment?.actual_date || "",
      status: payment?.status || "pending",
    },
  });

  const onSubmit = async (data: PaymentFormValues) => {
    setLoading(true);
    const supabase = createClient();

    const paymentData = {
      deal_id: data.deal_id,
      lease_company: data.lease_company || null,
      expected_amount: data.expected_amount
        ? parseFloat(data.expected_amount)
        : null,
      actual_amount: data.actual_amount
        ? parseFloat(data.actual_amount)
        : null,
      expected_date: data.expected_date || null,
      actual_date: data.actual_date || null,
      status: data.status,
    };

    if (payment) {
      await supabase.from("payments").update(paymentData).eq("id", payment.id);
    } else {
      await supabase.from("payments").insert(paymentData);
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
          <DialogTitle>{payment ? "入金編集" : "新規入金"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>案件 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="案件を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
                      <SelectItem value="">なし</SelectItem>
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expected_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>予定金額</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actual_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>実績金額</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expected_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>予定日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actual_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>入金日</FormLabel>
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
                      {Object.entries(PAYMENT_STATUS_LABELS).map(
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
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "保存中..." : payment ? "更新" : "作成"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
