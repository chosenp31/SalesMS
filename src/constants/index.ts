// Business type labels
export const BUSINESS_TYPE_LABELS = {
  corporation: "法人",
  sole_proprietor: "個人事業主",
  new_corporation: "新設法人",
} as const;

// Contract type labels
export const CONTRACT_TYPE_LABELS = {
  lease: "リース",
  rental: "レンタル",
  installment: "割賦",
} as const;

// Deal status labels
export const DEAL_STATUS_LABELS: Record<string, string> = {
  // Sales phase
  appointment_acquired: "アポ獲得",
  in_negotiation: "商談中",
  quote_submitted: "見積提出",
  deal_won: "商談成立",
  deal_lost: "失注",
  // Contract phase
  contract_type_selection: "契約種別選択",
  document_collection: "書類収集中",
  review_requested: "審査依頼中",
  review_pending: "審査待ち",
  review_approved: "可決",
  review_rejected: "否決",
  // Installation phase
  survey_scheduling: "下見調整中",
  survey_completed: "下見完了",
  installation_scheduling: "工事調整中",
  installation_completed: "工事完了",
  // Completion phase
  delivery_completed: "納品完了",
  payment_pending: "入金待ち",
  completed: "完了",
};

// Deal phase labels
export const DEAL_PHASE_LABELS: Record<string, string> = {
  sales: "営業フェーズ",
  contract: "契約フェーズ",
  installation: "工事フェーズ",
  completion: "完了フェーズ",
};

// Status to phase mapping
export const STATUS_TO_PHASE: Record<string, string> = {
  // Sales phase
  appointment_acquired: "sales",
  in_negotiation: "sales",
  quote_submitted: "sales",
  deal_won: "sales",
  deal_lost: "sales",
  // Contract phase
  contract_type_selection: "contract",
  document_collection: "contract",
  review_requested: "contract",
  review_pending: "contract",
  review_approved: "contract",
  review_rejected: "contract",
  // Installation phase
  survey_scheduling: "installation",
  survey_completed: "installation",
  installation_scheduling: "installation",
  installation_completed: "installation",
  // Completion phase
  delivery_completed: "completion",
  payment_pending: "completion",
  completed: "completion",
};

// Phase statuses (ordered)
export const PHASE_STATUSES: Record<string, string[]> = {
  sales: ["appointment_acquired", "in_negotiation", "quote_submitted", "deal_won", "deal_lost"],
  contract: ["contract_type_selection", "document_collection", "review_requested", "review_pending", "review_approved", "review_rejected"],
  installation: ["survey_scheduling", "survey_completed", "installation_scheduling", "installation_completed"],
  completion: ["delivery_completed", "payment_pending", "completed"],
};

// Activity type labels
export const ACTIVITY_TYPE_LABELS = {
  phone: "電話",
  visit: "訪問",
  email: "メール",
  online_meeting: "オンライン商談",
  other: "その他",
} as const;

// Lease application status labels
export const LEASE_APPLICATION_STATUS_LABELS = {
  preparing: "申請準備中",
  reviewing: "審査中",
  approved: "可決",
  rejected: "否決",
  conditionally_approved: "条件付き可決",
} as const;

// Installation status labels
export const INSTALLATION_STATUS_LABELS = {
  not_started: "未着手",
  survey_scheduling: "下見調整中",
  survey_completed: "下見完了",
  installation_scheduling: "工事調整中",
  installation_completed: "工事完了",
} as const;

// Payment status labels
export const PAYMENT_STATUS_LABELS = {
  pending: "未入金",
  paid: "入金済",
} as const;

// Task status labels
export const TASK_STATUS_LABELS = {
  not_started: "未着手",
  in_progress: "進行中",
  completed: "完了",
} as const;

// Task priority labels
export const TASK_PRIORITY_LABELS = {
  high: "高",
  medium: "中",
  low: "低",
} as const;

// User role labels
export const USER_ROLE_LABELS = {
  admin: "管理者",
  manager: "マネージャー",
  sales: "営業",
} as const;

// Lease companies
export const LEASE_COMPANIES = [
  "C-mind",
  "オリコ",
  "ジャックス",
  "その他",
] as const;

// Product categories
export const PRODUCT_CATEGORIES = [
  "複合機",
  "ビジネスフォン",
  "UTM",
  "LED",
  "エアコン",
  "その他",
] as const;
