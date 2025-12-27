// ========================================
// カラー定義（一元管理）
// ========================================

/**
 * 契約ステージのカラー定義
 * Badge表示用（bg/text/border形式）
 */
export const stageColors: Record<string, string> = {
  商談中: "bg-blue-100 text-blue-800 border-blue-200",
  "審査・申込中": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "下見・工事中": "bg-purple-100 text-purple-800 border-purple-200",
  契約中: "bg-indigo-100 text-indigo-800 border-indigo-200",
  入金中: "bg-green-100 text-green-800 border-green-200",
  請求中: "bg-teal-100 text-teal-800 border-teal-200",
  完了: "bg-gray-100 text-gray-800 border-gray-200",
  否決: "bg-red-100 text-red-800 border-red-200",
  // 旧ステージ（後方互換性）
  審査中: "bg-yellow-100 text-yellow-800 border-yellow-200",
  工事中: "bg-purple-100 text-purple-800 border-purple-200",
  失注: "bg-red-100 text-red-800 border-red-200",
  クローズ: "bg-gray-100 text-gray-800 border-gray-200",
};

/**
 * 契約ステップのカラー定義
 * Badge表示用（bg/text/border形式）
 */
export const stepColors: Record<string, string> = {
  // 商談中
  商談待ち: "bg-blue-50 text-blue-700 border-blue-200",
  商談日程調整中: "bg-blue-50 text-blue-700 border-blue-200",
  // 審査・申込中
  "審査・申込対応中": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "審査・申込待ち": "bg-yellow-50 text-yellow-700 border-yellow-200",
  // 下見・工事中
  下見調整中: "bg-purple-50 text-purple-700 border-purple-200",
  下見実施待ち: "bg-purple-50 text-purple-700 border-purple-200",
  工事日程調整中: "bg-purple-50 text-purple-700 border-purple-200",
  工事実施待ち: "bg-purple-50 text-purple-700 border-purple-200",
  // 契約中
  検収確認中: "bg-indigo-50 text-indigo-700 border-indigo-200",
  契約書提出対応中: "bg-indigo-50 text-indigo-700 border-indigo-200",
  契約書確認待ち: "bg-indigo-50 text-indigo-700 border-indigo-200",
  // 入金中
  入金待ち: "bg-green-50 text-green-700 border-green-200",
  入金済: "bg-green-100 text-green-800 border-green-200",
  // 請求中
  初回請求確認待ち: "bg-teal-50 text-teal-700 border-teal-200",
  請求処理対応中: "bg-teal-50 text-teal-700 border-teal-200",
  // 完了
  クローズ: "bg-gray-100 text-gray-800 border-gray-200",
  // 否決
  対応検討中: "bg-orange-50 text-orange-700 border-orange-200",
  失注: "bg-red-100 text-red-800 border-red-200",
  // 旧ステップ（後方互換性）
  日程調整中: "bg-blue-50 text-blue-700 border-blue-200",
  MTG実施待ち: "bg-blue-50 text-blue-700 border-blue-200",
  見積提出: "bg-blue-50 text-blue-700 border-blue-200",
  受注確定: "bg-blue-100 text-blue-800 border-blue-200",
  書類準備中: "bg-yellow-50 text-yellow-700 border-yellow-200",
  審査結果待ち: "bg-yellow-50 text-yellow-700 border-yellow-200",
  可決: "bg-green-100 text-green-800 border-green-200",
  否決: "bg-red-100 text-red-800 border-red-200",
  下見日程調整中: "bg-purple-50 text-purple-700 border-purple-200",
};

/**
 * 案件一覧用のステップカラー
 * ステージとステップの両方に対応（後方互換性）
 */
export const dealStepColors: Record<string, string> = {
  // ステップ
  ...stepColors,
  // ステージ（後方互換性）
  商談中: "bg-blue-100 text-blue-800 border-blue-200",
  "審査・申込中": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "下見・工事中": "bg-purple-100 text-purple-800 border-purple-200",
  契約中: "bg-indigo-100 text-indigo-800 border-indigo-200",
  入金中: "bg-green-100 text-green-800 border-green-200",
  請求中: "bg-teal-100 text-teal-800 border-teal-200",
  完了: "bg-gray-100 text-gray-800 border-gray-200",
  否決: "bg-red-100 text-red-800 border-red-200",
};

/**
 * StatusWorkflow用のステージカラー
 * ワークフロー表示用（bg/border/text/active形式）
 */
export const workflowStageColors: Record<string, { bg: string; border: string; text: string; active: string }> = {
  商談中: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    active: "bg-blue-500",
  },
  "審査・申込中": {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    active: "bg-yellow-500",
  },
  "下見・工事中": {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    active: "bg-purple-500",
  },
  契約中: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-800",
    active: "bg-indigo-500",
  },
  入金中: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    active: "bg-green-500",
  },
  請求中: {
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-800",
    active: "bg-teal-500",
  },
  完了: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-800",
    active: "bg-gray-500",
  },
  否決: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    active: "bg-red-500",
  },
  // 旧ステージ（後方互換性）
  審査中: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-800",
    active: "bg-yellow-500",
  },
  工事中: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    active: "bg-purple-500",
  },
  失注: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    active: "bg-red-500",
  },
  クローズ: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-800",
    active: "bg-gray-500",
  },
};

/**
 * タスク優先度のカラー定義
 */
export const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

/**
 * タスクステータスのカラー定義
 */
export const taskStatusColors: Record<string, string> = {
  未着手: "bg-gray-100 text-gray-800 border-gray-200",
  進行中: "bg-blue-100 text-blue-800 border-blue-200",
  完了: "bg-green-100 text-green-800 border-green-200",
};
