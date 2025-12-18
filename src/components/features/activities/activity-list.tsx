"use client";

import { Activity } from "@/types";
import { ACTIVITY_TYPE_LABELS } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Phone, User, Mail, Video, MoreHorizontal } from "lucide-react";

interface ActivityListProps {
  activities: Activity[];
}

const activityIcons = {
  phone: Phone,
  visit: User,
  email: Mail,
  online_meeting: Video,
  other: MoreHorizontal,
};

const activityColors = {
  phone: "bg-blue-100 text-blue-600",
  visit: "bg-green-100 text-green-600",
  email: "bg-yellow-100 text-yellow-600",
  online_meeting: "bg-purple-100 text-purple-600",
  other: "bg-gray-100 text-gray-600",
};

export function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        活動履歴がありません
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.activity_type];
        return (
          <div
            key={activity.id}
            className="flex space-x-4 p-4 bg-gray-50 rounded-lg"
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                activityColors[activity.activity_type]
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {activity.user?.name || "不明"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {format(new Date(activity.created_at), "yyyy/MM/dd HH:mm", {
                    locale: ja,
                  })}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                {activity.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
