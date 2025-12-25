"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Edit2, Shield, User as UserIcon } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "管理者",
  user: "一般ユーザー",
  // 後方互換性
  manager: "マネージャー",
  sales: "営業",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  user: "bg-blue-100 text-blue-800",
  manager: "bg-purple-100 text-purple-800",
  sales: "bg-green-100 text-green-800",
};

interface UserManagementProps {
  users: User[];
  isAdmin: boolean;
}

export function UserManagement({ users, isAdmin }: UserManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    user: User | null;
    name: string;
    role: string;
  }>({
    open: false,
    user: null,
    name: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);

  const openEditDialog = (user: User) => {
    setEditDialog({
      open: true,
      user,
      name: user.name,
      role: user.role || "user",
    });
  };

  const handleSave = async () => {
    if (!editDialog.user) return;

    setLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("users")
        .update({
          name: editDialog.name,
          role: editDialog.role as "admin" | "user",
        })
        .eq("id", editDialog.user.id);

      if (error) throw error;

      toast({
        title: "ユーザー情報を更新しました",
        description: `${editDialog.name}の情報を更新しました`,
      });

      setEditDialog({ open: false, user: null, name: "", role: "user" });
      router.refresh();
    } catch (err) {
      toast({
        title: "エラーが発生しました",
        description: err instanceof Error ? err.message : "更新中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            ユーザー一覧
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>名前</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>権限</TableHead>
                <TableHead>登録日</TableHead>
                {isAdmin && <TableHead className="w-[80px]">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[user.role || "user"]}>
                      {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                      {ROLE_LABELS[user.role || "user"]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {user.created_at
                      ? format(new Date(user.created_at), "yyyy/MM/dd", { locale: ja })
                      : "-"}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    ユーザーがありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialog({ open: false, user: null, name: "", role: "user" });
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>ユーザー編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">名前</Label>
              <Input
                id="user-name"
                value={editDialog.name}
                onChange={(e) => setEditDialog({ ...editDialog, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">メールアドレス</Label>
              <Input
                id="user-email"
                value={editDialog.user?.email || ""}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">メールアドレスは変更できません</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">権限</Label>
              <Select
                value={editDialog.role}
                onValueChange={(value) => setEditDialog({ ...editDialog, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理者</SelectItem>
                  <SelectItem value="user">一般ユーザー</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                管理者は全ての設定を変更できます
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, user: null, name: "", role: "user" })}
            >
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
