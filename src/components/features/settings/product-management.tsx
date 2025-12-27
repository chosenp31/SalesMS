"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProductMaster, ContractType } from "@/types";
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
import { Plus, Edit2, Package, Trash2 } from "lucide-react";

interface ProductManagementProps {
  products: ProductMaster[];
  isAdmin: boolean;
}

const CONTRACT_TYPES: ContractType[] = ["property", "line", "maintenance"];

export function ProductManagement({ products, isAdmin }: ProductManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    isNew: boolean;
    product: ProductMaster | null;
    contract_type: ContractType;
    name: string;
    display_order: number;
    is_active: boolean;
  }>({
    open: false,
    isNew: false,
    product: null,
    contract_type: "property",
    name: "",
    display_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ContractType>("property");
  const [deleteTarget, setDeleteTarget] = useState<ProductMaster | null>(null);

  const openNewDialog = (contractType: ContractType) => {
    const maxOrder = Math.max(
      ...products
        .filter((p) => p.contract_type === contractType)
        .map((p) => p.display_order),
      0
    );
    setEditDialog({
      open: true,
      isNew: true,
      product: null,
      contract_type: contractType,
      name: "",
      display_order: maxOrder + 1,
      is_active: true,
    });
  };

  const openEditDialog = (product: ProductMaster) => {
    setEditDialog({
      open: true,
      isNew: false,
      product,
      contract_type: product.contract_type,
      name: product.name,
      display_order: product.display_order,
      is_active: product.is_active,
    });
  };

  const handleSave = async () => {
    if (!editDialog.name.trim()) {
      toast({
        title: "エラー",
        description: "商材名を入力してください",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      if (editDialog.isNew) {
        const { error } = await supabase.from("product_master").insert({
          contract_type: editDialog.contract_type,
          name: editDialog.name,
          display_order: editDialog.display_order,
          is_active: editDialog.is_active,
        });

        if (error) throw error;

        toast({
          title: "商材を追加しました",
          description: `${editDialog.name}を追加しました`,
        });
      } else if (editDialog.product) {
        const { error } = await supabase
          .from("product_master")
          .update({
            name: editDialog.name,
            display_order: editDialog.display_order,
            is_active: editDialog.is_active,
          })
          .eq("id", editDialog.product.id);

        if (error) throw error;

        toast({
          title: "商材を更新しました",
          description: `${editDialog.name}を更新しました`,
        });
      }

      setEditDialog({
        open: false,
        isNew: false,
        product: null,
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

  const handleDeleteClick = (product: ProductMaster) => {
    setDeleteTarget(product);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("product_master")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;

      toast({
        title: "商材を削除しました",
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

  const handleToggleActive = async (product: ProductMaster) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("product_master")
        .update({ is_active: !product.is_active })
        .eq("id", product.id);

      if (error) throw error;

      toast({
        title: product.is_active ? "無効化しました" : "有効化しました",
        description: `${product.name}を${product.is_active ? "無効" : "有効"}にしました`,
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

  const filteredProducts = (contractType: ContractType) =>
    products.filter((p) => p.contract_type === contractType);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            商材マスタ
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
                      <TableHead>商材名</TableHead>
                      {isAdmin && <TableHead className="w-[100px]">状態</TableHead>}
                      {isAdmin && <TableHead className="w-[100px]">操作</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts(type).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="text-gray-600">
                          {product.display_order}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Switch
                              checked={product.is_active}
                              onCheckedChange={() => handleToggleActive(product)}
                            />
                          </TableCell>
                        )}
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(product)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(product)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {filteredProducts(type).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          商材がありません
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
              product: null,
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
              {editDialog.isNew ? "商材を追加" : "商材を編集"}
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
              <Label htmlFor="product-name">商材名</Label>
              <Input
                id="product-name"
                value={editDialog.name}
                onChange={(e) => setEditDialog({ ...editDialog, name: e.target.value })}
                placeholder="商材名を入力"
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
                  product: null,
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
            <AlertDialogTitle>商材を削除しますか？</AlertDialogTitle>
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
