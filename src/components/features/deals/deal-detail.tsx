"use client";

import { Deal, Activity } from "@/types";
import {
  DEAL_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  STATUS_TO_PHASE,
  DEAL_PHASE_LABELS,
} from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { StatusWorkflow } from "./status-workflow";
import { ActivityList } from "../activities/activity-list";
import { ActivityForm } from "../activities/activity-form";
import Link from "next/link";

interface DealDetailProps {
  deal: Deal;
  activities: Activity[];
  currentUserId: string;
}

const phaseColors = {
  sales: "bg-blue-100 text-blue-800",
  contract: "bg-yellow-100 text-yellow-800",
  installation: "bg-purple-100 text-purple-800",
  completion: "bg-green-100 text-green-800",
};

export function DealDetail({ deal, activities, currentUserId }: DealDetailProps) {
  const phase = STATUS_TO_PHASE[deal.status];

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
      <StatusWorkflow deal={deal} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>案件情報</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">案件名</dt>
                  <dd className="mt-1 text-sm text-gray-900">{deal.title}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">顧客</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link
                      href={`/customers/${deal.customer_id}`}
                      className="text-primary hover:underline"
                    >
                      {deal.customer?.company_name || "-"}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">フェーズ</dt>
                  <dd className="mt-1">
                    <Badge
                      variant="secondary"
                      className={cn(phase && phaseColors[phase])}
                    >
                      {phase ? DEAL_PHASE_LABELS[phase] : "-"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    ステータス
                  </dt>
                  <dd className="mt-1">
                    <Badge>
                      {DEAL_STATUS_LABELS[deal.status] || deal.status}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">契約種別</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {CONTRACT_TYPE_LABELS[deal.contract_type]}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    商品カテゴリ
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {deal.product_category || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">見込金額</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatAmount(deal.estimated_amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">担当者</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {deal.assigned_user?.name || "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">作成日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(deal.created_at), "yyyy年MM月dd日", {
                      locale: ja,
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">更新日</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(deal.updated_at), "yyyy年MM月dd日", {
                      locale: ja,
                    })}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Activities */}
          <Card>
            <CardHeader>
              <CardTitle>活動履歴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ActivityForm dealId={deal.id} userId={currentUserId} />
              <ActivityList activities={activities} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>顧客情報</CardTitle>
            </CardHeader>
            <CardContent>
              {deal.customer ? (
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">会社名</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {deal.customer.company_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      代表者名
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {deal.customer.representative_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      電話番号
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {deal.customer.phone || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">メール</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {deal.customer.email || "-"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">顧客情報がありません</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
