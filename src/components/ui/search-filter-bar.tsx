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
import { Search, X, SlidersHorizontal, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";

// 日付プリセット定義
export interface DatePreset {
  label: string;
  value: string;
  getRange: () => { from: Date; to: Date };
}

export const DATE_PRESETS: DatePreset[] = [
  {
    label: "今日",
    value: "today",
    getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }),
  },
  {
    label: "昨日",
    value: "yesterday",
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    },
  },
  {
    label: "今週",
    value: "this_week",
    getRange: () => ({
      from: startOfWeek(new Date(), { locale: ja }),
      to: endOfWeek(new Date(), { locale: ja }),
    }),
  },
  {
    label: "今月",
    value: "this_month",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "先月",
    value: "last_month",
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    },
  },
  {
    label: "過去7日間",
    value: "last_7_days",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "過去30日間",
    value: "last_30_days",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
];

export interface FilterOption {
  key: string;
  label: string;
  type: "select" | "date" | "dateRange" | "datePreset";
  options?: { value: string; label: string }[];
  quickFilter?: boolean; // インライン表示フラグ
  icon?: React.ReactNode; // オプションアイコン
}

export interface ActiveFilter {
  key: string;
  value: string;
  label: string;
  displayValue: string;
  dateRange?: { from: Date; to: Date }; // 日付範囲
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
  totalCount?: number; // 追加: 全件数
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
  totalCount,
  className,
}: SearchFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilters = activeFilters.length > 0 || searchValue.length > 0;

  // クイックフィルタとその他のフィルタを分離
  const quickFilters = filters.filter((f) => f.quickFilter);
  const advancedFilters = filters.filter((f) => !f.quickFilter);

  return (
    <div className={cn("space-y-3", className)}>
      {/* メイン検索バー */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {/* 検索入力 */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-10 bg-white border-gray-200 focus:border-primary focus:ring-primary"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* クイックフィルタ（インライン表示） */}
        {quickFilters.map((filter) => (
          <div key={filter.key} className="hidden sm:block">
            {filter.type === "select" && filter.options && (
              <Select
                value={
                  activeFilters.find((f) => f.key === filter.key)?.value || "__all__"
                }
                onValueChange={(value) => onFilterChange?.(filter.key, value)}
              >
                <SelectTrigger className="h-10 min-w-[120px] bg-white border-gray-200">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">
                    <span className="text-gray-500">{filter.label}: すべて</span>
                  </SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filter.type === "datePreset" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 min-w-[120px] justify-between bg-white border-gray-200",
                      activeFilters.find((f) => f.key === filter.key) &&
                      "border-primary text-primary"
                    )}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {activeFilters.find((f) => f.key === filter.key)?.displayValue ||
                      filter.label}
                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="start">
                  <div className="space-y-0.5">
                    <button
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
                      onClick={() => onFilterChange?.(filter.key, "__all__")}
                    >
                      すべての期間
                    </button>
                    {DATE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm rounded transition-colors",
                          activeFilters.find((f) => f.key === filter.key)?.value ===
                            preset.value
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-gray-100"
                        )}
                        onClick={() => onFilterChange?.(filter.key, preset.value)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        ))}

        {/* 詳細フィルタボタン */}
        {advancedFilters.length > 0 && (
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 gap-2 bg-white border-gray-200",
                  activeFilters.filter((f) =>
                    advancedFilters.some((af) => af.key === f.key)
                  ).length > 0 && "border-primary text-primary"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">その他</span>
                {activeFilters.filter((f) =>
                  advancedFilters.some((af) => af.key === f.key)
                ).length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 bg-primary/10 text-primary"
                    >
                      {
                        activeFilters.filter((f) =>
                          advancedFilters.some((af) => af.key === f.key)
                        ).length
                      }
                    </Badge>
                  )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">詳細フィルタ</span>
                  {activeFilters.filter((f) =>
                    advancedFilters.some((af) => af.key === f.key)
                  ).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-gray-500"
                        onClick={() => {
                          advancedFilters.forEach((f) => onFilterRemove?.(f.key));
                        }}
                      >
                        クリア
                      </Button>
                    )}
                </div>
                {advancedFilters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
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
                        <SelectTrigger className="bg-white">
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
                        className="bg-white"
                        value={
                          activeFilters.find((f) => f.key === filter.key)
                            ?.value || ""
                        }
                        onChange={(e) =>
                          onFilterChange?.(filter.key, e.target.value)
                        }
                      />
                    )}
                    {filter.type === "datePreset" && (
                      <Select
                        value={
                          activeFilters.find((f) => f.key === filter.key)
                            ?.value || ""
                        }
                        onValueChange={(value) =>
                          onFilterChange?.(filter.key, value)
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="期間を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">すべての期間</SelectItem>
                          {DATE_PRESETS.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value}>
                              {preset.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* 検索結果件数 */}
        {resultCount !== undefined && (
          <div className="flex items-center gap-1 text-sm text-gray-500 whitespace-nowrap">
            <span className="font-medium text-gray-900">{resultCount}</span>
            {totalCount !== undefined && totalCount !== resultCount && (
              <span>/ {totalCount}</span>
            )}
            <span>件</span>
          </div>
        )}
      </div>

      {/* アクティブフィルタ表示 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {searchValue && (
            <Badge
              variant="secondary"
              className="gap-1.5 pr-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
            >
              <Search className="h-3 w-3" />
              {searchValue}
              <button
                onClick={() => onSearchChange("")}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1.5 pr-1.5 bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            >
              <span className="text-gray-500">{filter.label}:</span>
              {filter.displayValue}
              <button
                onClick={() => onFilterRemove?.(filter.key)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {(activeFilters.length > 1 ||
            (searchValue && activeFilters.length > 0)) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
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
