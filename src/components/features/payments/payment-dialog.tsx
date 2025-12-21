"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Payment, ContractOption } from "@/types";
import { PAYMENT_STATUS_LABELS, PAYMENT_TYPE_LABELS } from "@/constants";
import { useToast } from "@/lib/hooks/use-toast";
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

const paymentSchema = z.object({
  contract_id: z.string().min(1, "契約を選択してください"),
  payment_type: z.enum(["initial", "monthly", "final", "other"]),
  expected_amount: z.string().optional().refine(
    (val) => !val || parseFloat(val) >= 0,
    { message: "予定金額は0以上で入力してください" }
  ),
  actual_amount: z.string().optional().refine(
    (val) => !val || parseFloat(val) >= 0,
    { message: "実績金額は0以上で入力してください" }
  ),
  expected_date: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: "有効な日付を入力してください" }
  ),
  actual_date: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: "有効な日付を入力してください" }
  ),
  status: z.enum(["入金予定", "入金済"]),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  payment?: Payment;
  contracts: ContractOption[];
  trigger: React.ReactNode;
}

export function PaymentDialog({ payment, contracts, trigger }: PaymentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getDefaultValues = () => ({
    contract_id: payment?.contract_id || "",
    payment_type: payment?.payment_type || "initial" as const,
    expected_amount: payment?.expected_amount?.toString() || "",
    actual_amount: payment?.actual_amount?.toString() || "",
    expected_date: payment?.expected_date || "",
    actual_date: payment?.actual_date || "",
    status: payment?.status || "入金予定" as const,
    notes: payment?.notes || "",
  });

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: getDefaultValues(),
  });

  // ダイアログが閉じる時にフォームをリセット
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset(getDefaultValues());
    }
  };

  const onSubmit = async (data: PaymentFormValues) => {
    setLoading(true);

    try {
      const supabase = createClient();

      const paymentData = {
        contract_id: data.contract_id,
        payment_type: data.payment_type,
        expected_amount: data.expected_amount
          ? parseFloat(data.expected_amount)
          : null,
        actual_amount: data.actual_amount
          ? parseFloat(data.actual_amount)
          : null,
        expected_date: data.expected_date || null,
        actual_date: data.actual_date || null,
        status: data.status,
        notes: data.notes || null,
      };

      if (payment) {
        const { error } = await supabase.from("payments").update(paymentData).eq("id", payment.id);
        if (error) throw error;

        toast({
          title: "入金情報を更新しました",
        });
      } else {
        const { error } = await supabase.from("payments").insert(paymentData);
        if (error) throw error;

        toast({
          title: "入金情報を登録しました",
        });
      }

      setOpen(false);
      form.reset(getDefaultValues());
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{payment ? "入金編集" : "新規入金"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>契約 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="契約を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contracts.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id}>
                          {contract.title}
                          {contract.deal?.customer?.company_name &&
                            ` (${contract.deal.customer.company_name})`}
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
              name="payment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>入金種別 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="入金種別を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PAYMENT_TYPE_LABELS).map(
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
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備考</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="備考を入力..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
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
