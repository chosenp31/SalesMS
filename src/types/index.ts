export * from "./database";

// Extended types with relations
export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "sales";
  created_at: string;
};

export type Customer = {
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

export type Deal = {
  id: string;
  customer_id: string;
  assigned_user_id: string;
  title: string;
  status: DealStatus;
  contract_type: "lease" | "rental" | "installment";
  product_category: string | null;
  estimated_amount: number | null;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  assigned_user?: User;
  activities?: Activity[];
  lease_applications?: LeaseApplication[];
  installation?: Installation;
};

export type LeaseApplication = {
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

export type Installation = {
  id: string;
  deal_id: string;
  status: "not_started" | "survey_scheduling" | "survey_completed" | "installation_scheduling" | "installation_completed";
  survey_date: string | null;
  installation_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
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

export type Activity = {
  id: string;
  deal_id: string;
  user_id: string;
  activity_type: "phone" | "visit" | "email" | "online_meeting" | "other";
  content: string;
  created_at: string;
  // Relations
  user?: User;
};

export type Task = {
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
  // Relations
  deal?: Deal;
  assigned_user?: User;
};

// Deal status type
export type DealStatus =
  // Sales phase
  | "appointment_acquired"
  | "in_negotiation"
  | "quote_submitted"
  | "deal_won"
  | "deal_lost"
  // Contract phase
  | "contract_type_selection"
  | "document_collection"
  | "review_requested"
  | "review_pending"
  | "review_approved"
  | "review_rejected"
  // Installation phase
  | "survey_scheduling"
  | "survey_completed"
  | "installation_scheduling"
  | "installation_completed"
  // Completion phase
  | "delivery_completed"
  | "payment_pending"
  | "completed";

// Phase type
export type DealPhase = "sales" | "contract" | "installation" | "completion";
