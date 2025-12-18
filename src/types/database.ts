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
      };
      deals: {
        Row: {
          id: string;
          customer_id: string;
          assigned_user_id: string;
          title: string;
          status: string;
          contract_type: "lease" | "rental" | "installment";
          product_category: string | null;
          estimated_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          assigned_user_id: string;
          title: string;
          status?: string;
          contract_type: "lease" | "rental" | "installment";
          product_category?: string | null;
          estimated_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          assigned_user_id?: string;
          title?: string;
          status?: string;
          contract_type?: "lease" | "rental" | "installment";
          product_category?: string | null;
          estimated_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lease_applications: {
        Row: {
          id: string;
          deal_id: string;
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
          deal_id: string;
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
          deal_id?: string;
          lease_company?: string;
          status?: "preparing" | "reviewing" | "approved" | "rejected" | "conditionally_approved";
          submitted_at?: string | null;
          result_at?: string | null;
          conditions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      installations: {
        Row: {
          id: string;
          deal_id: string;
          status: "not_started" | "survey_scheduling" | "survey_completed" | "installation_scheduling" | "installation_completed";
          survey_date: string | null;
          installation_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          status?: "not_started" | "survey_scheduling" | "survey_completed" | "installation_scheduling" | "installation_completed";
          survey_date?: string | null;
          installation_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          status?: "not_started" | "survey_scheduling" | "survey_completed" | "installation_scheduling" | "installation_completed";
          survey_date?: string | null;
          installation_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          deal_id: string;
          lease_company: string | null;
          expected_amount: number | null;
          actual_amount: number | null;
          expected_date: string | null;
          actual_date: string | null;
          status: "pending" | "paid";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          lease_company?: string | null;
          expected_amount?: number | null;
          actual_amount?: number | null;
          expected_date?: string | null;
          actual_date?: string | null;
          status?: "pending" | "paid";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          lease_company?: string | null;
          expected_amount?: number | null;
          actual_amount?: number | null;
          expected_date?: string | null;
          actual_date?: string | null;
          status?: "pending" | "paid";
          created_at?: string;
          updated_at?: string;
        };
      };
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
      };
      tasks: {
        Row: {
          id: string;
          deal_id: string | null;
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
          assigned_user_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status?: "not_started" | "in_progress" | "completed";
          priority?: "high" | "medium" | "low";
          created_at?: string;
          updated_at?: string;
        };
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
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
