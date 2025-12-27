// ========================================
// カラー定義（一元管理）
// ========================================

/**
 * 契約ステージのカラー定義
 * Badge表示用（bg/text/border形式）- ステップより濃い色
 */
export const stageColors: Record<string, string> = {
  商談中: "bg-blue-200 text-blue-800 border-blue-300",
  "審査・申込中": "bg-yellow-200 text-yellow-800 border-yellow-300",
  "下見・工事中": "bg-purple-200 text-purple-800 border-purple-300",
  契約中: "bg-indigo-200 text-indigo-800 border-indigo-300",
  入金中: "bg-green-200 text-green-800 border-green-300",
  請求中: "bg-teal-200 text-teal-800 border-teal-300",
  完了: "bg-gray-200 text-gray-800 border-gray-300",
  否決: "bg-red-200 text-red-800 border-red-300",
  // 旧ステージ（後方互換性）
  審査中: "bg-yellow-200 text-yellow-800 border-yellow-300",
  工事中: "bg-purple-200 text-purple-800 border-purple-300",
  失注: "bg-red-200 text-red-800 border-red-300",
  クローズ: "bg-gray-200 text-gray-800 border-gray-300",
};

/**
 * 契約ステップのカラー定義
 * Badge表示用（bg/text/border形式）- ステージより控えめ（背景なし、ボーダーのみ）
 */
export const stepColors: Record<string, string> = {
  // 商談中
  商談待ち: "bg-white text-blue-600 border-blue-300",
  商談日程調整中: "bg-white text-blue-600 border-blue-300",
  // 審査・申込中
  "審査・申込対応中": "bg-white text-yellow-600 border-yellow-300",
  "審査・申込待ち": "bg-white text-yellow-600 border-yellow-300",
  // 下見・工事中
  下見調整中: "bg-white text-purple-600 border-purple-300",
  下見実施待ち: "bg-white text-purple-600 border-purple-300",
  工事日程調整中: "bg-white text-purple-600 border-purple-300",
  工事実施待ち: "bg-white text-purple-600 border-purple-300",
  // 契約中
  検収確認中: "bg-white text-indigo-600 border-indigo-300",
  契約書提出対応中: "bg-white text-indigo-600 border-indigo-300",
  契約書確認待ち: "bg-white text-indigo-600 border-indigo-300",
  // 入金中
  入金待ち: "bg-white text-green-600 border-green-300",
  入金済: "bg-white text-green-600 border-green-300",
  // 請求中
  初回請求確認待ち: "bg-white text-teal-600 border-teal-300",
  請求処理対応中: "bg-white text-teal-600 border-teal-300",
  // 完了
  クローズ: "bg-white text-gray-600 border-gray-300",
  // 否決
  対応検討中: "bg-white text-red-600 border-red-300",
  失注: "bg-white text-red-600 border-red-300",
  // 旧ステップ（後方互換性）
  日程調整中: "bg-white text-blue-600 border-blue-300",
  MTG実施待ち: "bg-white text-blue-600 border-blue-300",
  見積提出: "bg-white text-blue-600 border-blue-300",
  受注確定: "bg-white text-blue-600 border-blue-300",
  書類準備中: "bg-white text-yellow-600 border-yellow-300",
  審査結果待ち: "bg-white text-yellow-600 border-yellow-300",
  可決: "bg-white text-green-600 border-green-300",
  否決: "bg-white text-red-600 border-red-300",
  下見日程調整中: "bg-white text-purple-600 border-purple-300",
};

/**
 * 案件一覧用のステップカラー
 * ステージとステップの両方に対応（後方互換性）
 */
export const dealStepColors: Record<string, string> = {
  // ステップ
  ...stepColors,
  // ステージ（後方互換性）- ステージはステップより濃い色
  商談中: "bg-blue-200 text-blue-800 border-blue-300",
  "審査・申込中": "bg-yellow-200 text-yellow-800 border-yellow-300",
  "下見・工事中": "bg-purple-200 text-purple-800 border-purple-300",
  契約中: "bg-indigo-200 text-indigo-800 border-indigo-300",
  入金中: "bg-green-200 text-green-800 border-green-300",
  請求中: "bg-teal-200 text-teal-800 border-teal-300",
  完了: "bg-gray-200 text-gray-800 border-gray-300",
  否決: "bg-red-200 text-red-800 border-red-300",
};

/**
 * StatusWorkflow用のステージカラー
 * ワークフロー表示用（bg/border/text/active形式）
 * - bg: 現在のステージの丸の背景
 * - active: 現在のステップボタンの背景
 */
export const workflowStageColors: Record<string, { bg: string; border: string; text: string; active: string }> = {
  商談中: {
    bg: "bg-blue-200",
    border: "border-blue-300",
    text: "text-blue-800",
    active: "bg-blue-500",
  },
  "審査・申込中": {
    bg: "bg-yellow-200",
    border: "border-yellow-300",
    text: "text-yellow-800",
    active: "bg-yellow-500",
  },
  "下見・工事中": {
    bg: "bg-purple-200",
    border: "border-purple-300",
    text: "text-purple-800",
    active: "bg-purple-500",
  },
  契約中: {
    bg: "bg-indigo-200",
    border: "border-indigo-300",
    text: "text-indigo-800",
    active: "bg-indigo-500",
  },
  入金中: {
    bg: "bg-green-200",
    border: "border-green-300",
    text: "text-green-800",
    active: "bg-green-500",
  },
  請求中: {
    bg: "bg-teal-200",
    border: "border-teal-300",
    text: "text-teal-800",
    active: "bg-teal-500",
  },
  完了: {
    bg: "bg-gray-200",
    border: "border-gray-300",
    text: "text-gray-800",
    active: "bg-gray-500",
  },
  否決: {
    bg: "bg-red-200",
    border: "border-red-300",
    text: "text-red-800",
    active: "bg-red-500",
  },
  // 旧ステージ（後方互換性）
  審査中: {
    bg: "bg-yellow-200",
    border: "border-yellow-300",
    text: "text-yellow-800",
    active: "bg-yellow-500",
  },
  工事中: {
    bg: "bg-purple-200",
    border: "border-purple-300",
    text: "text-purple-800",
    active: "bg-purple-500",
  },
  失注: {
    bg: "bg-red-200",
    border: "border-red-300",
    text: "text-red-800",
    active: "bg-red-500",
  },
  クローズ: {
    bg: "bg-gray-200",
    border: "border-gray-300",
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
