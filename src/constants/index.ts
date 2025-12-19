// ========================================
// 顧客関連
// ========================================

// 事業形態ラベル
export const BUSINESS_TYPE_LABELS = {
  corporation: "法人",
  sole_proprietor: "個人事業主",
  new_corporation: "新設法人",
} as const;

// ========================================
// 商談関連
// ========================================

// 商談ステータスラベル（全ワークフローステータス対応）
export const DEAL_STATUS_LABELS: Record<string, string> = {
  // 旧シンプルステータス（後方互換性）
  active: "進行中",
  won: "成約",
  lost: "失注",
  pending: "保留",
  // 新ワークフローステータス（営業フェーズ）
  appointment_acquired: "アポ獲得",
  in_negotiation: "商談中",
  quote_submitted: "見積提出",
  deal_won: "成約",
  deal_lost: "失注",
  // 契約準備フェーズ
  contract_type_selection: "契約種別選択",
  document_collection: "書類収集中",
  review_requested: "審査依頼中",
  review_pending: "審査待ち",
  review_approved: "審査可決",
  review_rejected: "審査否決",
  // 工事フェーズ
  survey_scheduling: "下見調整中",
  survey_completed: "下見完了",
  installation_scheduling: "工事調整中",
  installation_completed: "工事完了",
  // 完了フェーズ
  delivery_completed: "納品完了",
  delivered: "納品完了",
  payment_pending: "入金待ち",
  completed: "完了",
};

// ========================================
// 契約関連
// ========================================

// 契約種別ラベル
export const CONTRACT_TYPE_LABELS = {
  lease: "リース",
  rental: "レンタル",
  installment: "割賦",
} as const;

// 契約ステータスラベル（ワークフロー）
export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  // 営業フェーズ
  negotiating: "商談中",
  quote_submitted: "見積提出",
  accepted: "受注確定",
  rejected: "失注",
  // 契約フェーズ
  document_collection: "書類収集中",
  review_requested: "審査依頼中",
  review_pending: "審査待ち",
  review_approved: "可決",
  review_rejected: "否決",
  // 工事フェーズ
  survey_scheduling: "下見調整中",
  survey_completed: "下見完了",
  installation_scheduling: "工事調整中",
  installation_completed: "工事完了",
  // 完了フェーズ
  delivered: "納品完了",
  payment_pending: "入金待ち",
  completed: "完了",
};

// 契約フェーズラベル
export const CONTRACT_PHASE_LABELS: Record<string, string> = {
  sales: "営業フェーズ",
  contract: "契約フェーズ",
  installation: "工事フェーズ",
  completion: "完了フェーズ",
};

// ステータスからフェーズへのマッピング
export const STATUS_TO_PHASE: Record<string, string> = {
  // 営業フェーズ
  negotiating: "sales",
  quote_submitted: "sales",
  accepted: "sales",
  rejected: "sales",
  // 契約フェーズ
  document_collection: "contract",
  review_requested: "contract",
  review_pending: "contract",
  review_approved: "contract",
  review_rejected: "contract",
  // 工事フェーズ
  survey_scheduling: "installation",
  survey_completed: "installation",
  installation_scheduling: "installation",
  installation_completed: "installation",
  // 完了フェーズ
  delivered: "completion",
  payment_pending: "completion",
  completed: "completion",
};

// フェーズ内ステータス一覧（順序付き）
export const PHASE_STATUSES: Record<string, string[]> = {
  sales: ["negotiating", "quote_submitted", "accepted", "rejected"],
  contract: ["document_collection", "review_requested", "review_pending", "review_approved", "review_rejected"],
  installation: ["survey_scheduling", "survey_completed", "installation_scheduling", "installation_completed"],
  completion: ["delivered", "payment_pending", "completed"],
};

// 次のフェーズの最初のステータス
export const NEXT_PHASE_FIRST_STATUS: Record<string, string> = {
  sales: "document_collection",
  contract: "survey_scheduling",
  installation: "delivered",
};

// ========================================
// 活動関連
// ========================================

// 活動種別ラベル
export const ACTIVITY_TYPE_LABELS = {
  phone: "電話",
  visit: "訪問",
  email: "メール",
  online_meeting: "オンライン商談",
  other: "その他",
} as const;

// ========================================
// リース審査関連
// ========================================

// リース審査ステータスラベル
export const LEASE_APPLICATION_STATUS_LABELS = {
  preparing: "申請準備中",
  reviewing: "審査中",
  approved: "可決",
  rejected: "否決",
  conditionally_approved: "条件付き可決",
} as const;

// リース会社一覧
export const LEASE_COMPANIES = [
  "C-mind",
  "オリコ",
  "ジャックス",
  "その他",
] as const;

// ========================================
// 入金関連
// ========================================

// 入金ステータスラベル
export const PAYMENT_STATUS_LABELS = {
  pending: "未入金",
  paid: "入金済",
} as const;

// 入金種別ラベル
export const PAYMENT_TYPE_LABELS = {
  initial: "初回",
  monthly: "月額",
  final: "最終",
  other: "その他",
} as const;

// ========================================
// タスク関連
// ========================================

// タスクステータスラベル
export const TASK_STATUS_LABELS = {
  not_started: "未着手",
  in_progress: "進行中",
  completed: "完了",
} as const;

// タスク優先度ラベル
export const TASK_PRIORITY_LABELS = {
  high: "高",
  medium: "中",
  low: "低",
} as const;

// ========================================
// ユーザー関連
// ========================================

// ユーザーロールラベル
export const USER_ROLE_LABELS = {
  admin: "管理者",
  manager: "マネージャー",
  sales: "営業",
} as const;

// ========================================
// 商品関連
// ========================================

// 商品カテゴリ一覧
export const PRODUCT_CATEGORIES = [
  "複合機",
  "ビジネスフォン",
  "UTM",
  "LED",
  "エアコン",
  "その他",
] as const;

// ========================================
// 契約期間オプション
// ========================================

export const CONTRACT_MONTHS_OPTIONS = [
  { value: 12, label: "1年（12ヶ月）" },
  { value: 24, label: "2年（24ヶ月）" },
  { value: 36, label: "3年（36ヶ月）" },
  { value: 48, label: "4年（48ヶ月）" },
  { value: 60, label: "5年（60ヶ月）" },
  { value: 72, label: "6年（72ヶ月）" },
  { value: 84, label: "7年（84ヶ月）" },
] as const;
