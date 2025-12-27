export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// 契約ステップの型 - string型で新旧両方の値に対応
export type ContractStepType = string;

// 契約ステージの型 - string型で新旧両方の値に対応
export type ContractStageType = string;

// 後方互換性のためのエイリアス
/** @deprecated ContractStepType を使用してください */
export type ContractStatusType = ContractStepType;
/** @deprecated ContractStageType を使用してください */
export type ContractPhaseType = ContractStageType;

// 契約種別の型 - string型で新旧両方の値に対応
export type ContractTypeValue = string;

// リース審査ステータスの型
export type LeaseApplicationStatusType =
  | "準備中"
  | "審査結果待ち"
  | "可決"
  | "否決"
  | "条件付可決";

// 入金ステータスの型
export type PaymentStatusType = "入金予定" | "入金済";

// タスクステータスの型
export type TaskStatusType = "未着手" | "進行中" | "完了";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: "admin" | "user";
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: "admin" | "user";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: "admin" | "user";
          created_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          company_name: string;
          representative_name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          business_type: "corporation" | "sole_proprietor" | "new_corporation";
          customer_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          representative_name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          business_type: "corporation" | "sole_proprietor" | "new_corporation";
          customer_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          representative_name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          business_type?: "corporation" | "sole_proprietor" | "new_corporation";
          customer_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // 商談テーブル（顧客への提案全体を管理）
      deals: {
        Row: {
          id: string;
          customer_id: string;
          sales_user_id: string;
          appointer_user_id: string;
          title: string;
          status: "active" | "won" | "lost" | "pending";
          description: string | null;
          total_amount: number | null;
          deal_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          sales_user_id: string;
          appointer_user_id: string;
          title: string;
          status?: "active" | "won" | "lost" | "pending";
          description?: string | null;
          total_amount?: number | null;
          deal_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          sales_user_id?: string;
          appointer_user_id?: string;
          title?: string;
          status?: "active" | "won" | "lost" | "pending";
          description?: string | null;
          total_amount?: number | null;
          deal_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deals_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_sales_user_id_fkey";
            columns: ["sales_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_appointer_user_id_fkey";
            columns: ["appointer_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      // 契約テーブル（個別の契約を管理）
      contracts: {
        Row: {
          id: string;
          deal_id: string;
          title: string;
          contract_type: ContractTypeValue;
          product_category: string | null;
          lease_company: string | null;
          stage: ContractStageType;
          step: ContractStepType;
          monthly_amount: number | null;
          total_amount: number | null;
          contract_months: number | null;
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          contract_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          title: string;
          contract_type: ContractTypeValue;
          product_category?: string | null;
          lease_company?: string | null;
          stage?: ContractStageType;
          step?: ContractStepType;
          monthly_amount?: number | null;
          total_amount?: number | null;
          contract_months?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          contract_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          title?: string;
          contract_type?: ContractTypeValue;
          product_category?: string | null;
          lease_company?: string | null;
          stage?: ContractStageType;
          step?: ContractStepType;
          monthly_amount?: number | null;
          total_amount?: number | null;
          contract_months?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          contract_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          }
        ];
      };
      // リース審査（契約単位）
      lease_applications: {
        Row: {
          id: string;
          contract_id: string;
          lease_company: string;
          status: LeaseApplicationStatusType;
          submitted_at: string | null;
          result_at: string | null;
          conditions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          lease_company: string;
          status?: LeaseApplicationStatusType;
          submitted_at?: string | null;
          result_at?: string | null;
          conditions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          lease_company?: string;
          status?: LeaseApplicationStatusType;
          submitted_at?: string | null;
          result_at?: string | null;
          conditions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lease_applications_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          }
        ];
      };
      // 入金（契約単位）
      payments: {
        Row: {
          id: string;
          contract_id: string;
          payment_type: "initial" | "monthly" | "final" | "other";
          expected_amount: number | null;
          actual_amount: number | null;
          expected_date: string | null;
          actual_date: string | null;
          status: PaymentStatusType;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          payment_type?: "initial" | "monthly" | "final" | "other";
          expected_amount?: number | null;
          actual_amount?: number | null;
          expected_date?: string | null;
          actual_date?: string | null;
          status?: PaymentStatusType;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          payment_type?: "initial" | "monthly" | "final" | "other";
          expected_amount?: number | null;
          actual_amount?: number | null;
          expected_date?: string | null;
          actual_date?: string | null;
          status?: PaymentStatusType;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          }
        ];
      };
      // 活動履歴（契約単位）
      activities: {
        Row: {
          id: string;
          contract_id: string;
          user_id: string;
          activity_type: "phone" | "visit" | "email" | "online_meeting" | "status_change" | "other";
          content: string;
          is_status_change: boolean;
          status_change_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          user_id: string;
          activity_type: "phone" | "visit" | "email" | "online_meeting" | "status_change" | "other";
          content: string;
          is_status_change?: boolean;
          status_change_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          user_id?: string;
          activity_type?: "phone" | "visit" | "email" | "online_meeting" | "status_change" | "other";
          content?: string;
          is_status_change?: boolean;
          status_change_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      // タスク（商談または契約に紐づけ可能）
      tasks: {
        Row: {
          id: string;
          deal_id: string | null;
          contract_id: string | null;
          assigned_user_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          status: TaskStatusType;
          priority: "high" | "medium" | "low";
          company: string | null;
          task_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id?: string | null;
          contract_id?: string | null;
          assigned_user_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          status?: TaskStatusType;
          priority?: "high" | "medium" | "low";
          company?: string | null;
          task_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string | null;
          contract_id?: string | null;
          assigned_user_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status?: TaskStatusType;
          priority?: "high" | "medium" | "low";
          company?: string | null;
          task_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assigned_user_id_fkey";
            columns: ["assigned_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      // ステップ変更履歴
      contract_status_history: {
        Row: {
          id: string;
          contract_id: string;
          changed_by_user_id: string;
          previous_step: string | null;
          new_step: string;
          previous_stage: string | null;
          new_stage: string;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          changed_by_user_id: string;
          previous_step?: string | null;
          new_step: string;
          previous_stage?: string | null;
          new_stage: string;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          changed_by_user_id?: string;
          previous_step?: string | null;
          new_step?: string;
          previous_stage?: string | null;
          new_stage?: string;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contract_status_history_contract_id_fkey";
            columns: ["contract_id"];
            isOneToOne: false;
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contract_status_history_changed_by_user_id_fkey";
            columns: ["changed_by_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      // タスク名マスタ
      task_name_master: {
        Row: {
          id: string;
          contract_type: "property" | "line" | "maintenance";
          name: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contract_type: "property" | "line" | "maintenance";
          name: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contract_type?: "property" | "line" | "maintenance";
          name?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // 商材マスタ
      product_master: {
        Row: {
          id: string;
          contract_type: "property" | "line" | "maintenance";
          name: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contract_type: "property" | "line" | "maintenance";
          name: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contract_type?: "property" | "line" | "maintenance";
          name?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // タスク履歴
      task_history: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          action: "created" | "updated" | "status_changed" | "deleted";
          old_values: Record<string, unknown> | null;
          new_values: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          action: "created" | "updated" | "status_changed" | "deleted";
          old_values?: Record<string, unknown> | null;
          new_values?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          action?: "created" | "updated" | "status_changed" | "deleted";
          old_values?: Record<string, unknown> | null;
          new_values?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_history_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      // 変更履歴テーブル（全エンティティ共通）
      entity_history: {
        Row: {
          id: string;
          entity_type: "customer" | "deal" | "contract" | "task" | "payment";
          entity_id: string;
          action: "created" | "updated" | "deleted";
          user_id: string | null;
          changes: Record<string, { old: unknown; new: unknown }> | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: "customer" | "deal" | "contract" | "task" | "payment";
          entity_id: string;
          action: "created" | "updated" | "deleted";
          user_id?: string | null;
          changes?: Record<string, { old: unknown; new: unknown }> | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: "customer" | "deal" | "contract" | "task" | "payment";
          entity_id?: string;
          action?: "created" | "updated" | "deleted";
          user_id?: string | null;
          changes?: Record<string, { old: unknown; new: unknown }> | null;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entity_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
