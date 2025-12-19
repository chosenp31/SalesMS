"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContractStatus } from "@/types";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_PHASE_LABELS,
  STATUS_TO_PHASE,
  PHASE_STATUSES,
} from "@/constants";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";

// StatusWorkflowが必要とする最小限の契約情報
interface ContractForWorkflow {
  id: string;
  status: ContractStatus;
}

interface StatusWorkflowProps {
  contract: ContractForWorkflow;
}

const phaseOrder = ["sales", "contract", "installation", "completion"];

const phaseColors: Record<string, { bg: string; border: string; text: string; active: string }> = {
  sales: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    active: "bg-blue-500",
  },
  contract: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    active: "bg-yellow-500",
  },
  installation: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    active: "bg-purple-500",
  },
  completion: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    active: "bg-green-500",
  },
};

export function StatusWorkflow({ contract }: StatusWorkflowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const currentPhase = STATUS_TO_PHASE[contract.status];
  const currentPhaseIndex = phaseOrder.indexOf(currentPhase);

  const updateStatus = async (newStatus: ContractStatus) => {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("contracts")
      .update({ status: newStatus })
      .eq("id", contract.id);

    if (error) {
      console.error("Error updating status:", error);
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>契約ステータス</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Phase Progress */}
        <div className="flex items-center justify-between mb-6">
          {phaseOrder.map((phase, index) => {
            const isCompleted = index < currentPhaseIndex;
            const isCurrent = index === currentPhaseIndex;
            const colors = phaseColors[phase];

            return (
              <div key={phase} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2",
                      isCompleted && `${colors.active} border-transparent`,
                      isCurrent && `${colors.bg} ${colors.border}`,
                      !isCompleted && !isCurrent && "bg-gray-100 border-gray-200"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isCurrent ? colors.text : "text-gray-400"
                        )}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      isCurrent ? colors.text : "text-gray-500"
                    )}
                  >
                    {CONTRACT_PHASE_LABELS[phase]}
                  </span>
                </div>
                {index < phaseOrder.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-gray-300 mx-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Phase Statuses */}
        <div className={cn("p-4 rounded-lg", phaseColors[currentPhase].bg)}>
          <h4 className={cn("text-sm font-medium mb-3", phaseColors[currentPhase].text)}>
            {CONTRACT_PHASE_LABELS[currentPhase]}のステータス
          </h4>
          <div className="flex flex-wrap gap-2">
            {PHASE_STATUSES[currentPhase].map((status) => {
              const isCurrentStatus = contract.status === status;
              return (
                <Button
                  key={status}
                  variant={isCurrentStatus ? "default" : "outline"}
                  size="sm"
                  disabled={loading || isCurrentStatus}
                  onClick={() => updateStatus(status as ContractStatus)}
                  className={cn(
                    isCurrentStatus && phaseColors[currentPhase].active
                  )}
                >
                  {CONTRACT_STATUS_LABELS[status]}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Quick Phase Change */}
        {currentPhaseIndex < phaseOrder.length - 1 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">
              次のフェーズに進む場合は、以下のボタンをクリックしてください。
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => {
                const nextPhase = phaseOrder[currentPhaseIndex + 1];
                const firstStatus = PHASE_STATUSES[nextPhase][0] as ContractStatus;
                updateStatus(firstStatus);
              }}
            >
              {CONTRACT_PHASE_LABELS[phaseOrder[currentPhaseIndex + 1]]}へ進む
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
