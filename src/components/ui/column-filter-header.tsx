"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, Filter, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// カラムフィルタの状態
export interface ColumnFilter {
    column: string;
    values: string[];      // 選択された値（複数選択可能）
    searchText?: string;   // テキスト検索
}

// フィルタ可能なオプション
export interface ColumnFilterOption {
    value: string;
    label: string;
    count?: number;
}

interface ColumnFilterHeaderProps {
    column: string;
    label: string;
    // ソート
    sortField?: string;
    sortDirection?: "asc" | "desc";
    onSort?: () => void;
    sortable?: boolean;
    // フィルタ
    filterable?: boolean;
    filterOptions?: ColumnFilterOption[];
    activeFilter?: ColumnFilter;
    onFilterChange?: (filter: ColumnFilter | null) => void;
    // テキスト検索（オプションなしの場合）
    searchable?: boolean;
    // スタイル
    className?: string;
    align?: "left" | "center" | "right";
}

export function ColumnFilterHeader({
    column,
    label,
    sortField,
    sortDirection,
    onSort,
    sortable = true,
    filterable = false,
    filterOptions = [],
    activeFilter,
    onFilterChange,
    searchable = false,
    className,
    align = "left",
}: ColumnFilterHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [selectedValues, setSelectedValues] = useState<string[]>(
        activeFilter?.values || []
    );

    const isActive = sortField === column;
    const hasActiveFilter = activeFilter && (
        (activeFilter.values && activeFilter.values.length > 0) ||
        (activeFilter.searchText && activeFilter.searchText.length > 0)
    );

    // フィルタオプションを検索でフィルタ
    const filteredOptions = useMemo(() => {
        if (!searchInput) return filterOptions;
        const lower = searchInput.toLowerCase();
        return filterOptions.filter(
            (opt) =>
                opt.label.toLowerCase().includes(lower) ||
                opt.value.toLowerCase().includes(lower)
        );
    }, [filterOptions, searchInput]);

    // 全選択/全解除
    const handleSelectAll = () => {
        if (selectedValues.length === filterOptions.length) {
            setSelectedValues([]);
        } else {
            setSelectedValues(filterOptions.map((opt) => opt.value));
        }
    };

    // フィルタ適用
    const handleApply = () => {
        if (searchable && searchInput) {
            onFilterChange?.({
                column,
                values: [],
                searchText: searchInput,
            });
        } else if (selectedValues.length > 0 && selectedValues.length < filterOptions.length) {
            onFilterChange?.({
                column,
                values: selectedValues,
            });
        } else {
            onFilterChange?.(null);
        }
        setIsOpen(false);
    };

    // フィルタクリア
    const handleClear = () => {
        setSelectedValues([]);
        setSearchInput("");
        onFilterChange?.(null);
        setIsOpen(false);
    };

    // ポップオーバーが開いたとき、現在のフィルタ状態を反映
    React.useEffect(() => {
        if (isOpen) {
            setSelectedValues(activeFilter?.values || []);
            setSearchInput(activeFilter?.searchText || "");
        }
    }, [isOpen, activeFilter]);

    const SortIcon = () => {
        if (!sortable) return null;
        return (
            <span
                className={cn(
                    "transition-opacity ml-1",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                )}
            >
                {isActive && sortDirection === "asc" ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </span>
        );
    };

    // フィルタ可能でない場合、シンプルなソートヘッダー
    if (!filterable && !searchable) {
        return (
            <button
                className={cn(
                    "flex items-center gap-1 font-medium transition-colors group",
                    isActive ? "text-primary" : "text-gray-600 hover:text-gray-900",
                    align === "right" && "justify-end",
                    align === "center" && "justify-center",
                    className
                )}
                onClick={onSort}
            >
                {label}
                <SortIcon />
            </button>
        );
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-1 font-medium transition-colors group",
                        isActive || hasActiveFilter
                            ? "text-primary"
                            : "text-gray-600 hover:text-gray-900",
                        align === "right" && "justify-end",
                        align === "center" && "justify-center",
                        className
                    )}
                >
                    {label}
                    {hasActiveFilter && (
                        <Filter className="h-3 w-3 text-primary fill-primary/20" />
                    )}
                    <SortIcon />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
                <div className="p-3 space-y-3">
                    {/* ヘッダー */}
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{label}でフィルタ</span>
                        {hasActiveFilter && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={handleClear}
                            >
                                クリア
                            </Button>
                        )}
                    </div>

                    {/* ソートボタン */}
                    {sortable && (
                        <div className="flex gap-1">
                            <Button
                                variant={isActive && sortDirection === "asc" ? "default" : "outline"}
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => {
                                    onSort?.();
                                    if (!filterable) setIsOpen(false);
                                }}
                            >
                                <ChevronUp className="h-3 w-3 mr-1" />
                                昇順
                            </Button>
                            <Button
                                variant={isActive && sortDirection === "desc" ? "default" : "outline"}
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => {
                                    onSort?.();
                                    if (!filterable) setIsOpen(false);
                                }}
                            >
                                <ChevronDown className="h-3 w-3 mr-1" />
                                降順
                            </Button>
                        </div>
                    )}

                    {/* 検索入力 */}
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={
                                searchable ? `${label}を検索...` : "フィルタ項目を検索..."
                            }
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    {/* フィルタオプション（選択リスト） */}
                    {filterable && filterOptions.length > 0 && (
                        <>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <button
                                    onClick={handleSelectAll}
                                    className="hover:text-gray-700"
                                >
                                    {selectedValues.length === filterOptions.length
                                        ? "全解除"
                                        : "全選択"}
                                </button>
                                <span>
                                    {selectedValues.length} / {filterOptions.length} 選択
                                </span>
                            </div>
                            <ScrollArea className="h-[180px] border rounded-md">
                                <div className="p-2 space-y-1">
                                    {filteredOptions.map((option) => (
                                        <label
                                            key={option.value}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm"
                                        >
                                            <Checkbox
                                                checked={selectedValues.includes(option.value)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedValues([...selectedValues, option.value]);
                                                    } else {
                                                        setSelectedValues(
                                                            selectedValues.filter((v) => v !== option.value)
                                                        );
                                                    }
                                                }}
                                            />
                                            <span className="flex-1 truncate">{option.label}</span>
                                            {option.count !== undefined && (
                                                <span className="text-xs text-gray-400">
                                                    ({option.count})
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                    {filteredOptions.length === 0 && (
                                        <p className="text-xs text-gray-500 text-center py-4">
                                            該当する項目がありません
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        </>
                    )}

                    {/* 適用ボタン */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setIsOpen(false)}
                        >
                            キャンセル
                        </Button>
                        <Button size="sm" className="flex-1" onClick={handleApply}>
                            適用
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ユーティリティ：データからフィルタオプションを生成
export function generateFilterOptions<T>(
    data: T[],
    getKey: (item: T) => string,
    getLabel: (item: T) => string
): ColumnFilterOption[] {
    const counts = new Map<string, { label: string; count: number }>();

    for (const item of data) {
        const key = getKey(item);
        const label = getLabel(item);
        const existing = counts.get(key);
        if (existing) {
            existing.count++;
        } else {
            counts.set(key, { label, count: 1 });
        }
    }

    return Array.from(counts.entries()).map(([value, { label, count }]) => ({
        value,
        label,
        count,
    }));
}
