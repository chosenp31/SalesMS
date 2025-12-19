export * from "./database";

// Extended types with relations

// ユーザー
export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "sales";
  created_at: string;
};

// 顧客
export type Customer = {
  id: string;
  company_name: string;
  representative_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  business_type: "corporation" | "sole_proprietor" | "new_corporation";
  created_at: string;
  updated_at: string;
};

// 商談（顧客への提案全体）
export type Deal = {
  id: string;
  customer_id: string;
  assigned_user_id: string;
  title: string;
  status: DealStatus;
  description: string | null;
  total_amount: number | null;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  assigned_user?: User;
  contracts?: Contract[];
  activities?: Activity[];
};

// 商談ステータス
export type DealStatus = "active" | "won" | "lost" | "pending";

// 契約（個別の契約明細）
export type Contract = {
  id: string;
  deal_id: string;
  title: string;
  contract_type: "lease" | "rental" | "installment";
  product_category: string | null;
  lease_company: string | null;
  status: ContractStatus;
  monthly_amount: number | null;
  total_amount: number | null;
  contract_months: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  deal?: Deal;
  lease_applications?: LeaseApplication[];
  payments?: Payment[];
};

// 契約ステータス（ワークフロー）
export type ContractStatus =
  // 営業フェーズ
  | "negotiating"        // 商談中
  | "quote_submitted"    // 見積提出
  | "accepted"           // 受注確定
  | "rejected"           // 失注
  // 契約フェーズ
  | "document_collection" // 書類収集中
  | "review_requested"    // 審査依頼中
  | "review_pending"      // 審査待ち
  | "review_approved"     // 可決
  | "review_rejected"     // 否決
  // 工事フェーズ
  | "survey_scheduling"       // 下見調整中
  | "survey_completed"        // 下見完了
  | "installation_scheduling" // 工事調整中
  | "installation_completed"  // 工事完了
  // 完了フェーズ
  | "delivered"          // 納品完了
  | "payment_pending"    // 入金待ち
  | "completed";         // 完了

// 契約フェーズ
export type ContractPhase = "sales" | "contract" | "installation" | "completion";

// リース審査
export type LeaseApplication = {
  id: string;
  contract_id: string;
  lease_company: string;
  status: "preparing" | "reviewing" | "approved" | "rejected" | "conditionally_approved";
  submitted_at: string | null;
  result_at: string | null;
  conditions: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  contract?: Contract;
};

// 入金
export type Payment = {
  id: string;
  contract_id: string;
  payment_type: "initial" | "monthly" | "final" | "other";
  expected_amount: number | null;
  actual_amount: number | null;
  expected_date: string | null;
  actual_date: string | null;
  status: "pending" | "paid";
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  contract?: {
    id: string;
    title: string;
    deal?: {
      id: string;
      title: string;
      customer?: {
        id: string;
        company_name: string;
      };
    };
  };
};

// 活動履歴
export type Activity = {
  id: string;
  deal_id: string;
  user_id: string;
  activity_type: "phone" | "visit" | "email" | "online_meeting" | "other";
  content: string;
  created_at: string;
  // Relations
  user?: User;
};

// タスク
export type Task = {
  id: string;
  deal_id: string | null;
  contract_id: string | null;
  assigned_user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "not_started" | "in_progress" | "completed";
  priority: "high" | "medium" | "low";
  created_at: string;
  updated_at: string;
  // Relations
  deal?: {
    id: string;
    title: string;
    customer?: { company_name: string };
  } | null;
  contract?: {
    id: string;
    title: string;
  } | null;
  assigned_user?: User;
};

// セレクト用の簡易型
export type DealOption = {
  id: string;
  title: string;
  customer?: { company_name: string } | null;
};

export type ContractOption = {
  id: string;
  title: string;
  deal?: {
    id: string;
    title: string;
    customer?: { company_name: string } | null;
  } | null;
};
