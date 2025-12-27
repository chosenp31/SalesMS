"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Customer } from "@/types";
import { BUSINESS_TYPE_LABELS } from "@/constants";
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

const customerSchema = z.object({
  company_name: z.string().min(1, "会社名は必須です"),
  representative_name: z.string().min(1, "代表者名は必須です"),
  business_type: z.enum(["corporation", "sole_proprietor", "new_corporation"]),
  phone: z.string().optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
  address: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  currentUserId?: string;
}

// 履歴記録対象フィールド
const TRACKED_FIELDS = [
  "company_name",
  "representative_name",
  "business_type",
  "phone",
  "email",
  "address",
];

export function CustomerForm({ customer, currentUserId }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      company_name: customer?.company_name || "",
      representative_name: customer?.representative_name || "",
      business_type: customer?.business_type || "corporation",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address: customer?.address || "",
    },
  });

  // 未保存変更の警告
  const {
    showDialog: showUnsavedDialog,
    setShowDialog: setShowUnsavedDialog,
    confirmNavigation,
    cancelNavigation,
  } = useUnsavedChangesWarning({ isDirty: form.formState.isDirty });

  const onSubmit = async (data: CustomerFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const customerData = {
        ...data,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      };

      if (customer) {
        const { error: updateError } = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", customer.id);

        if (updateError) {
          throw updateError;
        }

        // 履歴を記録
        await recordUpdate(
          supabase,
          "customer",
          customer.id,
          currentUserId || null,
          customer as Record<string, unknown>,
          customerData as Record<string, unknown>,
          TRACKED_FIELDS
        );

        toast({
          title: "顧客情報を更新しました",
          description: `${data.company_name}の情報を更新しました`,
        });
      } else {
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert(customerData)
          .select("id")
          .single();

        if (insertError) {
          throw insertError;
        }

        // 履歴を記録
        if (newCustomer) {
          await recordCreate(supabase, "customer", newCustomer.id, currentUserId || null);
        }

        toast({
          title: "顧客を登録しました",
          description: `${data.company_name}を新規登録しました`,
        });
      }

      router.push("/customers");
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
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>会社名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="株式会社サンプル" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="representative_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>代表者名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="山田 太郎" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="business_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>事業形態 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="事業形態を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(BUSINESS_TYPE_LABELS).map(
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電話番号</FormLabel>
                    <FormControl>
                      <Input placeholder="03-1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@company.com"
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>住所</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="東京都渋谷区..."
                      className="resize-none"
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
                {loading ? "保存中..." : customer ? "更新" : "登録"}
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
