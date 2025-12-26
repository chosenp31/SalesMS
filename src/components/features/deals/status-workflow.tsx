"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_PHASE_LABELS,
  STATUS_TO_PHASE,
  PHASE_STATUSES,
  STATUS_DETAILS,
  STATUS_COMPLETION_MESSAGES,
} from "@/constants";
import { createClient } from "@/lib/supabase/client";
import { recordStatusChange } from "@/lib/history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, ChevronLeft, Info, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";

// StatusWorkflowが必要とする最小限の契約情報
interface ContractForWorkflow {
  id: string;
  status: string;  // 新旧両方の値に対応
  deal_id?: string;
}

interface StatusWorkflowProps {
  contract: ContractForWorkflow;
  currentUserId: string;
}

// 新しいフェーズ順序
const phaseOrder = ["商談中", "審査・申込中", "下見・工事中", "契約中", "入金中", "請求中"];

// 旧フェーズから新フェーズへのマッピング
const phaseMapping: Record<string, string> = {
  審査中: "審査・申込中",
  工事中: "下見・工事中",
};

const phaseColors: Record<string, { bg: string; border: string; text: string; active: string }> = {
  商談中: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    active: "bg-blue-500",
  },
  "審査・申込中": {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    active: "bg-yellow-500",
  },
  "下見・工事中": {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    active: "bg-purple-500",
  },
  契約中: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-800",
    active: "bg-indigo-500",
  },
  入金中: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    active: "bg-green-500",
  },
  請求中: {
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-800",
    active: "bg-teal-500",
  },
  完了: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-800",
    active: "bg-gray-500",
  },
  否決: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    active: "bg-red-500",
  },
  // 旧フェーズ（後方互換性）
  審査中: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    active: "bg-yellow-500",
  },
  工事中: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    active: "bg-purple-500",
  },
  失注: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    active: "bg-red-500",
  },
  クローズ: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-800",
    active: "bg-gray-500",
  },
};

// ステータスツールチップコンポーネント
function StatusTooltip({ status, children }: { status: string; children: React.ReactNode }) {
  const details = STATUS_DETAILS[status];

  if (!details) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <div className="space-y-2">
            <p className="font-medium text-sm">{CONTRACT_STATUS_LABELS[status] || status}</p>
            <p className="text-xs text-gray-600">{details.description}</p>
            {details.note && (
              <p className="text-xs text-gray-500 italic">{details.note}</p>
            )}
            <div className="pt-1 border-t">
              <p className="text-xs">
                <span className="font-medium text-primary">次のアクション:</span>{" "}
                {details.action}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function StatusWorkflow({ contract, currentUserId }: StatusWorkflowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    targetStatus: string;
    message: string;
    comment: string;
  }>({
    open: false,
    targetStatus: "",
    message: "",
    comment: "",
  });

  // 現在のフェーズを取得（旧フェーズの場合はマッピングする）
  let currentPhase = STATUS_TO_PHASE[contract.status] || "商談中";
  if (phaseMapping[currentPhase]) {
    currentPhase = phaseMapping[currentPhase];
  }

  const currentPhaseIndex = phaseOrder.indexOf(currentPhase);
  const currentPhaseStatuses = PHASE_STATUSES[currentPhase] || [];
  const colors = phaseColors[currentPhase] || phaseColors["商談中"];

  // ステータス更新処理
  const updateStatus = async (newStatus: string, comment?: string) => {
    setLoading(true);
    const supabase = createClient();

    // 新しいフェーズを取得
    const newPhase = STATUS_TO_PHASE[newStatus] || currentPhase;
    const previousStatus = contract.status;
    const previousPhase = currentPhase;

    // 契約ステータスを更新
    const { error } = await supabase
      .from("contracts")
      .update({ status: newStatus, phase: newPhase })
      .eq("id", contract.id);

    if (error) {
      console.error("Error updating status:", error);
    } else {
      // ステータス変更履歴を記録（entity_historyに統一）
      const historyResult = await recordStatusChange(
        supabase,
        contract.id,
        currentUserId || null,
        previousPhase,
        newPhase,
        previousStatus,
        newStatus,
        comment
      );

      if (!historyResult.success) {
        console.error("Error recording status history:", historyResult.error);
      }

      // 活動履歴にもステータス変更を記録
      const statusChangeContent = `ステータスを変更しました\n${CONTRACT_STATUS_LABELS[previousStatus] || previousStatus} → ${CONTRACT_STATUS_LABELS[newStatus] || newStatus}${comment ? `\n\nコメント: ${comment}` : ""}`;

      const { error: activityError } = await supabase.from("activities").insert({
        user_id: currentUserId,
        activity_type: "status_change",
        contract_id: contract.id,
        content: statusChangeContent,
        is_status_change: true,
        status_change_id: null, // entity_historyに統合されたため不要
      });

      if (activityError) {
        console.error("Error recording activity:", activityError);
      }

      // Contract完了時にDealステータス自動更新
      if (newStatus === "クローズ" && contract.deal_id) {
        // 同じDealの他の契約を取得
        const { data: otherContracts } = await supabase
          .from("contracts")
          .select("id, status")
          .eq("deal_id", contract.deal_id)
          .neq("id", contract.id);

        // 全ての契約がクローズまたは失注の場合、Dealを成約に更新
        const allContractsCompleted = !otherContracts || otherContracts.every(
          (c) => c.status === "クローズ" || c.status === "失注"
        );

        if (allContractsCompleted) {
          await supabase
            .from("deals")
            .update({ status: "won" })
            .eq("id", contract.deal_id);
        }
      }

      // Contract失注時にDealステータス自動更新（全て失注の場合）
      if (newStatus === "失注" && contract.deal_id) {
        const { data: allContracts } = await supabase
          .from("contracts")
          .select("id, status")
          .eq("deal_id", contract.deal_id);

        // 全ての契約が失注の場合、Dealも失注に更新
        const allContractsLost = allContracts && allContracts.every(
          (c) => c.id === contract.id ? true : c.status === "失注"
        );

        if (allContractsLost) {
          await supabase
            .from("deals")
            .update({ status: "lost" })
            .eq("id", contract.deal_id);
        }
      }
    }

    setLoading(false);
    setConfirmDialog({ open: false, targetStatus: "", message: "", comment: "" });
    router.refresh();
  };

  // 確認ダイアログを開く
  const openConfirmDialog = (targetStatus: string) => {
    const message = STATUS_COMPLETION_MESSAGES[contract.status] || `${CONTRACT_STATUS_LABELS[targetStatus] || targetStatus}に進みますか？`;
    setConfirmDialog({
      open: true,
      targetStatus,
      message,
      comment: "",
    });
  };

  // 現在のステータスの次のステータスを取得
  const getNextStatus = () => {
    const currentStatusIndex = currentPhaseStatuses.indexOf(contract.status);

    // 現在のフェーズ内に次のステータスがある場合
    if (currentStatusIndex >= 0 && currentStatusIndex < currentPhaseStatuses.length - 1) {
      return currentPhaseStatuses[currentStatusIndex + 1];
    }

    // 次のフェーズの最初のステータス
    if (currentPhaseIndex >= 0 && currentPhaseIndex < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentPhaseIndex + 1];
      const nextPhaseStatuses = PHASE_STATUSES[nextPhase];
      if (nextPhaseStatuses && nextPhaseStatuses.length > 0) {
        return nextPhaseStatuses[0];
      }
    }

    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            契約ステータス
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">各ステータスにカーソルを合わせると詳細が表示されます</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Phase Progress */}
          <div className="flex items-center justify-between mb-6 overflow-x-auto">
            {phaseOrder.map((phase, index) => {
              const isCompleted = index < currentPhaseIndex;
              const isCurrent = index === currentPhaseIndex;
              const phaseColor = phaseColors[phase] || phaseColors["商談中"];

              return (
                <div key={phase} className="flex items-center flex-1 min-w-[80px]">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2",
                        isCompleted && `${phaseColor.active} border-transparent`,
                        isCurrent && `${phaseColor.bg} ${phaseColor.border}`,
                        !isCompleted && !isCurrent && "bg-gray-100 border-gray-200"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isCurrent ? phaseColor.text : "text-gray-400"
                          )}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-xs font-medium text-center",
                        isCurrent ? phaseColor.text : "text-gray-500"
                      )}
                    >
                      {CONTRACT_PHASE_LABELS[phase] || phase}
                    </span>
                  </div>
                  {index < phaseOrder.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-gray-300 mx-1 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Phase Statuses - 表示のみ（変更は下のボタンで行う） */}
          {currentPhaseStatuses.length > 0 && (
            <div className={cn("p-4 rounded-lg", colors.bg)}>
              <h4 className={cn("text-sm font-medium mb-3", colors.text)}>
                {CONTRACT_PHASE_LABELS[currentPhase] || currentPhase}のステータス
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentPhaseStatuses.map((status) => {
                  const isCurrentStatus = contract.status === status;
                  return (
                    <StatusTooltip key={status} status={status}>
                      <div
                        className={cn(
                          "inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3",
                          isCurrentStatus
                            ? `${colors.active} text-white`
                            : `border ${colors.border} bg-white/80 ${colors.text}`
                        )}
                      >
                        {CONTRACT_STATUS_LABELS[status] || status}
                      </div>
                    </StatusTooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next Status Button - 請求中フェーズでは次のフェーズへの進行をブロック */}
          {nextStatus && currentPhase !== "請求中" && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">
                次のステータスに進む場合は、以下のボタンをクリックしてください。
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => openConfirmDialog(nextStatus)}
              >
                {CONTRACT_STATUS_LABELS[nextStatus] || nextStatus}へ進む
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* 請求中フェーズ → 完了への遷移 */}
          {currentPhase === "請求中" && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">
                請求が完了したら、案件をクローズしてください。
              </p>
              <StatusTooltip status="クローズ">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || contract.status === "クローズ"}
                  onClick={() => openConfirmDialog("クローズ")}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <Check className="h-4 w-4 mr-1" />
                  案件を完了する
                </Button>
              </StatusTooltip>
            </div>
          )}

          {/* 否決へ変更 */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">
              否決の場合
            </p>
            <div className="flex gap-2">
              <StatusTooltip status="対応検討中">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || contract.status === "対応検討中"}
                  onClick={() => openConfirmDialog("対応検討中")}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  対応検討中
                </Button>
              </StatusTooltip>
              <StatusTooltip status="失注">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || contract.status === "失注"}
                  onClick={() => openConfirmDialog("失注")}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  失注
                </Button>
              </StatusTooltip>
            </div>
          </div>

          {/* バックフロー - 前のフェーズ/ステータスに戻す */}
          {currentPhaseIndex > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">
                前のフェーズに戻す場合
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="text-gray-600"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    前のステータスに戻す
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {phaseOrder.slice(0, currentPhaseIndex + 1).map((phase) => {
                    const phaseStatuses = PHASE_STATUSES[phase];
                    if (!phaseStatuses || phaseStatuses.length === 0) return null;
                    const phaseColor = phaseColors[phase] || phaseColors["商談中"];
                    const isCurrentPhase = phase === currentPhase;

                    return (
                      <DropdownMenuSub key={phase}>
                        <DropdownMenuSubTrigger
                          className={cn(
                            "cursor-pointer",
                            isCurrentPhase && "font-medium"
                          )}
                        >
                          <span className={cn("mr-2", phaseColor.text)}>●</span>
                          {CONTRACT_PHASE_LABELS[phase] || phase}
                          {isCurrentPhase && <span className="text-xs text-gray-400 ml-auto">現在</span>}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {phaseStatuses.map((status) => {
                              const isCurrentStatus = contract.status === status;
                              return (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => !isCurrentStatus && openConfirmDialog(status)}
                                  disabled={isCurrentStatus}
                                  className={cn(
                                    "cursor-pointer",
                                    isCurrentStatus && "bg-blue-50 font-medium"
                                  )}
                                >
                                  {CONTRACT_STATUS_LABELS[status] || status}
                                  {isCurrentStatus && <span className="text-xs text-gray-400 ml-auto">現在</span>}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ open: false, targetStatus: "", message: "", comment: "" });
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>ステータス変更の確認</DialogTitle>
            <DialogDescription className="pt-2">
              {confirmDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="status-comment" className="text-sm font-medium">
              コメント（任意）
            </Label>
            <Textarea
              id="status-comment"
              placeholder="ステータス変更に関するコメントを入力..."
              className="mt-2"
              rows={3}
              value={confirmDialog.comment}
              onChange={(e) => setConfirmDialog({ ...confirmDialog, comment: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              変更理由や備考があれば記入してください
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, targetStatus: "", message: "", comment: "" })}
            >
              キャンセル
            </Button>
            <Button
              onClick={() => updateStatus(confirmDialog.targetStatus, confirmDialog.comment)}
              disabled={loading}
            >
              {loading ? "更新中..." : "完了"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
