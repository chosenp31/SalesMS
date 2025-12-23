"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CustomerList } from "@/components/features/customers/customer-list";
import { CustomerDialog } from "@/components/features/customers/customer-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCustomers = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customers:", error);
    }
    setCustomers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
          <p className="text-sm text-gray-500">
            顧客情報の一覧と管理
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規顧客
        </Button>
      </div>
      <CustomerList customers={customers} />
      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleCustomerCreated}
      />
    </div>
  );
}
