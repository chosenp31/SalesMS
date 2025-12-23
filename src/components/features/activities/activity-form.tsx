"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ACTIVITY_TYPE_LABELS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Contract {
  id: string;
  title: string;
}

interface ActivityFormProps {
  dealId: string;
  userId: string;
  contracts?: Contract[];
}

type ActivityType = "phone" | "visit" | "email" | "online_meeting" | "other";

export function ActivityForm({ dealId, userId, contracts = [] }: ActivityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("phone");
  const [contractId, setContractId] = useState<string | null>(null);
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("activities").insert({
      deal_id: dealId,
      user_id: userId,
      activity_type: activityType,
      contract_id: contractId,
      content: content.trim(),
    });

    if (error) {
      console.error("Error creating activity:", error);
    } else {
      setContent("");
      setContractId(null);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="activity-type">活動種別</Label>
          <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
            <SelectTrigger id="activity-type">
              <SelectValue placeholder="種別を選択" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {contracts.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="contract-select">関連契約（任意）</Label>
            <Select
              value={contractId || "none"}
              onValueChange={(v) => setContractId(v === "none" ? null : v)}
            >
              <SelectTrigger id="contract-select">
                <SelectValue placeholder="契約を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし（案件全体）</SelectItem>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="activity-content">活動内容・議事録</Label>
        <Textarea
          id="activity-content"
          placeholder="活動内容を入力してください...

【議事録テンプレート】
■ 日時：
■ 参加者：
■ 議題：

■ 決定事項：
  1.
  2.

■ 次回アクション：
  ・担当：期限：
  ・担当：期限："
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[250px] font-mono text-sm"
        />
        <p className="text-xs text-gray-500">
          議事録、電話内容、メール要約など詳細に記録できます
        </p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !content.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          {loading ? "追加中..." : "活動を追加"}
        </Button>
      </div>
    </form>
  );
}
