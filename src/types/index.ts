export * from "./database";

// Extended types with relations

// ユーザー
export type User = {
  id: string;
  email: string;
  name: string;
  role?: "admin" | "user";
  created_at?: string;
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

// 契約種類
export type ContractType = "property" | "line" | "maintenance";

/**
 * @deprecated DBマイグレーションで新しい値に移行すること
 * lease/rental/installment → property に統合
 */
export type LegacyContractType = "lease" | "rental" | "installment";

// 契約種類（DB移行完了までの一時的な型）
export type AnyContractType = ContractType | LegacyContractType;

// 商談内の契約（一覧表示用）- 新旧両方の値に対応
export type DealContract = {
  id: string;
  title: string;
  contract_type?: AnyContractType | string;  // 新旧両方の値に対応
  stage?: AnyContractStage | string;
  step?: AnyContractStep | string;
  monthly_amount?: number | null;
  product_category?: string | null;
  contract_number?: number;
};

// 商談（顧客への提案全体）
export type Deal = {
  id: string;
  customer_id: string;
  sales_user_id?: string;        // 営業担当者（マイグレーション後）
  appointer_user_id?: string;    // アポインター（マイグレーション後）
  title: string;
  status: DealStatus;
  description: string | null;
  total_amount: number | null;
  deal_number?: number;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  sales_user?: User;            // 営業担当者
  appointer_user?: User;        // アポインター
  contracts?: DealContract[];
  // 後方互換性（assigned_user_idからの移行用）
  assigned_user_id?: string;
  assigned_user?: User;
};

// 商談ステータス
export type DealStatus = "active" | "won" | "lost" | "pending";

// 契約ステップ
export type ContractStep =
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

/**
 * @deprecated DBマイグレーションで新しいステップに移行すること
 */
export type LegacyContractStep =
  | "日程調整中"
  | "MTG実施待ち"
  | "見積提出"
  | "受注確定"
  | "書類準備中"
  | "審査結果待ち"
  | "可決"
  | "否決"
  | "下見日程調整中";

// 契約ステップ（DB移行完了までの一時的な型）
export type AnyContractStep = ContractStep | LegacyContractStep;

// 契約ステージ
export type ContractStage =
  | "商談中"
  | "審査・申込中"
  | "下見・工事中"
  | "契約中"
  | "入金中"
  | "請求中"
  | "完了"
  | "否決";

/**
 * @deprecated DBマイグレーションで新しいステージに移行すること
 * 審査中 → 審査・申込中、工事中 → 下見・工事中
 */
export type LegacyContractStage =
  | "審査中"
  | "工事中"
  | "失注"
  | "クローズ";

// 契約ステージ（DB移行完了までの一時的な型）
export type AnyContractStage = ContractStage | LegacyContractStage;

// 後方互換性のためのエイリアス
/** @deprecated ContractStep を使用してください */
export type ContractStatus = ContractStep;
/** @deprecated LegacyContractStep を使用してください */
export type LegacyContractStatus = LegacyContractStep;
/** @deprecated AnyContractStep を使用してください */
export type AnyContractStatus = AnyContractStep;
/** @deprecated ContractStage を使用してください */
export type ContractPhase = ContractStage;
/** @deprecated LegacyContractStage を使用してください */
export type LegacyContractPhase = LegacyContractStage;
/** @deprecated AnyContractStage を使用してください */
export type AnyContractPhase = AnyContractStage;

// 契約（個別の契約明細）- 新旧両方の値に対応
export type Contract = {
  id: string;
  deal_id: string;
  title: string;
  contract_type: AnyContractType;  // 新旧両方の値に対応
  product_category: string | null;
  lease_company: string | null;
  stage: AnyContractStage;  // 新旧両方の値に対応
  step: AnyContractStep;  // 新旧両方の値に対応
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
  contract_id: string;  // 必須（マイグレーション後）
  user_id: string;
  activity_type: "phone" | "visit" | "email" | "online_meeting" | "status_change" | "other";
  content: string;
  is_status_change?: boolean;
  status_change_id?: string | null;
  created_at: string;
  // Relations
  user?: User;
  contract?: {
    id: string;
    title: string;
    deal?: {
      id: string;
      title: string;
      customer?: { id: string; company_name: string };
    };
  } | null;
  status_change?: StatusChangeHistory | null;
};

// ステップ変更履歴
export type StepChangeHistory = {
  id: string;
  contract_id: string;
  changed_by_user_id: string;
  previous_stage: string | null;
  new_stage: string;
  previous_step: string | null;
  new_step: string;
  comment: string | null;
  created_at: string;
  // Relations
  user?: User;
  contract?: Contract;
};

// 後方互換性のためのエイリアス
/** @deprecated StepChangeHistory を使用してください */
export type StatusChangeHistory = StepChangeHistory;

// タスク履歴
export type TaskHistory = {
  id: string;
  task_id: string;
  user_id: string;
  action: "created" | "updated" | "status_changed" | "deleted";
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  // Relations
  user?: User;
  task?: Task;
};

// タスク名マスタ
export type TaskNameMaster = {
  id: string;
  contract_type: ContractType;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// 商材マスタ
export type ProductMaster = {
  id: string;
  contract_type: ContractType;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// タスクステータス
export type TaskStatus = "未着手" | "進行中" | "完了";

// タスク
export type Task = {
  id: string;
  deal_id: string | null;
  contract_id: string | null;
  assigned_user_id: string;
  task_name_master_id?: string | null;  // タスク名マスタへの参照（マイグレーション後に追加）
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
    title?: string;
    contract_type?: ContractType | string;
    contract_number?: number;
    stage?: AnyContractStage | string;
    step?: AnyContractStep | string;
  } | null;
  assigned_user?: Partial<User>;
  task_name_master?: TaskNameMaster | null;
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

// エンティティ種別
export type EntityType = "customer" | "deal" | "contract" | "task" | "payment";

// 変更アクション
export type HistoryAction = "created" | "updated" | "deleted";

// フィールド変更内容
export type FieldChange = {
  old: unknown;
  new: unknown;
};

// 変更履歴
export type EntityHistory = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  action: HistoryAction;
  user_id: string | null;
  changes: Record<string, FieldChange> | null;
  comment: string | null;
  created_at: string;
  // Relations
  user?: User | null;
};
