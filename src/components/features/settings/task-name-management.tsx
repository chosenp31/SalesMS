"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TaskNameMaster, ContractType } from "@/types";
import { CONTRACT_TYPE_LABELS } from "@/constants";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, ListTodo, Trash2 } from "lucide-react";

interface TaskNameManagementProps {
  taskNames: TaskNameMaster[];
  isAdmin: boolean;
}

const CONTRACT_TYPES: ContractType[] = ["property", "line", "maintenance"];

export function TaskNameManagement({ taskNames, isAdmin }: TaskNameManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    isNew: boolean;
    taskName: TaskNameMaster | null;
    contract_type: ContractType;
    name: string;
    display_order: number;
    is_active: boolean;
  }>({
    open: false,
    isNew: false,
    taskName: null,
    contract_type: "property",
    name: "",
    display_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ContractType>("property");
  const [deleteTarget, setDeleteTarget] = useState<TaskNameMaster | null>(null);

  const openNewDialog = (contractType: ContractType) => {
    const maxOrder = Math.max(
      ...taskNames
        .filter((t) => t.contract_type === contractType)
        .map((t) => t.display_order),
      0
    );
    setEditDialog({
      open: true,
      isNew: true,
      taskName: null,
      contract_type: contractType,
      name: "",
      display_order: maxOrder + 1,
      is_active: true,
    });
  };

  const openEditDialog = (taskName: TaskNameMaster) => {
    setEditDialog({
      open: true,
      isNew: false,
      taskName,
      contract_type: taskName.contract_type,
      name: taskName.name,
      display_order: taskName.display_order,
      is_active: taskName.is_active,
    });
  };

  const handleSave = async () => {
    if (!editDialog.name.trim()) {
      toast({
        title: "エラー",
        description: "タスク名を入力してください",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      if (editDialog.isNew) {
        const { error } = await supabase.from("task_name_master").insert({
          contract_type: editDialog.contract_type,
          name: editDialog.name,
          display_order: editDialog.display_order,
          is_active: editDialog.is_active,
        });

        if (error) throw error;

        toast({
          title: "タスク名を追加しました",
          description: `${editDialog.name}を追加しました`,
        });
      } else if (editDialog.taskName) {
        const { error } = await supabase
          .from("task_name_master")
          .update({
            name: editDialog.name,
            display_order: editDialog.display_order,
            is_active: editDialog.is_active,
          })
          .eq("id", editDialog.taskName.id);

        if (error) throw error;

        toast({
          title: "タスク名を更新しました",
          description: `${editDialog.name}を更新しました`,
        });
      }

      setEditDialog({
        open: false,
        isNew: false,
        taskName: null,
        contract_type: "property",
        name: "",
        display_order: 0,
        is_active: true,
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "エラーが発生しました",
        description: err instanceof Error ? err.message : "保存中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (taskName: TaskNameMaster) => {
    setDeleteTarget(taskName);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("task_name_master")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;

      toast({
        title: "タスク名を削除しました",
        description: `${deleteTarget.name}を削除しました`,
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "エラーが発生しました",
        description: err instanceof Error ? err.message : "削除中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (taskName: TaskNameMaster) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("task_name_master")
        .update({ is_active: !taskName.is_active })
        .eq("id", taskName.id);

      if (error) throw error;

      toast({
        title: taskName.is_active ? "無効化しました" : "有効化しました",
        description: `${taskName.name}を${taskName.is_active ? "無効" : "有効"}にしました`,
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "エラーが発生しました",
        description: err instanceof Error ? err.message : "更新中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };

  const filteredTaskNames = (contractType: ContractType) =>
    taskNames.filter((t) => t.contract_type === contractType);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            タスク名マスタ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContractType)}>
            <TabsList className="mb-4">
              {CONTRACT_TYPES.map((type) => (
                <TabsTrigger key={type} value={type}>
                  {CONTRACT_TYPE_LABELS[type] || type}
                </TabsTrigger>
              ))}
            </TabsList>

            {CONTRACT_TYPES.map((type) => (
              <TabsContent key={type} value={type}>
                {isAdmin && (
                  <div className="flex justify-end mb-4">
                    <Button onClick={() => openNewDialog(type)}>
                      <Plus className="h-4 w-4 mr-1" />
                      追加
                    </Button>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[60px]">順序</TableHead>
                      <TableHead>タスク名</TableHead>
                      {isAdmin && <TableHead className="w-[100px]">状態</TableHead>}
                      {isAdmin && <TableHead className="w-[100px]">操作</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTaskNames(type).map((taskName) => (
                      <TableRow key={taskName.id}>
                        <TableCell className="text-gray-600">
                          {taskName.display_order}
                        </TableCell>
                        <TableCell className="font-medium">{taskName.name}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Switch
                              checked={taskName.is_active}
                              onCheckedChange={() => handleToggleActive(taskName)}
                            />
                          </TableCell>
                        )}
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(taskName)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(taskName)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {filteredTaskNames(type).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          タスク名がありません
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit/New Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialog({
              open: false,
              isNew: false,
              taskName: null,
              contract_type: "property",
              name: "",
              display_order: 0,
              is_active: true,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editDialog.isNew ? "タスク名を追加" : "タスク名を編集"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>契約種別</Label>
              <Badge variant="outline">
                {CONTRACT_TYPE_LABELS[editDialog.contract_type] || editDialog.contract_type}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-name">タスク名</Label>
              <Input
                id="task-name"
                value={editDialog.name}
                onChange={(e) => setEditDialog({ ...editDialog, name: e.target.value })}
                placeholder="タスク名を入力"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display-order">表示順序</Label>
              <Input
                id="display-order"
                type="number"
                value={editDialog.display_order}
                onChange={(e) =>
                  setEditDialog({ ...editDialog, display_order: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-gray-500">数字が小さいほど上に表示されます</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editDialog.is_active}
                onCheckedChange={(checked) =>
                  setEditDialog({ ...editDialog, is_active: checked })
                }
              />
              <Label>有効</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setEditDialog({
                  open: false,
                  isNew: false,
                  taskName: null,
                  contract_type: "property",
                  name: "",
                  display_order: 0,
                  is_active: true,
                })
              }
            >
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>タスク名を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
