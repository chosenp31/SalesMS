"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Customer, Deal, User } from "@/types";
import { useToast } from "@/lib/hooks/use-toast";
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
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const dealSchema = z.object({
  customer_id: z.string().min(1, "顧客を選択してください"),
  assigned_user_id: z.string().min(1, "管理者を選択してください"),
});

const customerSchema = z.object({
  company_name: z.string().min(1, "会社名は必須です"),
  representative_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
  address: z.string().optional(),
  business_type: z.enum(["corporation", "sole_proprietor", "new_corporation"]),
});

type DealFormValues = z.infer<typeof dealSchema>;
type CustomerFormValues = z.infer<typeof customerSchema>;

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

  // オートコンプリート用の状態
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");

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

  // フィルタされたユーザーリスト
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const search = userSearch.toLowerCase();
    return users.filter((user) => user.name.toLowerCase().includes(search));
  }, [users, userSearch]);

  // デフォルトユーザーIDを確保（currentUserIdが空の場合はユーザーリストの最初を使用）
  const effectiveUserId = currentUserId || users[0]?.id || "";

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      customer_id: deal?.customer_id || defaultCustomerId || "",
      assigned_user_id: deal?.assigned_user_id || effectiveUserId,
    },
  });

  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      company_name: "",
      representative_name: "",
      phone: "",
      email: "",
      address: "",
      business_type: "corporation",
    },
  });

  // 顧客登録
  const handleCustomerSubmit = async (data: CustomerFormValues) => {
    setCustomerLoading(true);
    try {
      const supabase = createClient();
      const customerData = {
        company_name: data.company_name,
        representative_name: data.representative_name || "",
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
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

      const dealData = {
        title: dealTitle,
        customer_id: data.customer_id,
        assigned_user_id: data.assigned_user_id,
        status: "active" as const,
        total_amount: null,
      };

      if (deal) {
        // 更新
        const { error: updateError } = await supabase
          .from("deals")
          .update(dealData)
          .eq("id", deal.id);

        if (updateError) throw updateError;

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

                {/* 管理者選択（オートコンプリート） */}
                <FormField
                  control={form.control}
                  name="assigned_user_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>管理者 *</FormLabel>
                      <Popover open={userOpen} onOpenChange={setUserOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={userOpen}
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? users.find((u) => u.id === field.value)?.name
                                : "管理者名を入力して検索..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="管理者名で検索..."
                              value={userSearch}
                              onValueChange={setUserSearch}
                            />
                            <CommandList>
                              <CommandEmpty>管理者が見つかりません</CommandEmpty>
                              <CommandGroup>
                                {filteredUsers.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={user.id}
                                    onSelect={() => {
                                      field.onChange(user.id);
                                      setUserOpen(false);
                                      setUserSearch("");
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>顧客を新規登録</DialogTitle>
            <DialogDescription>
              新しい顧客情報を入力してください。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">会社名 *</label>
                <Input
                  {...customerForm.register("company_name")}
                  placeholder="株式会社サンプル"
                />
                {customerForm.formState.errors.company_name && (
                  <p className="text-sm text-red-600 mt-1">
                    {customerForm.formState.errors.company_name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">代表者名</label>
                <Input
                  {...customerForm.register("representative_name")}
                  placeholder="山田 太郎"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">電話番号</label>
                  <Input
                    {...customerForm.register("phone")}
                    placeholder="03-1234-5678"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">メールアドレス</label>
                  <Input
                    {...customerForm.register("email")}
                    type="email"
                    placeholder="info@example.com"
                  />
                  {customerForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {customerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">住所</label>
                <Input
                  {...customerForm.register("address")}
                  placeholder="東京都千代田区..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">事業形態</label>
                <Select
                  onValueChange={(value) =>
                    customerForm.setValue("business_type", value as "corporation" | "sole_proprietor" | "new_corporation")
                  }
                  defaultValue="corporation"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="事業形態を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporation">法人</SelectItem>
                    <SelectItem value="sole_proprietor">個人事業主</SelectItem>
                    <SelectItem value="new_corporation">新設法人</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCustomerDialogOpen(false);
                  customerForm.reset();
                }}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={customerLoading}>
                {customerLoading ? "登録中..." : "登録"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
