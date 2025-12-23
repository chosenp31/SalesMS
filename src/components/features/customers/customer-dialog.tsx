"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Customer } from "@/types";
import { BUSINESS_TYPE_LABELS } from "@/constants";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

// 電話番号のバリデーション（ハイフンあり・なし両対応）
const phoneRegex = /^(0\d{1,4}-?\d{1,4}-?\d{3,4})$/;

const customerSchema = z.object({
  company_name: z.string().min(1, "会社名は必須です"),
  representative_name: z.string().min(1, "代表者名は必須です"),
  phone: z.string()
    .min(1, "電話番号は必須です")
    .regex(phoneRegex, "有効な電話番号を入力してください（例：03-1234-5678、090-1234-5678）"),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
  postal_code: z.string().optional(),
  address: z.string().optional(),
  business_type: z.enum(["corporation", "sole_proprietor", "new_corporation"]),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customer: Customer) => void;
}

// 電話番号のフォーマット関数
const formatPhoneNumber = (value: string): string => {
  // 数字以外を削除
  const numbers = value.replace(/[^\d]/g, "");

  if (numbers.length === 0) return "";

  // 携帯電話（090, 080, 070, 050で始まる11桁）
  if (/^(090|080|070|050)/.test(numbers)) {
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }

  // 固定電話（東京03など2桁市外局番）
  if (/^0[3-9]/.test(numbers) && !numbers.startsWith("03") === false) {
    if (numbers.startsWith("03") || numbers.startsWith("06") ||
        numbers.startsWith("011") || numbers.startsWith("022") ||
        numbers.startsWith("033") || numbers.startsWith("044") ||
        numbers.startsWith("045") || numbers.startsWith("048") ||
        numbers.startsWith("052") || numbers.startsWith("075") ||
        numbers.startsWith("078") || numbers.startsWith("082") ||
        numbers.startsWith("092") || numbers.startsWith("093")) {
      // 2桁市外局番
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
  }

  // その他の固定電話（3桁または4桁市外局番）
  if (numbers.length <= 4) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 10)}`;
};

// 郵便番号のフォーマット関数
const formatPostalCode = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, "");
  if (numbers.length <= 3) return numbers;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}`;
};

export function CustomerDialog({ open, onOpenChange, onSuccess }: CustomerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      company_name: "",
      representative_name: "",
      phone: "",
      email: "",
      postal_code: "",
      address: "",
      business_type: "corporation",
    },
  });

  // 郵便番号から住所を取得
  const fetchAddress = useCallback(async (postalCode: string) => {
    const cleanCode = postalCode.replace(/-/g, "");
    if (cleanCode.length !== 7) return;

    setAddressLoading(true);
    try {
      const response = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanCode}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const address = `${result.address1}${result.address2}${result.address3}`;
        form.setValue("address", address);
        toast({
          title: "住所を取得しました",
          description: address,
        });
      } else {
        toast({
          title: "住所が見つかりませんでした",
          description: "郵便番号を確認してください",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "住所の取得に失敗しました",
        description: "もう一度お試しください",
        variant: "destructive",
      });
    } finally {
      setAddressLoading(false);
    }
  }, [form, toast]);

  // 電話番号入力ハンドラ
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    form.setValue("phone", formatted);
  };

  // 郵便番号入力ハンドラ
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value);
    form.setValue("postal_code", formatted);

    // 7桁入力されたら自動で住所検索
    if (formatted.replace(/-/g, "").length === 7) {
      fetchAddress(formatted);
    }
  };

  const onSubmit = async (data: CustomerFormValues) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const customerData = {
        company_name: data.company_name,
        representative_name: data.representative_name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.postal_code
          ? `〒${data.postal_code} ${data.address || ""}`
          : data.address || null,
        business_type: data.business_type,
      };

      const { data: newCustomer, error: insertError } = await supabase
        .from("customers")
        .insert(customerData)
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "顧客を登録しました",
        description: `${data.company_name}を新規登録しました`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.(newCustomer as Customer);
    } catch (err) {
      toast({
        title: "エラーが発生しました",
        description: err instanceof Error ? err.message : "顧客登録中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>顧客を新規登録</DialogTitle>
          <DialogDescription>
            新しい顧客情報を入力してください。<span className="text-red-500">*</span> は必須項目です。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 会社名 */}
            <div className="col-span-2">
              <label className="text-sm font-medium">
                会社名 <span className="text-red-500">*</span>
              </label>
              <Input
                {...form.register("company_name")}
                placeholder="株式会社サンプル"
                className="mt-1"
              />
              {form.formState.errors.company_name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.company_name.message}
                </p>
              )}
            </div>

            {/* 代表者名 */}
            <div>
              <label className="text-sm font-medium">
                代表者名 <span className="text-red-500">*</span>
              </label>
              <Input
                {...form.register("representative_name")}
                placeholder="山田 太郎"
                className="mt-1"
              />
              {form.formState.errors.representative_name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.representative_name.message}
                </p>
              )}
            </div>

            {/* 事業形態 */}
            <div>
              <label className="text-sm font-medium">
                事業形態 <span className="text-red-500">*</span>
              </label>
              <Select
                onValueChange={(value) =>
                  form.setValue("business_type", value as "corporation" | "sole_proprietor" | "new_corporation")
                }
                defaultValue="corporation"
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="事業形態を選択" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 電話番号 */}
            <div>
              <label className="text-sm font-medium">
                電話番号 <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.watch("phone")}
                onChange={handlePhoneChange}
                placeholder="03-1234-5678"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                固定電話・携帯電話どちらも可
              </p>
              {form.formState.errors.phone && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            {/* メールアドレス */}
            <div>
              <label className="text-sm font-medium">メールアドレス</label>
              <Input
                {...form.register("email")}
                type="email"
                placeholder="info@example.com"
                className="mt-1"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* 郵便番号 */}
            <div>
              <label className="text-sm font-medium">郵便番号</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={form.watch("postal_code")}
                  onChange={handlePostalCodeChange}
                  placeholder="123-4567"
                  className="flex-1"
                  maxLength={8}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fetchAddress(form.getValues("postal_code") || "")}
                  disabled={addressLoading}
                >
                  {addressLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                7桁入力で自動検索
              </p>
            </div>

            {/* 住所 */}
            <div className="col-span-2">
              <label className="text-sm font-medium">住所</label>
              <Input
                {...form.register("address")}
                placeholder="東京都千代田区..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onOpenChange(false);
              }}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  登録中...
                </>
              ) : (
                "登録"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
