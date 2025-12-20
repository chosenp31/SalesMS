"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  { name: "入金管理", href: "/payments", icon: CreditCard },
];

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
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
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5 mr-3" />
          ログアウト
        </Button>
      </div>
    </>
  );
}

export function Sidebar() {
  const { isOpen, close } = useMobileSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col h-full w-64 bg-gray-900 text-white">
        <div className="flex items-center h-16 px-6 border-b border-gray-800">
          <LayoutDashboard className="h-6 w-6 mr-2" />
          <span className="text-xl font-bold">Sales MS</span>
        </div>
        <SidebarContent />
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
        <SidebarContent onLinkClick={close} />
      </div>
    </>
  );
}
