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
  customer_number?: number;
  created_at: string;
  updated_at: string;
};

// 契約種類（新）
export type ContractType = "property" | "line" | "maintenance";

// 契約種類（旧）- 後方互換性のため残す
export type LegacyContractType = "lease" | "rental" | "installment";

// 契約種類（新旧統合）
export type AnyContractType = ContractType | LegacyContractType;

// 商談内の契約（一覧表示用）- 新旧両方の値に対応
export type DealContract = {
  id: string;
  title: string;
  contract_type?: AnyContractType;  // 新旧両方の値に対応
  phase?: AnyContractPhase;
  status?: AnyContractStatus;
  monthly_amount?: number | null;
  product_category?: string | null;
  contract_number?: number;
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
  deal_number?: number;
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
  // 商談中
  | "商談待ち"
  | "商談日程調整中"
  // 審査・申込中
  | "審査・申込対応中"
  | "審査・申込待ち"
  // 下見・工事中
  | "下見調整中"
  | "下見実施待ち"
  | "工事日程調整中"
  | "工事実施待ち"
  // 契約中
  | "検収確認中"
  | "契約書提出対応中"
  | "契約書確認待ち"
  // 入金中
  | "入金待ち"
  | "入金済"
  // 請求中
  | "初回請求確認待ち"
  | "請求処理対応中"
  // 完了
  | "クローズ"
  // 否決
  | "対応検討中"
  | "失注";

// 旧契約ステータス（後方互換性）
export type LegacyContractStatus =
  | "日程調整中"
  | "MTG実施待ち"
  | "見積提出"
  | "受注確定"
  | "書類準備中"
  | "審査結果待ち"
  | "可決"
  | "否決"
  | "下見日程調整中";

// 契約ステータス（新旧統合）
export type AnyContractStatus = ContractStatus | LegacyContractStatus;

// 契約フェーズ（大分類）
export type ContractPhase =
  | "商談中"
  | "審査・申込中"
  | "下見・工事中"
  | "契約中"
  | "入金中"
  | "請求中"
  | "完了"
  | "否決";

// 旧契約フェーズ（後方互換性）
export type LegacyContractPhase =
  | "審査中"
  | "工事中"
  | "失注"
  | "クローズ";

// 契約フェーズ（新旧統合）
export type AnyContractPhase = ContractPhase | LegacyContractPhase;

// 契約（個別の契約明細）- 新旧両方の値に対応
export type Contract = {
  id: string;
  deal_id: string;
  title: string;
  contract_type: AnyContractType;  // 新旧両方の値に対応
  product_category: string | null;
  lease_company: string | null;
  phase: AnyContractPhase;  // 新旧両方の値に対応
  status: AnyContractStatus;  // 新旧両方の値に対応
  monthly_amount: number | null;
  total_amount: number | null;
  contract_months: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  contract_number?: number;
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
  contract_id: string | null;
  user_id: string;
  activity_type: "phone" | "visit" | "email" | "online_meeting" | "other";
  content: string;
  created_at: string;
  // Relations
  user?: User;
  contract?: {
    id: string;
    title: string;
  } | null;
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
  task_number?: number;
  created_at: string;
  updated_at: string;
  // Relations
  deal?: {
    id: string;
    title: string;
    deal_number?: number;
    customer?: { id: string; company_name: string; customer_number?: number };
  } | null;
  contract?: {
    id: string;
    title: string;
    contract_number?: number;
    phase?: AnyContractPhase;  // 新旧両方の値に対応
    status?: AnyContractStatus;  // 新旧両方の値に対応
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
