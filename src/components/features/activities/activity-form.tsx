"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface ActivityFormProps {
  contractId: string;
  userId: string;
}

export function ActivityForm({ contractId, userId }: ActivityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("activities").insert({
      user_id: userId,
      activity_type: "other",
      contract_id: contractId,
      content: content.trim(),
    });

    if (error) {
      console.error("Error creating activity:", error);
    } else {
      setContent("");
      router.refresh();
    }

    setLoading(false);
  };

  const isSubmitDisabled = loading || !content.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
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
