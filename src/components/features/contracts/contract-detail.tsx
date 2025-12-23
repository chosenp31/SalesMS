"use client";

import { Payment, Task, User } from "@/types";
import { Tables } from "@/types/database";
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
} from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { StatusWorkflow } from "../deals/status-workflow";
import { ContractTaskCard } from "./contract-task-card";
import { StatusHistoryCard } from "./status-history-card";
import { Calendar, CreditCard, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDealId } from "@/lib/utils";

// ステータス履歴の型
type StatusHistory = Tables<"contract_status_history"> & {
  changed_by_user?: { name: string } | null;
};

// 契約詳細ページ用の型（部分的なdeal情報を含む）
type ContractWithPartialDeal = Tables<"contracts"> & {
  deal?: {
    id: string;
    title: string;
    deal_number?: number;
    customer?: {
      id: string;
      company_name: string;
      customer_number?: number;
    };
  };
};

interface ContractDetailProps {
  contract: ContractWithPartialDeal;
  payments: Payment[];
  tasks: Task[];
  users: User[];
  statusHistory: StatusHistory[];
  currentUserId: string;
}

export function ContractDetail({
  contract,
  payments,
  tasks,
  users,
  statusHistory,
  currentUserId,
}: ContractDetailProps) {
  const formatAmount = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Status Workflow */}
      <StatusWorkflow contract={contract} currentUserId={currentUserId} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                契約情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">案件ID</dt>
                  <dd className="mt-1 text-sm">
                    {contract.deal ? (
                      <Link
                        href={`/deals/${contract.deal.id}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <span className="font-mono text-xs">
                          {formatDealId(contract.deal.customer?.customer_number, contract.deal.deal_number)}
                        </span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">契約種別</dt>
                  <dd className="mt-1">
                    <Badge variant="outline">
                      {CONTRACT_TYPE_LABELS[contract.contract_type]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">商品カテゴリ</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contract.product_category || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                  <dd className="mt-1">
                    <Badge>
                      {CONTRACT_STATUS_LABELS[contract.status] || contract.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">契約期間</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contract.contract_months ? `${contract.contract_months}ヶ月` : "-"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                金額情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">月額</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {formatAmount(contract.monthly_amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">合計金額</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {formatAmount(contract.total_amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">入金済み</dt>
                  <dd className="mt-1 text-lg font-semibold text-green-600">
                    {formatAmount(
                      payments
                        .filter((p) => p.status === "入金済")
                        .reduce((sum, p) => sum + (p.actual_amount || 0), 0)
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Contract Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                契約期間
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">開始日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contract.start_date
                      ? format(new Date(contract.start_date), "yyyy年MM月dd日", {
                          locale: ja,
                        })
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">終了日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contract.end_date
                      ? format(new Date(contract.end_date), "yyyy年MM月dd日", {
                          locale: ja,
                        })
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">作成日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(contract.created_at), "yyyy年MM月dd日", {
                      locale: ja,
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">更新日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(contract.updated_at), "yyyy年MM月dd日", {
                      locale: ja,
                    })}
                  </dd>
                </div>
              </dl>
              {contract.notes && (
                <div className="mt-4 pt-4 border-t">
                  <dt className="text-sm font-medium text-gray-500">備考</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {contract.notes}
                  </dd>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status History Card */}
          <StatusHistoryCard history={statusHistory} />
        </div>
      </div>

      {/* Task Card - メインコンテンツエリアに配置 */}
      <ContractTaskCard
        contract={contract}
        tasks={tasks}
        users={users}
        currentUserId={currentUserId}
      />
    </div>
  );
}
