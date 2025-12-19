"use client";

import { LeaseApplication, Payment } from "@/types";
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
import { LeaseApplications } from "../deals/lease-applications";
import Link from "next/link";
import { Building2, Calendar, CreditCard, FileText } from "lucide-react";

// 契約詳細ページ用の型（部分的なdeal情報を含む）
type ContractWithPartialDeal = Tables<"contracts"> & {
  deal?: {
    id: string;
    title: string;
    customer?: {
      id: string;
      company_name: string;
    };
  };
};

interface ContractDetailProps {
  contract: ContractWithPartialDeal;
  leaseApplications: LeaseApplication[];
  payments: Payment[];
}

export function ContractDetail({
  contract,
  leaseApplications,
  payments,
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
      <StatusWorkflow contract={contract} />

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
                  <dt className="text-sm font-medium text-gray-500">契約名</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contract.title}</dd>
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
                  <dt className="text-sm font-medium text-gray-500">リース会社</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contract.lease_company || "-"}
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
          {/* Lease Applications */}
          <LeaseApplications
            contractId={contract.id}
            applications={leaseApplications}
          />

          {/* Deal Info */}
          {contract.deal && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  商談情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">商談名</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <Link
                        href={`/deals/${contract.deal.id}`}
                        className="text-primary hover:underline"
                      >
                        {contract.deal.title}
                      </Link>
                    </dd>
                  </div>
                  {contract.deal.customer && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">顧客</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <Link
                          href={`/customers/${contract.deal.customer.id}`}
                          className="text-primary hover:underline"
                        >
                          {contract.deal.customer.company_name}
                        </Link>
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
