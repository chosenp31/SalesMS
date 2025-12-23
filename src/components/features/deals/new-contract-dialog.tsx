"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Deal, ContractType, ContractPhase, ContractStatus } from "@/types";
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_PHASE_LABELS,
  PHASE_STATUSES,
  PRODUCT_CATEGORIES_BY_CONTRACT_TYPE,
} from "@/constants";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Plus } from "lucide-react";

// 新しい契約種類のみ
const NEW_CONTRACT_TYPES: ContractType[] = ["property", "line", "maintenance"];

// 新しいフェーズのみ
const NEW_PHASES: ContractPhase[] = [
  "商談中",
  "審査・申込中",
  "下見・工事中",
  "契約中",
  "入金中",
  "請求中",
  "完了",
  "否決",
];

const contractSchema = z.object({
  contract_type: z.string().min(1, "契約種別を選択してください"),
  product_category: z.string().min(1, "商材を選択してください"),
  phase: z.string().min(1, "フェーズを選択してください"),
  status: z.string().min(1, "ステータスを選択してください"),
  monthly_amount: z.string().optional(),
  total_amount: z.string().optional(),
  contract_months: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

interface NewContractDialogProps {
  deal: Deal;
  trigger?: React.ReactNode;
}

export function NewContractDialog({ deal, trigger }: NewContractDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contract_type: "",
      product_category: "",
      phase: "商談中",
      status: "商談待ち",
      monthly_amount: "",
      total_amount: "",
      contract_months: "",
      start_date: "",
      end_date: "",
    },
  });

  const selectedContractType = form.watch("contract_type") as ContractType;
  const selectedPhase = form.watch("phase") as ContractPhase;

  // 契約種別に応じた商材リスト
  const productOptions = useMemo(() => {
    if (!selectedContractType) return [];
    return PRODUCT_CATEGORIES_BY_CONTRACT_TYPE[selectedContractType] || [];
  }, [selectedContractType]);

  // フェーズに応じたステータスリスト
  const statusOptions = useMemo(() => {
    if (!selectedPhase) return [];
    return PHASE_STATUSES[selectedPhase] || [];
  }, [selectedPhase]);

  // 契約種別が変わったら商材をリセット
  const handleContractTypeChange = (value: string) => {
    form.setValue("contract_type", value);
    form.setValue("product_category", "");
  };

  // フェーズが変わったらステータスを最初のものに設定
  const handlePhaseChange = (value: string) => {
    form.setValue("phase", value);
    const statuses = PHASE_STATUSES[value as ContractPhase] || [];
    if (statuses.length > 0) {
      form.setValue("status", statuses[0]);
    }
  };

  // 金額をパース
  const parseAmount = (value: string): number | null => {
    if (!value) return null;
    const num = parseInt(value.replace(/[^\d]/g, ""), 10);
    return isNaN(num) ? null : num;
  };

  // 金額をフォーマット
  const formatAmount = (value: string): string => {
    const num = value.replace(/[^\d]/g, "");
    if (!num) return "";
    return new Intl.NumberFormat("ja-JP").format(parseInt(num));
  };

  const onSubmit = async (data: ContractFormValues) => {
    setLoading(true);

    try {
      const supabase = createClient();

      const contractData = {
        deal_id: deal.id,
        title: `${deal.customer?.company_name || ""} ${CONTRACT_TYPE_LABELS[data.contract_type as ContractType]}`,
        contract_type: data.contract_type as ContractType,
        product_category: data.product_category,
        phase: data.phase as ContractPhase,
        status: data.status as ContractStatus,
        monthly_amount: parseAmount(data.monthly_amount || ""),
        total_amount: parseAmount(data.total_amount || ""),
        contract_months: data.contract_months ? parseInt(data.contract_months) : null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        notes: null,
      };

      const { error } = await supabase.from("contracts").insert(contractData);

      if (error) throw error;

      toast({
        title: "契約を登録しました",
        description: `${contractData.title}を登録しました`,
      });

      setOpen(false);
      form.reset();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            新規契約
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新規契約登録</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 自動設定される情報 */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-gray-500 font-medium mb-2">案件情報</p>
              <p className="text-sm">
                <span className="text-gray-500">顧客:</span>
                <span className="ml-2 font-medium">{deal.customer?.company_name || "-"}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 契約種別 */}
              <FormField
                control={form.control}
                name="contract_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>契約種別 *</FormLabel>
                    <Select onValueChange={handleContractTypeChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NEW_CONTRACT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {CONTRACT_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 商材 */}
              <FormField
                control={form.control}
                name="product_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>商材 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedContractType}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productOptions.map((product) => (
                          <SelectItem key={product} value={product}>
                            {product}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* フェーズ（大分類） */}
              <FormField
                control={form.control}
                name="phase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>フェーズ（大分類）</FormLabel>
                    <Select onValueChange={handlePhaseChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NEW_PHASES.map((phase) => (
                          <SelectItem key={phase} value={phase}>
                            {CONTRACT_PHASE_LABELS[phase]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ステータス（小分類） */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステータス（小分類）</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 月額 */}
              <FormField
                control={form.control}
                name="monthly_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>月額</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例: 10,000"
                        value={field.value ? formatAmount(field.value) : ""}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 総額 */}
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>総額</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例: 100,000"
                        value={field.value ? formatAmount(field.value) : ""}
                        onChange={(e) => field.onChange(e.target.value.replace(/[^\d]/g, ""))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* 契約期間 */}
              <FormField
                control={form.control}
                name="contract_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>契約期間（月）</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="例: 12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 開始日 */}
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

              {/* 終了日 */}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "登録中..." : "登録"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
