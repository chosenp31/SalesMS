"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/database";
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STEP_LABELS,
  PRODUCT_CATEGORIES,
  LEASE_COMPANIES,
  CONTRACT_MONTHS_OPTIONS,
  STEP_TO_STAGE,
} from "@/constants";
import { useToast } from "@/lib/hooks/use-toast";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import { recordCreate, recordUpdate } from "@/lib/history";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// 金額をフォーマット（カンマ区切り、小数対応）
const formatAmount = (value: string): string => {
  // 数字と小数点のみ抽出
  const num = value.replace(/[^\d.]/g, "");
  if (!num) return "";

  // 小数点を含む場合
  if (num.includes(".")) {
    const [integer, decimal] = num.split(".");
    const formattedInteger = new Intl.NumberFormat("ja-JP").format(parseInt(integer || "0"));
    return decimal !== undefined ? `${formattedInteger}.${decimal}` : formattedInteger;
  }

  return new Intl.NumberFormat("ja-JP").format(parseInt(num));
};

// カンマを除去して数値文字列に変換（小数対応）
const parseAmount = (value: string): string => {
  // 数字と小数点のみ抽出
  return value.replace(/[^\d.]/g, "");
};

const contractSchema = z.object({
  title: z.string().min(1, "契約名は必須です"),
  contract_type: z.string().min(1, "契約種別を選択してください"),
  product_category: z.string().optional(),
  lease_company: z.string().optional(),
  step: z.string().min(1, "ステップを選択してください"),
  monthly_amount: z.string().optional().refine(
    (val) => !val || (parseFloat(val) >= 0),
    { message: "月額は0以上で入力してください" }
  ),
  total_amount: z.string().optional().refine(
    (val) => !val || (parseFloat(val) >= 0),
    { message: "合計金額は0以上で入力してください" }
  ),
  contract_months: z.string().optional(),
  start_date: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: "有効な日付を入力してください" }
  ),
  end_date: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: "有効な日付を入力してください" }
  ),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  { message: "終了日は開始日以降の日付を指定してください", path: ["end_date"] }
);

type ContractFormValues = z.infer<typeof contractSchema>;

// 履歴記録対象フィールド
const TRACKED_FIELDS = [
  "title",
  "contract_type",
  "product_category",
  "lease_company",
  "stage",
  "step",
  "monthly_amount",
  "total_amount",
  "contract_months",
  "start_date",
  "end_date",
  "notes",
];

interface ContractFormProps {
  dealId: string;
  contract?: Tables<"contracts">;
  currentUserId?: string;
}

export function ContractForm({ dealId, contract, currentUserId }: ContractFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      title: contract?.title || "",
      contract_type: contract?.contract_type || "lease",
      product_category: contract?.product_category || "",
      lease_company: contract?.lease_company || "",
      step: contract?.step || "商談待ち",
      monthly_amount: contract?.monthly_amount?.toString() || "",
      total_amount: contract?.total_amount?.toString() || "",
      contract_months: contract?.contract_months?.toString() || "",
      start_date: contract?.start_date?.split("T")[0] || "",
      end_date: contract?.end_date?.split("T")[0] || "",
      notes: contract?.notes || "",
    },
  });

  // 未保存変更の警告
  const {
    showDialog: showUnsavedDialog,
    setShowDialog: setShowUnsavedDialog,
    confirmNavigation,
    cancelNavigation,
  } = useUnsavedChangesWarning({ isDirty: form.formState.isDirty });

  const onSubmit = async (data: ContractFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // ステップからステージを自動計算
      const stage = STEP_TO_STAGE[data.step] || "商談中";

      const contractData = {
        deal_id: dealId,
        title: data.title,
        contract_type: data.contract_type,
        product_category: data.product_category || null,
        lease_company: data.lease_company || null,
        stage: stage,
        step: data.step,
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
        const { error: updateError } = await supabase
          .from("contracts")
          .update(contractData)
          .eq("id", contract.id);

        if (updateError) {
          throw updateError;
        }

        // 履歴を記録
        await recordUpdate(
          supabase,
          "contract",
          contract.id,
          currentUserId || null,
          contract as Record<string, unknown>,
          contractData as Record<string, unknown>,
          TRACKED_FIELDS
        );

        toast({
          title: "契約を更新しました",
          description: `${data.title}の情報を更新しました`,
        });
        router.push(`/contracts/${contract.id}`);
      } else {
        const { data: newContract, error: insertError } = await supabase
          .from("contracts")
          .insert(contractData)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // 履歴を記録
        if (newContract) {
          await recordCreate(supabase, "contract", newContract.id, currentUserId || null);
        }

        toast({
          title: "契約を登録しました",
          description: `${data.title}を新規登録しました`,
        });
        router.push(`/contracts/${newContract.id}`);
      }

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
    <>
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
                      value={field.value}
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
                      value={field.value || ""}
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
                      value={field.value || ""}
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
                name="step"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステップ *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="ステップを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CONTRACT_STEP_LABELS).map(
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
                      value={field.value || ""}
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
                      <Input
                        placeholder="50,000"
                        value={formatAmount(field.value || "")}
                        onChange={(e) => {
                          const raw = parseAmount(e.target.value);
                          field.onChange(raw);
                        }}
                      />
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
                      <Input
                        placeholder="3,000,000"
                        value={formatAmount(field.value || "")}
                        onChange={(e) => {
                          const raw = parseAmount(e.target.value);
                          field.onChange(raw);
                        }}
                      />
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

    {/* 未保存変更の警告ダイアログ */}
    <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>保存されていない変更があります</AlertDialogTitle>
          <AlertDialogDescription>
            このページを離れると、入力した内容が失われます。本当に離れますか？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelNavigation}>
            このページに留まる
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmNavigation}>
            変更を破棄して離れる
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
