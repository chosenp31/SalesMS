import { SupabaseClient } from "@supabase/supabase-js";
import { EntityType, HistoryAction, FieldChange } from "@/types";

// 履歴記録の結果型
export type HistoryRecordResult = {
  success: boolean;
  error?: Error;
};

// フィールドの日本語ラベルマッピング
export const FIELD_LABELS: Record<string, Record<string, string>> = {
  customer: {
    company_name: "会社名",
    representative_name: "代表者名",
    phone: "電話番号",
    email: "メールアドレス",
    address: "住所",
    business_type: "事業形態",
  },
  deal: {
    title: "案件名",
    status: "ステータス",
    description: "説明",
    total_amount: "合計金額",
    sales_user_id: "営業担当者",
    appointer_user_id: "アポインター",
    sales_user_name: "営業担当者",
    appointer_user_name: "アポインター",
  },
  contract: {
    title: "契約名",
    contract_type: "契約種類",
    product_category: "商材カテゴリ",
    lease_company: "リース会社",
    phase: "フェーズ",
    status: "ステータス",
    monthly_amount: "月額",
    total_amount: "合計金額",
    contract_months: "契約月数",
    start_date: "開始日",
    end_date: "終了日",
    notes: "備考",
  },
  task: {
    title: "タスク名",
    description: "説明",
    due_date: "期限",
    status: "ステータス",
    priority: "優先度",
    assigned_user_id: "担当者",
    assigned_user_name: "担当者",
  },
  payment: {
    payment_type: "入金種別",
    expected_amount: "予定金額",
    actual_amount: "実績金額",
    expected_date: "予定日",
    actual_date: "実績日",
    status: "ステータス",
    notes: "備考",
  },
};

// 値の表示用変換
export const VALUE_LABELS: Record<string, Record<string, string>> = {
  business_type: {
    corporation: "法人",
    sole_proprietor: "個人事業主",
    new_corporation: "新設法人",
  },
  status: {
    active: "進行中",
    won: "受注",
    lost: "失注",
    pending: "保留",
  },
  priority: {
    high: "高",
    medium: "中",
    low: "低",
  },
  task_status: {
    未着手: "未着手",
    進行中: "進行中",
    完了: "完了",
  },
  payment_type: {
    initial: "初回入金",
    monthly: "月次入金",
    final: "最終入金",
    other: "その他",
  },
  payment_status: {
    入金予定: "入金予定",
    入金済: "入金済",
  },
  contract_type: {
    property: "物件",
    line: "回線",
    maintenance: "保守",
  },
};

// アクションの日本語ラベル
export const ACTION_LABELS: Record<HistoryAction, string> = {
  created: "作成",
  updated: "更新",
  deleted: "削除",
};

// エンティティの日本語ラベル
export const ENTITY_LABELS: Record<EntityType, string> = {
  customer: "顧客",
  deal: "案件",
  contract: "契約",
  task: "タスク",
  payment: "入金",
};

/**
 * 2つのオブジェクトの差分を検出する
 */
export function detectChanges(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown>,
  fieldsToTrack: string[]
): Record<string, FieldChange> | null {
  const changes: Record<string, FieldChange> = {};

  for (const field of fieldsToTrack) {
    const oldValue = oldData?.[field] ?? null;
    const newValue = newData[field] ?? null;

    // 値が異なる場合のみ記録（順序に依存しない比較）
    if (!isEqual(oldValue, newValue)) {
      changes[field] = {
        old: oldValue,
        new: newValue,
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * 深い等価性チェック（JSON.stringifyより安全）
 */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) =>
      isEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  return false;
}

/**
 * 履歴を記録する（エラーハンドリング強化版）
 */
export async function recordHistory(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string,
  action: HistoryAction,
  userId: string | null,
  changes: Record<string, FieldChange> | null,
  comment?: string
): Promise<HistoryRecordResult> {
  try {
    const { error } = await supabase.from("entity_history").insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      user_id: userId,
      changes,
      comment: comment || null,
    });

    if (error) {
      // テーブルが存在しない場合は警告のみ（graceful degradation）
      if (error.code === "42P01") {
        console.warn(
          "entity_history table does not exist. History recording skipped."
        );
        return { success: true };
      }

      // RLS違反の場合も警告のみ
      if (error.code === "42501") {
        console.warn("Insufficient permissions to record history:", error.message);
        return { success: true };
      }

      console.error("Failed to record history:", error);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Unexpected error recording history:", error);
    return { success: false, error };
  }
}

/**
 * 作成履歴を記録する
 */
export async function recordCreate(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string,
  userId: string | null
): Promise<HistoryRecordResult> {
  return recordHistory(supabase, entityType, entityId, "created", userId, null);
}

/**
 * 更新履歴を記録する
 */
export async function recordUpdate(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string,
  userId: string | null,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown>,
  fieldsToTrack: string[],
  comment?: string
): Promise<HistoryRecordResult> {
  const changes = detectChanges(oldData, newData, fieldsToTrack);

  // 変更がない場合は記録しない
  if (!changes && !comment) {
    return { success: true };
  }

  return recordHistory(
    supabase,
    entityType,
    entityId,
    "updated",
    userId,
    changes,
    comment
  );
}

/**
 * 削除履歴を記録する
 */
export async function recordDelete(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string,
  userId: string | null
): Promise<HistoryRecordResult> {
  return recordHistory(supabase, entityType, entityId, "deleted", userId, null);
}

/**
 * ステータス変更履歴を記録する（contract_status_historyの代わりにentity_historyを使用）
 */
export async function recordStatusChange(
  supabase: SupabaseClient,
  contractId: string,
  userId: string | null,
  previousPhase: string | null,
  newPhase: string,
  previousStatus: string | null,
  newStatus: string,
  comment?: string
): Promise<HistoryRecordResult> {
  const changes: Record<string, FieldChange> = {};

  if (previousPhase !== newPhase) {
    changes.phase = { old: previousPhase, new: newPhase };
  }

  if (previousStatus !== newStatus) {
    changes.status = { old: previousStatus, new: newStatus };
  }

  return recordHistory(
    supabase,
    "contract",
    contractId,
    "updated",
    userId,
    Object.keys(changes).length > 0 ? changes : null,
    comment
  );
}

/**
 * 履歴を取得する
 */
export async function getHistory(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityId: string,
  limit: number = 50
) {
  const { data, error } = await supabase
    .from("entity_history")
    .select(
      `
      *,
      user:users(id, name)
    `
    )
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // テーブルが存在しない場合は空配列を返す
    if (error.code === "42P01") {
      console.warn("entity_history table does not exist.");
      return [];
    }
    console.error("Failed to fetch history:", error);
    return [];
  }

  return data || [];
}

/**
 * 値を表示用にフォーマットする
 */
export function formatValue(
  field: string,
  value: unknown,
  entityType: EntityType
): string {
  if (value === null || value === undefined) {
    return "-";
  }

  // 特定のフィールドの値変換
  if (field === "business_type" && typeof value === "string") {
    return VALUE_LABELS.business_type[value] || value;
  }
  if (field === "status" && typeof value === "string") {
    // 案件のステータス
    if (entityType === "deal") {
      return VALUE_LABELS.status[value] || value;
    }
    // その他はそのまま返す（契約ステータスなど）
    return value;
  }
  if (field === "priority" && typeof value === "string") {
    return VALUE_LABELS.priority[value] || value;
  }
  if (field === "payment_type" && typeof value === "string") {
    return VALUE_LABELS.payment_type[value] || value;
  }
  if (field === "contract_type" && typeof value === "string") {
    return VALUE_LABELS.contract_type[value] || value;
  }

  // 金額のフォーマット
  if (
    (field.includes("amount") || field === "total_amount") &&
    typeof value === "number"
  ) {
    return `¥${value.toLocaleString()}`;
  }

  // 日付のフォーマット
  if (
    (field.includes("date") || field === "due_date") &&
    typeof value === "string"
  ) {
    try {
      return new Date(value).toLocaleDateString("ja-JP");
    } catch {
      return value;
    }
  }

  return String(value);
}

/**
 * フィールド名を日本語ラベルに変換する
 */
export function getFieldLabel(field: string, entityType: EntityType): string {
  return FIELD_LABELS[entityType]?.[field] || field;
}
