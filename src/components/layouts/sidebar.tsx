"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSignature,
  ClipboardList,
  CreditCard,
  LogOut,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useMobileSidebar } from "./mobile-sidebar-context";

const navigation = [
  { name: "案件管理", href: "/deals", icon: FileText },
  { name: "契約管理", href: "/contracts", icon: FileSignature },
  { name: "顧客管理", href: "/customers", icon: Users },
  { name: "タスク", href: "/tasks", icon: ClipboardList },
  { name: "入金管理", href: "/payments", icon: CreditCard, badge: "作成中" },
];

function SidebarContent({
  onLinkClick,
  isExpanded = true,
}: {
  onLinkClick?: () => void;
  isExpanded?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center py-3 text-sm font-medium rounded-lg transition-colors",
                isExpanded ? "px-4" : "px-3 justify-center",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              title={!isExpanded ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isExpanded && "mr-3")} />
              {isExpanded && (
                <>
                  <span className="whitespace-nowrap">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs bg-yellow-500 text-yellow-900 px-1.5 py-0.5 rounded font-medium">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
      <div className={cn("border-t border-gray-800", isExpanded ? "p-4" : "p-2")}>
        <Button
          variant="ghost"
          className={cn(
            "text-gray-300 hover:bg-gray-800 hover:text-white",
            isExpanded ? "w-full justify-start" : "w-full justify-center p-3"
          )}
          onClick={handleSignOut}
          title={!isExpanded ? "ログアウト" : undefined}
        >
          <LogOut className={cn("h-5 w-5 flex-shrink-0", isExpanded && "mr-3")} />
          {isExpanded && "ログアウト"}
        </Button>
      </div>
    </>
  );
}

export function Sidebar() {
  const { isOpen, close } = useMobileSidebar();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Desktop Sidebar - Collapsible on hover */}
      <div
        className={cn(
          "hidden md:flex md:flex-col h-full bg-gray-900 text-white transition-all duration-300 ease-in-out",
          isHovered ? "w-64" : "w-16"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn(
          "flex items-center h-16 border-b border-gray-800",
          isHovered ? "px-6" : "px-3 justify-center"
        )}>
          <LayoutDashboard className="h-6 w-6 flex-shrink-0" />
          {isHovered && (
            <span className="text-xl font-bold ml-2 whitespace-nowrap">Sales MS</span>
          )}
        </div>
        <SidebarContent isExpanded={isHovered} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <div className="flex items-center">
            <LayoutDashboard className="h-6 w-6 mr-2" />
            <span className="text-xl font-bold">Sales MS</span>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent onLinkClick={close} isExpanded={true} />
      </div>
    </>
  );
}
