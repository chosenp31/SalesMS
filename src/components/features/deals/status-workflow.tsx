"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONTRACT_STEP_LABELS,
  CONTRACT_STAGE_LABELS,
  STEP_TO_STAGE,
  STAGE_STEPS,
  STEP_DETAILS,
  STEP_COMPLETION_MESSAGES,
} from "@/constants";
import { createClient } from "@/lib/supabase/client";
import { recordStepChange } from "@/lib/history";
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
import { Check, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { workflowStageColors } from "@/constants/colors";

// StatusWorkflowが必要とする最小限の契約情報
interface ContractForWorkflow {
  id: string;
  step: string;  // 新旧両方の値に対応
  deal_id?: string;
}

interface StatusWorkflowProps {
  contract: ContractForWorkflow;
  currentUserId: string;
}

// 新しいステージ順序
const stageOrder = ["商談中", "審査・申込中", "下見・工事中", "契約中", "入金中", "請求中"];

// 旧ステージから新ステージへのマッピング
const stageMapping: Record<string, string> = {
  審査中: "審査・申込中",
  工事中: "下見・工事中",
};

// ステップツールチップコンポーネント
function StepTooltip({ step, children }: { step: string; children: React.ReactNode }) {
  const details = STEP_DETAILS[step];

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
            <p className="font-medium text-sm">{CONTRACT_STEP_LABELS[step] || step}</p>
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
    targetStep: string;
    message: string;
    comment: string;
  }>({
    open: false,
    targetStep: "",
    message: "",
    comment: "",
  });

  // 現在のステージを取得（旧ステージの場合はマッピングする）
  let currentStage = STEP_TO_STAGE[contract.step] || "商談中";
  if (stageMapping[currentStage]) {
    currentStage = stageMapping[currentStage];
  }

  const currentStageIndex = stageOrder.indexOf(currentStage);
  const currentStageSteps = STAGE_STEPS[currentStage] || [];

  // ステップ更新処理
  const updateStep = async (newStep: string, comment?: string) => {
    setLoading(true);
    const supabase = createClient();

    // 新しいステージを取得
    const newStage = STEP_TO_STAGE[newStep] || currentStage;
    const previousStep = contract.step;
    const previousStage = currentStage;

    // 契約ステップを更新
    const { error } = await supabase
      .from("contracts")
      .update({ step: newStep, stage: newStage })
      .eq("id", contract.id);

    if (error) {
      console.error("Error updating step:", error);
    } else {
      // ステップ変更履歴を記録（entity_historyに統一）
      const historyResult = await recordStepChange(
        supabase,
        contract.id,
        currentUserId || null,
        previousStage,
        newStage,
        previousStep,
        newStep,
        comment
      );

      if (!historyResult.success) {
        console.error("Error recording step history:", historyResult.error);
      }

      // 活動履歴にもステップ変更を記録
      const stepChangeContent = `ステップを変更しました\n${CONTRACT_STEP_LABELS[previousStep] || previousStep} → ${CONTRACT_STEP_LABELS[newStep] || newStep}${comment ? `\n\nコメント: ${comment}` : ""}`;

      const { error: activityError } = await supabase.from("activities").insert({
        user_id: currentUserId,
        activity_type: "status_change",
        contract_id: contract.id,
        content: stepChangeContent,
        is_status_change: true,
        status_change_id: null, // entity_historyに統合されたため不要
      });

      if (activityError) {
        console.error("Error recording activity:", activityError);
      }

      // Contract完了時にDealステータス自動更新
      if (newStep === "クローズ" && contract.deal_id) {
        // 同じDealの他の契約を取得
        const { data: otherContracts } = await supabase
          .from("contracts")
          .select("id, step")
          .eq("deal_id", contract.deal_id)
          .neq("id", contract.id);

        // 全ての契約がクローズまたは失注の場合、Dealを成約に更新
        const allContractsCompleted = !otherContracts || otherContracts.every(
          (c) => c.step === "クローズ" || c.step === "失注"
        );

        if (allContractsCompleted) {
          await supabase
            .from("deals")
            .update({ status: "won" })
            .eq("id", contract.deal_id);
        }
      }

      // Contract失注時にDealステータス自動更新（全て失注の場合）
      if (newStep === "失注" && contract.deal_id) {
        const { data: allContracts } = await supabase
          .from("contracts")
          .select("id, step")
          .eq("deal_id", contract.deal_id);

        // 全ての契約が失注の場合、Dealも失注に更新
        const allContractsLost = allContracts && allContracts.every(
          (c) => c.id === contract.id ? true : c.step === "失注"
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
    setConfirmDialog({ open: false, targetStep: "", message: "", comment: "" });
    router.refresh();
  };

  // 確認ダイアログを開く
  const openConfirmDialog = (targetStep: string) => {
    const message = STEP_COMPLETION_MESSAGES[contract.step] || `${CONTRACT_STEP_LABELS[targetStep] || targetStep}に進みますか？`;
    setConfirmDialog({
      open: true,
      targetStep,
      message,
      comment: "",
    });
  };

  // 現在のステップの次のステップを取得
  const getNextStep = () => {
    const currentStepIndex = currentStageSteps.indexOf(contract.step);

    // 現在のステージ内に次のステップがある場合
    if (currentStepIndex >= 0 && currentStepIndex < currentStageSteps.length - 1) {
      return currentStageSteps[currentStepIndex + 1];
    }

    // 次のステージの最初のステップ
    if (currentStageIndex >= 0 && currentStageIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentStageIndex + 1];
      const nextStageSteps = STAGE_STEPS[nextStage];
      if (nextStageSteps && nextStageSteps.length > 0) {
        return nextStageSteps[0];
      }
    }

    return null;
  };

  // 現在のステップの前のステップを取得
  const getPreviousStep = () => {
    const currentStepIndex = currentStageSteps.indexOf(contract.step);

    // 現在のステージ内に前のステップがある場合
    if (currentStepIndex > 0) {
      return currentStageSteps[currentStepIndex - 1];
    }

    // 現在のステージの最初のステップで、前のステージがある場合
    if (currentStageIndex > 0) {
      const prevStage = stageOrder[currentStageIndex - 1];
      const prevStageSteps = STAGE_STEPS[prevStage];
      if (prevStageSteps && prevStageSteps.length > 0) {
        return prevStageSteps[prevStageSteps.length - 1];
      }
    }

    return null;
  };

  const nextStep = getNextStep();
  const previousStep = getPreviousStep();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            契約ステージ
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs">各ステージにカーソルを合わせると詳細が表示されます</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Stage Progress - 各ステージ固有の色を使用 */}
          <div className="flex items-center justify-between mb-6 overflow-x-auto">
            {stageOrder.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const stageColor = workflowStageColors[stage] || workflowStageColors["商談中"];

              return (
                <div key={stage} className="flex items-center flex-1 min-w-[80px]">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                        // 完了: グレー（控えめ）＋白チェック
                        isCompleted && "bg-gray-400 border-gray-400",
                        // 現在: 各ステージ固有の色（濃い）＋白数字
                        isCurrent && `${stageColor.active} ${stageColor.border} shadow-md`,
                        // 未来: 白背景＋各ステージ色の枠線
                        !isCompleted && !isCurrent && `bg-white ${stageColor.border}`
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : isCurrent ? (
                        <span className="text-sm font-bold text-white">
                          {index + 1}
                        </span>
                      ) : (
                        <span className={cn("text-sm font-bold", stageColor.text)}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-xs font-medium text-center",
                        isCompleted && "text-gray-500",
                        isCurrent && `${stageColor.text} font-bold`,
                        !isCompleted && !isCurrent && stageColor.text
                      )}
                    >
                      {CONTRACT_STAGE_LABELS[stage] || stage}
                    </span>
                  </div>
                  {/* 進捗ライン - 完了はグレー、それ以外はグレー */}
                  {index < stageOrder.length - 1 && (
                    <div
                      className={cn(
                        "h-1 flex-1 mx-2 rounded-full min-w-[20px]",
                        index < currentStageIndex ? "bg-gray-400" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Stage Steps - 現在のステージの色を使用 */}
          {currentStageSteps.length > 0 && (() => {
            const currentColor = workflowStageColors[currentStage] || workflowStageColors["商談中"];
            return (
              <div className={cn("p-4 rounded-lg", currentColor.bgLight)}>
                <h4 className={cn("text-sm font-medium mb-3", currentColor.text)}>
                  {CONTRACT_STAGE_LABELS[currentStage] || currentStage}のステップ
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentStageSteps.map((step) => {
                    const isCurrentStep = contract.step === step;
                    return (
                      <StepTooltip key={step} step={step}>
                        <div
                          className={cn(
                            "inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3",
                            isCurrentStep
                              ? `${currentColor.active} text-white shadow-sm`
                              : `bg-white border ${currentColor.border} ${currentColor.text}`
                          )}
                        >
                          {CONTRACT_STEP_LABELS[step] || step}
                        </div>
                      </StepTooltip>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ステップを移動 - 前/次のボタンを横並びで表示 */}
          {(previousStep || (nextStep && currentStage !== "請求中")) && (() => {
            const currentColor = workflowStageColors[currentStage] || workflowStageColors["商談中"];
            return (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">ステップを移動</h4>
                <div className="flex gap-3">
                  {/* 前に戻るボタン */}
                  {previousStep && (
                    <StepTooltip step={previousStep}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => openConfirmDialog(previousStep)}
                        className={cn(currentColor.text, currentColor.border, currentColor.bgLight.replace("bg-", "hover:bg-"))}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {CONTRACT_STEP_LABELS[previousStep] || previousStep}に戻る
                      </Button>
                    </StepTooltip>
                  )}
                  {/* 次に進むボタン */}
                  {nextStep && currentStage !== "請求中" && (
                    <StepTooltip step={nextStep}>
                      <Button
                        size="sm"
                        disabled={loading}
                        onClick={() => openConfirmDialog(nextStep)}
                        className={cn(currentColor.active, "text-white hover:opacity-90")}
                      >
                        {CONTRACT_STEP_LABELS[nextStep] || nextStep}に進む
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </StepTooltip>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 請求中ステージ → 完了への遷移 */}
          {currentStage === "請求中" && (() => {
            const currentColor = workflowStageColors[currentStage] || workflowStageColors["商談中"];
            return (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">ステップを移動</h4>
                <div className="flex gap-3">
                  {previousStep && (
                    <StepTooltip step={previousStep}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={() => openConfirmDialog(previousStep)}
                        className={cn(currentColor.text, currentColor.border, currentColor.bgLight.replace("bg-", "hover:bg-"))}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        {CONTRACT_STEP_LABELS[previousStep] || previousStep}に戻る
                      </Button>
                    </StepTooltip>
                  )}
                  <StepTooltip step="クローズ">
                    <Button
                      size="sm"
                      disabled={loading || contract.step === "クローズ"}
                      onClick={() => openConfirmDialog("クローズ")}
                      className={cn(currentColor.active, "text-white hover:opacity-90")}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      案件を完了する
                    </Button>
                  </StepTooltip>
                </div>
              </div>
            );
          })()}

          {/* 案件を終了する場合 */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-3">案件を終了する場合</h4>
            <div className="flex gap-2">
              <StepTooltip step="対応検討中">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || contract.step === "対応検討中"}
                  onClick={() => openConfirmDialog("対応検討中")}
                  className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                >
                  対応検討中
                </Button>
              </StepTooltip>
              <StepTooltip step="失注">
                <Button
                  size="sm"
                  disabled={loading || contract.step === "失注"}
                  onClick={() => openConfirmDialog("失注")}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  失注
                </Button>
              </StepTooltip>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ open: false, targetStep: "", message: "", comment: "" });
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>ステップ変更の確認</DialogTitle>
            <DialogDescription className="pt-2">
              {confirmDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="step-comment" className="text-sm font-medium">
              コメント（任意）
            </Label>
            <Textarea
              id="step-comment"
              placeholder="ステップ変更に関するコメントを入力..."
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
              onClick={() => setConfirmDialog({ open: false, targetStep: "", message: "", comment: "" })}
            >
              キャンセル
            </Button>
            <Button
              onClick={() => updateStep(confirmDialog.targetStep, confirmDialog.comment)}
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
