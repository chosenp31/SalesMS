"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ACTIVITY_TYPE_LABELS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface ActivityFormProps {
  dealId: string;
  userId: string;
}

export function ActivityForm({ dealId, userId }: ActivityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activityType, setActivityType] = useState<string>("phone");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-4">
        <Select value={activityType} onValueChange={setActivityType}>
          <SelectTrigger className="w-40">
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
      <Textarea
        placeholder="活動内容を入力してください..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !content.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          {loading ? "追加中..." : "活動を追加"}
        </Button>
      </div>
    </form>
  );
}
