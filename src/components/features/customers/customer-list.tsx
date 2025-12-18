"use client";

import { Customer } from "@/types";
import { BUSINESS_TYPE_LABELS } from "@/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";

interface CustomerListProps {
  customers: Customer[];
}

export function CustomerList({ customers }: CustomerListProps) {
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-500">顧客がまだ登録されていません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>会社名</TableHead>
            <TableHead>代表者名</TableHead>
            <TableHead>事業形態</TableHead>
            <TableHead>電話番号</TableHead>
            <TableHead>メール</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">
                {customer.company_name}
              </TableCell>
              <TableCell>{customer.representative_name}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {BUSINESS_TYPE_LABELS[customer.business_type]}
                </Badge>
              </TableCell>
              <TableCell>{customer.phone || "-"}</TableCell>
              <TableCell>{customer.email || "-"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/customers/${customer.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/customers/${customer.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
