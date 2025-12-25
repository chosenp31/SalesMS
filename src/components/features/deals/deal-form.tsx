"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Customer, Deal, User } from "@/types";
import { BUSINESS_TYPE_LABELS } from "@/constants";
import { useToast } from "@/lib/hooks/use-toast";
import { recordCreate, recordUpdate } from "@/lib/history";
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
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// 電話番号のバリデーション（ハイフンあり・なし両対応）
const phoneRegex = /^(0\d{1,4}-?\d{1,4}-?\d{3,4})$/;

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

const dealSchema = z.object({
  customer_id: z.string().min(1, "顧客を選択してください"),
  sales_user_id: z.string().min(1, "営業担当者を選択してください"),
  appointer_user_id: z.string().min(1, "アポインターを選択してください"),
});

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

type DealFormValues = z.infer<typeof dealSchema>;
type CustomerFormValues = z.infer<typeof customerSchema>;

// 履歴記録対象フィールド
const TRACKED_FIELDS = [
  "title",
  "customer_id",
  "sales_user_id",
  "appointer_user_id",
  "status",
  "description",
  "total_amount",
];

interface DealFormProps {
  deal?: Deal;
  customers: Customer[];
  users: User[];
  defaultCustomerId?: string;
  currentUserId?: string;
}

export function DealForm({
  deal,
  customers: initialCustomers,
  users,
  defaultCustomerId,
  currentUserId,
}: DealFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // オートコンプリート用の状態
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [salesUserOpen, setSalesUserOpen] = useState(false);
  const [salesUserSearch, setSalesUserSearch] = useState("");
  const [appointerOpen, setAppointerOpen] = useState(false);
  const [appointerSearch, setAppointerSearch] = useState("");

  // フィルタされた顧客リスト
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.company_name.toLowerCase().includes(search) ||
        customer.representative_name?.toLowerCase().includes(search)
    );
  }, [customers, customerSearch]);

  // フィルタされた営業担当者リスト
  const filteredSalesUsers = useMemo(() => {
    if (!salesUserSearch) return users;
    const search = salesUserSearch.toLowerCase();
    return users.filter((user) => user.name.toLowerCase().includes(search));
  }, [users, salesUserSearch]);

  // フィルタされたアポインターリスト
  const filteredAppointers = useMemo(() => {
    if (!appointerSearch) return users;
    const search = appointerSearch.toLowerCase();
    return users.filter((user) => user.name.toLowerCase().includes(search));
  }, [users, appointerSearch]);

  // デフォルトユーザーIDを確保（currentUserIdが空の場合はユーザーリストの最初を使用）
  const effectiveUserId = currentUserId || users[0]?.id || "";

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      customer_id: deal?.customer_id || defaultCustomerId || "",
      // 新スキーマ（sales_user_id/appointer_user_id）と旧スキーマ（assigned_user_id）の両方に対応
      sales_user_id: deal?.sales_user_id || deal?.assigned_user_id || effectiveUserId,
      appointer_user_id: deal?.appointer_user_id || deal?.assigned_user_id || effectiveUserId,
    },
  });

  const customerForm = useForm<CustomerFormValues>({
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
        customerForm.setValue("address", address);
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
  }, [customerForm, toast]);

  // 電話番号入力ハンドラ
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    customerForm.setValue("phone", formatted);
  };

  // 郵便番号入力ハンドラ
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value);
    customerForm.setValue("postal_code", formatted);

    // 7桁入力されたら自動で住所検索
    if (formatted.replace(/-/g, "").length === 7) {
      fetchAddress(formatted);
    }
  };

  // 顧客登録
  const handleCustomerSubmit = async (data: CustomerFormValues) => {
    setCustomerLoading(true);
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

      // 顧客リストを更新
      setCustomers((prev) => [...prev, newCustomer as Customer]);
      // フォームに新しい顧客を設定
      form.setValue("customer_id", newCustomer.id);

      toast({
        title: "顧客を登録しました",
        description: `${data.company_name}を新規登録しました`,
      });

      setIsCustomerDialogOpen(false);
      customerForm.reset();
    } catch (err) {
      toast({
        title: "エラーが発生しました",
        description: err instanceof Error ? err.message : "顧客登録中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setCustomerLoading(false);
    }
  };

  const onSubmit = async (data: DealFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const selectedCustomer = customers.find((c) => c.id === data.customer_id);

      // 案件タイトルを自動生成（顧客名）
      const dealTitle = deal?.title || selectedCustomer?.company_name || "";

      // 新スキーマ（sales_user_id/appointer_user_id）を使用
      const dealData = {
        title: dealTitle,
        customer_id: data.customer_id,
        sales_user_id: data.sales_user_id,
        appointer_user_id: data.appointer_user_id,
        status: "active" as const,
      };

      if (deal) {
        // 更新
        const { error: updateError } = await supabase
          .from("deals")
          .update(dealData)
          .eq("id", deal.id);

        if (updateError) throw updateError;

        // 履歴を記録
        await recordUpdate(
          supabase,
          "deal",
          deal.id,
          currentUserId || null,
          deal as Record<string, unknown>,
          dealData as Record<string, unknown>,
          TRACKED_FIELDS
        );

        toast({
          title: "案件を更新しました",
          description: `${dealTitle}の情報を更新しました`,
        });

        router.push(`/deals/${deal.id}`);
      } else {
        // 新規登録
        const { data: newDeal, error: insertError } = await supabase
          .from("deals")
          .insert(dealData)
          .select()
          .single();

        if (insertError) throw insertError;

        // 履歴を記録
        if (newDeal) {
          await recordCreate(supabase, "deal", newDeal.id, currentUserId || null);
        }

        toast({
          title: "案件を登録しました",
          description: `${dealTitle}を登録しました`,
        });

        // 案件詳細ページに遷移
        router.push(`/deals/${newDeal.id}`);
      }

      router.refresh();
    } catch (err) {
      console.error("案件登録エラー:", err);
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
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
                {/* 顧客選択（オートコンプリート） */}
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>顧客名 *</FormLabel>
                      <div className="flex gap-2">
                        <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={customerOpen}
                                className={cn(
                                  "flex-1 justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? customers.find((c) => c.id === field.value)?.company_name
                                  : "顧客名を入力して検索..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="顧客名で検索..."
                                value={customerSearch}
                                onValueChange={setCustomerSearch}
                              />
                              <CommandList>
                                <CommandEmpty>顧客が見つかりません</CommandEmpty>
                                <CommandGroup>
                                  {filteredCustomers.slice(0, 50).map((customer) => (
                                    <CommandItem
                                      key={customer.id}
                                      value={customer.id}
                                      onSelect={() => {
                                        field.onChange(customer.id);
                                        setCustomerOpen(false);
                                        setCustomerSearch("");
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === customer.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span>{customer.company_name}</span>
                                        {customer.representative_name && (
                                          <span className="text-xs text-muted-foreground">
                                            {customer.representative_name}
                                          </span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsCustomerDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 営業担当者選択（オートコンプリート） */}
                <FormField
                  control={form.control}
                  name="sales_user_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>営業担当者 *</FormLabel>
                      <Popover open={salesUserOpen} onOpenChange={setSalesUserOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={salesUserOpen}
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? users.find((u) => u.id === field.value)?.name
                                : "営業担当者を選択..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="営業担当者名で検索..."
                              value={salesUserSearch}
                              onValueChange={setSalesUserSearch}
                            />
                            <CommandList>
                              <CommandEmpty>ユーザーが見つかりません</CommandEmpty>
                              <CommandGroup>
                                {filteredSalesUsers.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={user.id}
                                    onSelect={() => {
                                      field.onChange(user.id);
                                      setSalesUserOpen(false);
                                      setSalesUserSearch("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === user.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {user.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* アポインター選択（オートコンプリート） */}
                <FormField
                  control={form.control}
                  name="appointer_user_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>アポインター *</FormLabel>
                      <Popover open={appointerOpen} onOpenChange={setAppointerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={appointerOpen}
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? users.find((u) => u.id === field.value)?.name
                                : "アポインターを選択..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="アポインター名で検索..."
                              value={appointerSearch}
                              onValueChange={setAppointerSearch}
                            />
                            <CommandList>
                              <CommandEmpty>ユーザーが見つかりません</CommandEmpty>
                              <CommandGroup>
                                {filteredAppointers.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={user.id}
                                    onSelect={() => {
                                      field.onChange(user.id);
                                      setAppointerOpen(false);
                                      setAppointerSearch("");
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === user.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {user.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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

      {/* 顧客登録ダイアログ */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>顧客を新規登録</DialogTitle>
            <DialogDescription>
              新しい顧客情報を入力してください。<span className="text-red-500">*</span> は必須項目です。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 会社名 */}
              <div className="col-span-2">
                <label className="text-sm font-medium">
                  会社名 <span className="text-red-500">*</span>
                </label>
                <Input
                  {...customerForm.register("company_name")}
                  placeholder="株式会社サンプル"
                  className="mt-1"
                />
                {customerForm.formState.errors.company_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {customerForm.formState.errors.company_name.message}
                  </p>
                )}
              </div>

              {/* 代表者名 */}
              <div>
                <label className="text-sm font-medium">
                  代表者名 <span className="text-red-500">*</span>
                </label>
                <Input
                  {...customerForm.register("representative_name")}
                  placeholder="山田 太郎"
                  className="mt-1"
                />
                {customerForm.formState.errors.representative_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {customerForm.formState.errors.representative_name.message}
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
                    customerForm.setValue("business_type", value as "corporation" | "sole_proprietor" | "new_corporation")
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
                  value={customerForm.watch("phone")}
                  onChange={handlePhoneChange}
                  placeholder="03-1234-5678"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  固定電話・携帯電話どちらも可
                </p>
                {customerForm.formState.errors.phone && (
                  <p className="text-sm text-red-600 mt-1">
                    {customerForm.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {/* メールアドレス */}
              <div>
                <label className="text-sm font-medium">メールアドレス</label>
                <Input
                  {...customerForm.register("email")}
                  type="email"
                  placeholder="info@example.com"
                  className="mt-1"
                />
                {customerForm.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {customerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* 郵便番号 */}
              <div>
                <label className="text-sm font-medium">郵便番号</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={customerForm.watch("postal_code")}
                    onChange={handlePostalCodeChange}
                    placeholder="123-4567"
                    className="flex-1"
                    maxLength={8}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fetchAddress(customerForm.getValues("postal_code") || "")}
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
                  {...customerForm.register("address")}
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
                  customerForm.reset();
                  setIsCustomerDialogOpen(false);
                }}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={customerLoading}>
                {customerLoading ? (
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
    </>
  );
}
