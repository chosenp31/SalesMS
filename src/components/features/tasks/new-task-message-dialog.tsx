"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Info } from "lucide-react";
import Link from "next/link";

export function NewTaskMessageDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新規タスク
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>新規タスク作成</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm text-blue-900 font-medium">
                契約管理画面からタスクを作成してください
              </p>
              <p className="text-xs text-blue-700">
                タスクは契約に紐づけて管理されます。
                契約詳細画面の「タスク追加」ボタンから作成できます。
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            閉じる
          </Button>
          <Link href="/contracts">
            <Button onClick={() => setOpen(false)}>
              契約一覧へ
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
