export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: "admin" | "manager" | "sales";
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: "admin" | "manager" | "sales";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: "admin" | "manager" | "sales";
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
          assigned_user_id: string;
          title: string;
          status: "active" | "won" | "lost" | "pending";
          description: string | null;
          total_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          assigned_user_id: string;
          title: string;
          status?: "active" | "won" | "lost" | "pending";
          description?: string | null;
          total_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          assigned_user_id?: string;
          title?: string;
          status?: "active" | "won" | "lost" | "pending";
          description?: string | null;
          total_amount?: number | null;
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
            foreignKeyName: "deals_assigned_user_id_fkey";
            columns: ["assigned_user_id"];
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
          contract_type: "lease" | "rental" | "installment";
          product_category: string | null;
          lease_company: string | null;
          status: "negotiating" | "quote_submitted" | "accepted" | "rejected" | "document_collection" | "review_requested" | "review_pending" | "review_approved" | "review_rejected" | "survey_scheduling" | "survey_completed" | "installation_scheduling" | "installation_completed" | "delivered" | "payment_pending" | "completed";
          monthly_amount: number | null;
          total_amount: number | null;
          contract_months: number | null;
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          title: string;
          contract_type: "lease" | "rental" | "installment";
          product_category?: string | null;
          lease_company?: string | null;
          status?: "negotiating" | "quote_submitted" | "accepted" | "rejected" | "document_collection" | "review_requested" | "review_pending" | "review_approved" | "review_rejected" | "survey_scheduling" | "survey_completed" | "installation_scheduling" | "installation_completed" | "delivered" | "payment_pending" | "completed";
          monthly_amount?: number | null;
          total_amount?: number | null;
          contract_months?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          title?: string;
          contract_type?: "lease" | "rental" | "installment";
          product_category?: string | null;
          lease_company?: string | null;
          status?: "negotiating" | "quote_submitted" | "accepted" | "rejected" | "document_collection" | "review_requested" | "review_pending" | "review_approved" | "review_rejected" | "survey_scheduling" | "survey_completed" | "installation_scheduling" | "installation_completed" | "delivered" | "payment_pending" | "completed";
          monthly_amount?: number | null;
          total_amount?: number | null;
          contract_months?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
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
          status: "preparing" | "reviewing" | "approved" | "rejected" | "conditionally_approved";
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
          status?: "preparing" | "reviewing" | "approved" | "rejected" | "conditionally_approved";
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
          status?: "preparing" | "reviewing" | "approved" | "rejected" | "conditionally_approved";
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
          status: "pending" | "paid";
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
          status?: "pending" | "paid";
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
          status?: "pending" | "paid";
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
      // 活動履歴（商談単位）
      activities: {
        Row: {
          id: string;
          deal_id: string;
          user_id: string;
          activity_type: "phone" | "visit" | "email" | "online_meeting" | "other";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          user_id: string;
          activity_type: "phone" | "visit" | "email" | "online_meeting" | "other";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          user_id?: string;
          activity_type?: "phone" | "visit" | "email" | "online_meeting" | "other";
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
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
          status: "not_started" | "in_progress" | "completed";
          priority: "high" | "medium" | "low";
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
          status?: "not_started" | "in_progress" | "completed";
          priority?: "high" | "medium" | "low";
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
          status?: "not_started" | "in_progress" | "completed";
          priority?: "high" | "medium" | "low";
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
