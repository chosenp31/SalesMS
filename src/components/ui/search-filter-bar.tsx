"use client";

import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  key: string;
  label: string;
  type: "select" | "date" | "dateRange";
  options?: { value: string; label: string }[];
}

export interface ActiveFilter {
  key: string;
  value: string;
  label: string;
  displayValue: string;
}

interface SearchFilterBarProps {
  placeholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  activeFilters?: ActiveFilter[];
  onFilterChange?: (key: string, value: string) => void;
  onFilterRemove?: (key: string) => void;
  onClearAll?: () => void;
  resultCount?: number;
  className?: string;
}

export function SearchFilterBar({
  placeholder = "検索...",
  searchValue,
  onSearchChange,
  filters = [],
  activeFilters = [],
  onFilterChange,
  onFilterRemove,
  onClearAll,
  resultCount,
  className,
}: SearchFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilters = activeFilters.length > 0 || searchValue.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        {filters.length > 0 && (
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "gap-2",
                  activeFilters.length > 0 && "border-primary text-primary"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                フィルタ
                {activeFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {activeFilters.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="font-medium">フィルタ条件</div>
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm text-gray-600">
                      {filter.label}
                    </label>
                    {filter.type === "select" && filter.options && (
                      <Select
                        value={
                          activeFilters.find((f) => f.key === filter.key)
                            ?.value || ""
                        }
                        onValueChange={(value) =>
                          onFilterChange?.(filter.key, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="すべて" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">すべて</SelectItem>
                          {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {filter.type === "date" && (
                      <Input
                        type="date"
                        value={
                          activeFilters.find((f) => f.key === filter.key)
                            ?.value || ""
                        }
                        onChange={(e) =>
                          onFilterChange?.(filter.key, e.target.value)
                        }
                      />
                    )}
                  </div>
                ))}
                {activeFilters.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={onClearAll}
                  >
                    すべてクリア
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Result Count */}
        {resultCount !== undefined && (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {resultCount}件
          </span>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {searchValue && (
            <Badge variant="secondary" className="gap-1 pr-1">
              検索: {searchValue}
              <button
                onClick={() => onSearchChange("")}
                className="ml-1 hover:bg-gray-200 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="secondary" className="gap-1 pr-1">
              {filter.label}: {filter.displayValue}
              <button
                onClick={() => onFilterRemove?.(filter.key)}
                className="ml-1 hover:bg-gray-200 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {(activeFilters.length > 1 || (searchValue && activeFilters.length > 0)) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onClearAll}
            >
              すべてクリア
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for managing search and filter state
export function useSearchFilter<T>(
  items: T[],
  searchFields: (keyof T)[],
  filterConfigs?: { key: keyof T; match: (item: T, value: string) => boolean }[]
) {
  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const handleFilterChange = useCallback(
    (key: string, value: string, label: string, displayValue: string) => {
      if (value === "__all__" || value === "") {
        setActiveFilters((prev) => prev.filter((f) => f.key !== key));
      } else {
        setActiveFilters((prev) => {
          const existing = prev.findIndex((f) => f.key === key);
          const newFilter = { key, value, label, displayValue };
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = newFilter;
            return updated;
          }
          return [...prev, newFilter];
        });
      }
    },
    []
  );

  const handleFilterRemove = useCallback((key: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.key !== key));
  }, []);

  const handleClearAll = useCallback(() => {
    setSearchValue("");
    setActiveFilters([]);
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;

    // Apply search
    if (searchValue) {
      const lowerSearch = searchValue.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(lowerSearch);
          }
          if (typeof value === "object" && value !== null) {
            return JSON.stringify(value).toLowerCase().includes(lowerSearch);
          }
          return false;
        })
      );
    }

    // Apply filters
    if (filterConfigs) {
      for (const filter of activeFilters) {
        const config = filterConfigs.find((c) => String(c.key) === filter.key);
        if (config) {
          result = result.filter((item) => config.match(item, filter.value));
        }
      }
    }

    return result;
  }, [items, searchValue, activeFilters, searchFields, filterConfigs]);

  return {
    searchValue,
    setSearchValue,
    activeFilters,
    handleFilterChange,
    handleFilterRemove,
    handleClearAll,
    filteredItems,
  };
}
