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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, Info } from "lucide-react";

// StatusWorkflowが必要とする最小限の契約情報
interface ContractForWorkflow {
  id: string;
  status: string;  // 新旧両方の値に対応
}

interface StatusWorkflowProps {
  contract: ContractForWorkflow;
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

export function StatusWorkflow({ contract }: StatusWorkflowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    targetStatus: string;
    message: string;
  }>({
    open: false,
    targetStatus: "",
    message: "",
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
  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    const supabase = createClient();

    // 新しいフェーズを取得
    const newPhase = STATUS_TO_PHASE[newStatus] || currentPhase;

    const { error } = await supabase
      .from("contracts")
      .update({ status: newStatus, phase: newPhase })
      .eq("id", contract.id);

    if (error) {
      console.error("Error updating status:", error);
    }

    setLoading(false);
    setConfirmDialog({ open: false, targetStatus: "", message: "" });
    router.refresh();
  };

  // 確認ダイアログを開く
  const openConfirmDialog = (targetStatus: string) => {
    const message = STATUS_COMPLETION_MESSAGES[contract.status] || `${CONTRACT_STATUS_LABELS[targetStatus] || targetStatus}に進みますか？`;
    setConfirmDialog({
      open: true,
      targetStatus,
      message,
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

          {/* Current Phase Statuses */}
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
                      <Button
                        variant={isCurrentStatus ? "default" : "outline"}
                        size="sm"
                        disabled={loading || isCurrentStatus}
                        onClick={() => {
                          if (!isCurrentStatus) {
                            openConfirmDialog(status);
                          }
                        }}
                        className={cn(
                          isCurrentStatus && colors.active,
                          "cursor-pointer"
                        )}
                      >
                        {CONTRACT_STATUS_LABELS[status] || status}
                      </Button>
                    </StatusTooltip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Next Status Button */}
          {nextStatus && (
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
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ open: false, targetStatus: "", message: "" });
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>ステータス変更の確認</DialogTitle>
            <DialogDescription className="pt-2">
              {confirmDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, targetStatus: "", message: "" })}
            >
              キャンセル
            </Button>
            <Button
              onClick={() => updateStatus(confirmDialog.targetStatus)}
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
