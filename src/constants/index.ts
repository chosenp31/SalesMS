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

// 契約フェーズ（大分類）
export const CONTRACT_PHASE_LABELS = {
  商談中: "商談中",
  審査中: "審査中",
  工事中: "工事中",
  入金中: "入金中",
  失注: "失注",
  クローズ: "クローズ",
} as const;

// 契約ステータス（小分類）ラベル
export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  // 営業フェーズ（商談中）
  日程調整中: "日程調整中",
  MTG実施待ち: "MTG実施待ち",
  見積提出: "見積提出",
  受注確定: "受注確定",
  // 契約フェーズ（審査中）
  書類準備中: "書類準備中",
  審査結果待ち: "審査結果待ち",
  可決: "可決",
  否決: "否決",
  // 工事フェーズ（工事中）
  下見日程調整中: "下見日程調整中",
  下見実施待ち: "下見実施待ち",
  工事日程調整中: "工事日程調整中",
  工事実施待ち: "工事実施待ち",
  // 入金フェーズ（入金中）
  入金待ち: "入金待ち",
  入金済: "入金済",
  // 終了ステータス
  失注: "失注",
  クローズ: "クローズ",
};

// ステータスからフェーズ（大分類）へのマッピング
export const STATUS_TO_PHASE: Record<string, string> = {
  // 営業フェーズ（商談中）
  日程調整中: "商談中",
  MTG実施待ち: "商談中",
  見積提出: "商談中",
  受注確定: "商談中",
  // 契約フェーズ（審査中）
  書類準備中: "審査中",
  審査結果待ち: "審査中",
  可決: "審査中",
  否決: "審査中",
  // 工事フェーズ（工事中）
  下見日程調整中: "工事中",
  下見実施待ち: "工事中",
  工事日程調整中: "工事中",
  工事実施待ち: "工事中",
  // 入金フェーズ（入金中）
  入金待ち: "入金中",
  入金済: "入金中",
  // 終了ステータス
  失注: "失注",
  クローズ: "クローズ",
};

// フェーズ内ステータス一覧（順序付き）
export const PHASE_STATUSES: Record<string, string[]> = {
  商談中: ["日程調整中", "MTG実施待ち", "見積提出", "受注確定"],
  審査中: ["書類準備中", "審査結果待ち", "可決", "否決"],
  工事中: ["下見日程調整中", "下見実施待ち", "工事日程調整中", "工事実施待ち"],
  入金中: ["入金待ち", "入金済"],
  失注: ["失注"],
  クローズ: ["クローズ"],
};

// 次のフェーズの最初のステータス
export const NEXT_PHASE_FIRST_STATUS: Record<string, string> = {
  商談中: "書類準備中",
  審査中: "下見日程調整中",
  工事中: "入金待ち",
  入金中: "クローズ",
};

// 全ステータス一覧（順序付き）
export const ALL_CONTRACT_STATUSES = [
  "日程調整中",
  "MTG実施待ち",
  "見積提出",
  "受注確定",
  "書類準備中",
  "審査結果待ち",
  "可決",
  "否決",
  "下見日程調整中",
  "下見実施待ち",
  "工事日程調整中",
  "工事実施待ち",
  "入金待ち",
  "入金済",
  "失注",
  "クローズ",
] as const;

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
  準備中: "準備中",
  審査結果待ち: "審査結果待ち",
  可決: "可決",
  否決: "否決",
  条件付可決: "条件付可決",
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
  入金予定: "入金予定",
  入金済: "入金済",
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
  未着手: "未着手",
  進行中: "進行中",
  完了: "完了",
} as const;

// タスク優先度ラベル
export const TASK_PRIORITY_LABELS = {
  high: "高",
  medium: "中",
  low: "低",
} as const;

// タスク担当会社ラベル（デフォルト選択肢）
export const TASK_COMPANY_OPTIONS = [
  "自社",
  "リース会社",
  "工事業者",
  "その他",
] as const;

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
