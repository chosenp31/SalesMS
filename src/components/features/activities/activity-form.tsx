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
import { Plus, Phone, Users, Mail, Video, FileText } from "lucide-react";

// 活動種別の型
type ActivityType = "phone" | "visit" | "email" | "online_meeting" | "other";

// 活動種別に対応するアイコン
const activityTypeIcons: Record<ActivityType, React.ReactNode> = {
  phone: <Phone className="h-4 w-4" />,
  visit: <Users className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  online_meeting: <Video className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

// 選択可能な活動種別（status_changeは自動記録のみなので除外）
const selectableActivityTypes = Object.entries(ACTIVITY_TYPE_LABELS).filter(
  ([key]) => key !== "status_change"
);

interface ActivityFormProps {
  contractId: string;
  userId: string;
}

export function ActivityForm({ contractId, userId }: ActivityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("phone");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("activities").insert({
      user_id: userId,
      activity_type: activityType,
      contract_id: contractId,
      content: content.trim(),
    });

    if (error) {
      console.error("Error creating activity:", error);
    } else {
      setContent("");
      setActivityType("phone");
      router.refresh();
    }

    setLoading(false);
  };

  const isSubmitDisabled = loading || !content.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="activity-type">活動種別</Label>
          <Select value={activityType} onValueChange={(value) => setActivityType(value as ActivityType)}>
            <SelectTrigger id="activity-type" className="w-full sm:w-[200px]">
              <SelectValue placeholder="活動種別を選択" />
            </SelectTrigger>
            <SelectContent>
              {selectableActivityTypes.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    {activityTypeIcons[value as ActivityType]}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitDisabled}>
          <Plus className="h-4 w-4 mr-2" />
          {loading ? "追加中..." : "活動を追加"}
        </Button>
      </div>
    </form>
  );
}
