"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { LeaseApplication } from "@/types";
import { LEASE_APPLICATION_STATUS_LABELS, LEASE_COMPANIES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";

const applicationSchema = z.object({
  lease_company: z.string().min(1, "リース会社を選択してください"),
  status: z.enum([
    "preparing",
    "reviewing",
    "approved",
    "rejected",
    "conditionally_approved",
  ]),
  submitted_at: z.string().optional(),
  result_at: z.string().optional(),
  conditions: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

interface LeaseApplicationsProps {
  contractId: string;
  applications: LeaseApplication[];
}

const statusColors = {
  preparing: "bg-gray-100 text-gray-800",
  reviewing: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  conditionally_approved: "bg-yellow-100 text-yellow-800",
};

function ApplicationDialog({
  contractId,
  application,
  trigger,
}: {
  contractId: string;
  application?: LeaseApplication;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      lease_company: application?.lease_company || "",
      status: application?.status || "preparing",
      submitted_at: application?.submitted_at?.split("T")[0] || "",
      result_at: application?.result_at?.split("T")[0] || "",
      conditions: application?.conditions || "",
    },
  });

  const onSubmit = async (data: ApplicationFormValues) => {
    setLoading(true);
    const supabase = createClient();

    const applicationData = {
      contract_id: contractId,
      lease_company: data.lease_company,
      status: data.status,
      submitted_at: data.submitted_at || null,
      result_at: data.result_at || null,
      conditions: data.conditions || null,
    };

    if (application) {
      await supabase
        .from("lease_applications")
        .update(applicationData)
        .eq("id", application.id);
    } else {
      await supabase.from("lease_applications").insert(applicationData);
    }

    setLoading(false);
    setOpen(false);
    form.reset();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {application ? "審査申請を編集" : "新規審査申請"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="lease_company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>リース会社 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="リース会社を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEASE_COMPANIES.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ステータス</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="ステータスを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(LEASE_APPLICATION_STATUS_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="submitted_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>申請日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="result_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>結果日</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>条件・備考</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="条件付き可決の場合の条件など"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "保存中..." : application ? "更新" : "作成"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function LeaseApplications({
  contractId,
  applications,
}: LeaseApplicationsProps) {
  const router = useRouter();

  const handleDelete = async (applicationId: string) => {
    if (!confirm("この審査申請を削除しますか？")) return;

    const supabase = createClient();
    await supabase.from("lease_applications").delete().eq("id", applicationId);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          リース審査
        </CardTitle>
        <ApplicationDialog
          contractId={contractId}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              審査申請
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            審査申請がありません
          </p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{app.lease_company}</span>
                    <Badge
                      variant="secondary"
                      className={cn(statusColors[app.status])}
                    >
                      {LEASE_APPLICATION_STATUS_LABELS[app.status]}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 space-x-4">
                    {app.submitted_at && (
                      <span>
                        申請日:{" "}
                        {format(new Date(app.submitted_at), "yyyy/MM/dd", {
                          locale: ja,
                        })}
                      </span>
                    )}
                    {app.result_at && (
                      <span>
                        結果日:{" "}
                        {format(new Date(app.result_at), "yyyy/MM/dd", {
                          locale: ja,
                        })}
                      </span>
                    )}
                  </div>
                  {app.conditions && (
                    <p className="text-xs text-gray-600 mt-1">{app.conditions}</p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <ApplicationDialog
                    contractId={contractId}
                    application={app}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(app.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
