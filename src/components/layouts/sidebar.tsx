"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  CreditCard,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "案件管理", href: "/deals", icon: FileText },
  { name: "顧客管理", href: "/customers", icon: Users },
  { name: "タスク", href: "/tasks", icon: ClipboardList },
  { name: "入金管理", href: "/payments", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full w-64 bg-gray-900 text-white">
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <LayoutDashboard className="h-6 w-6 mr-2" />
        <span className="text-xl font-bold">Sales MS</span>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
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
    </div>
  );
}
