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

// 商談内の契約（一覧表示用）
export type DealContract = {
  id: string;
  title: string;
  contract_type?: "lease" | "rental" | "installment";
  phase?: string;
  status?: string;
  monthly_amount?: number | null;
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
  contracts?: DealContract[];
  activities?: Activity[];
};

// 商談ステータス
export type DealStatus = "active" | "won" | "lost" | "pending";

// 契約ステータス（小分類）
export type ContractStatus =
  // 営業フェーズ（商談中）
  | "日程調整中"
  | "MTG実施待ち"
  | "見積提出"
  | "受注確定"
  // 契約フェーズ（審査中）
  | "書類準備中"
  | "審査結果待ち"
  | "可決"
  | "否決"
  // 工事フェーズ（工事中）
  | "下見日程調整中"
  | "下見実施待ち"
  | "工事日程調整中"
  | "工事実施待ち"
  // 入金フェーズ（入金中）
  | "入金待ち"
  | "入金済"
  // 終了ステータス
  | "失注"
  | "クローズ";

// 契約フェーズ（大分類）
export type ContractPhase =
  | "商談中"
  | "審査中"
  | "工事中"
  | "入金中"
  | "失注"
  | "クローズ";

// 契約（個別の契約明細）
export type Contract = {
  id: string;
  deal_id: string;
  title: string;
  contract_type: "lease" | "rental" | "installment";
  product_category: string | null;
  lease_company: string | null;
  phase: ContractPhase;
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

// リース審査ステータス
export type LeaseApplicationStatus =
  | "準備中"
  | "審査結果待ち"
  | "可決"
  | "否決"
  | "条件付可決";

// リース審査
export type LeaseApplication = {
  id: string;
  contract_id: string;
  lease_company: string;
  status: LeaseApplicationStatus;
  submitted_at: string | null;
  result_at: string | null;
  conditions: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  contract?: Contract;
};

// 入金ステータス
export type PaymentStatus = "入金予定" | "入金済";

// 入金
export type Payment = {
  id: string;
  contract_id: string;
  payment_type: "initial" | "monthly" | "final" | "other";
  expected_amount: number | null;
  actual_amount: number | null;
  expected_date: string | null;
  actual_date: string | null;
  status: PaymentStatus;
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

// タスクステータス
export type TaskStatus = "未着手" | "進行中" | "完了";

// タスク
export type Task = {
  id: string;
  deal_id: string | null;
  contract_id: string | null;
  assigned_user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  priority: "high" | "medium" | "low";
  company: string | null;
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
    phase?: ContractPhase;
    status?: ContractStatus;
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
