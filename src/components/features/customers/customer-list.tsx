"use client";

import { useState, useMemo } from "react";
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
import {
  SearchFilterBar,
  FilterOption,
  ActiveFilter,
} from "@/components/ui/search-filter-bar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, ChevronUp, ChevronDown, Building2, Phone, Mail, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerListProps {
  customers: Customer[];
}

type SortField = "company_name" | "representative_name" | "business_type" | "phone" | "email" | "created_at";
type SortDirection = "asc" | "desc";

export function CustomerList({ customers }: CustomerListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sortField, setSortField] = useState<SortField>("company_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter options
  const filterOptions: FilterOption[] = [
    {
      key: "business_type",
      label: "事業形態",
      type: "select",
      quickFilter: true, // インライン表示
      options: Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    },
  ];

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    if (value === "__all__" || value === "") {
      setActiveFilters((prev) => prev.filter((f) => f.key !== key));
    } else {
      const filterOption = filterOptions.find((f) => f.key === key);
      const option = filterOption?.options?.find((o) => o.value === value);
      setActiveFilters((prev) => {
        const existing = prev.findIndex((f) => f.key === key);
        const newFilter = {
          key,
          value,
          label: filterOption?.label || key,
          displayValue: option?.label || value,
        };
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newFilter;
          return updated;
        }
        return [...prev, newFilter];
      });
    }
  };

  const handleFilterRemove = (key: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.key !== key));
  };

  const handleClearAll = () => {
    setSearchValue("");
    setActiveFilters([]);
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Apply search
    if (searchValue) {
      const lowerSearch = searchValue.toLowerCase();
      result = result.filter(
        (customer) =>
          customer.company_name.toLowerCase().includes(lowerSearch) ||
          customer.representative_name?.toLowerCase().includes(lowerSearch) ||
          customer.phone?.toLowerCase().includes(lowerSearch) ||
          customer.email?.toLowerCase().includes(lowerSearch) ||
          customer.address?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply filters
    for (const filter of activeFilters) {
      if (filter.key === "business_type") {
        result = result.filter((customer) => customer.business_type === filter.value);
      }
    }

    // Apply sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "company_name":
          comparison = a.company_name.localeCompare(b.company_name);
          break;
        case "representative_name":
          comparison = (a.representative_name || "").localeCompare(
            b.representative_name || ""
          );
          break;
        case "business_type":
          comparison = a.business_type.localeCompare(b.business_type);
          break;
        case "phone":
          comparison = (a.phone || "").localeCompare(b.phone || "");
          break;
        case "email":
          comparison = (a.email || "").localeCompare(b.email || "");
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [customers, searchValue, activeFilters, sortField, sortDirection]);

  const SortHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      className={cn(
        "flex items-center gap-1 hover:text-primary transition-colors font-medium",
        className
      )}
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field && (
        sortDirection === "asc" ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      )}
    </button>
  );

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 mb-2">顧客がまだ登録されていません</p>
        <p className="text-sm text-gray-400 mb-4">
          案件作成時に新しい顧客を登録できます
        </p>
        <Button variant="outline" asChild>
          <Link href="/deals/new">
            <Plus className="h-4 w-4 mr-2" />
            案件を作成して顧客を登録
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchFilterBar
        placeholder="会社名、代表者名、電話番号、メール、住所で検索..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filterOptions}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onFilterRemove={handleFilterRemove}
        onClearAll={handleClearAll}
        resultCount={filteredCustomers.length}
      />

      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[200px]">
                <SortHeader field="company_name">会社名</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="representative_name">代表者名</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="business_type">事業形態</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="phone">電話番号</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader field="email">メール</SortHeader>
              </TableHead>
              <TableHead className="text-right w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow
                key={customer.id}
                className="cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => router.push(`/customers/${customer.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {customer.company_name}
                  </div>
                </TableCell>
                <TableCell>{customer.representative_name || "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {BUSINESS_TYPE_LABELS[customer.business_type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {customer.phone ? (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Phone className="h-3.5 w-3.5" />
                      {customer.phone}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {customer.email ? (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[180px]">{customer.email}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex justify-end space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
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
        {filteredCustomers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            条件に一致する顧客がありません
          </div>
        )}
      </div>
    </div>
  );
}
