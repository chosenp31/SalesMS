"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="パンくずリスト"
      className={cn("flex items-center text-sm text-gray-500", className)}
    >
      <ol className="flex items-center space-x-1">
        <li>
          <Link
            href="/deals"
            className="flex items-center hover:text-gray-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">ホーム</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
