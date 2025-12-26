"use client";

import { ReactNode } from "react";
import { MobileSidebarProvider } from "./mobile-sidebar-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { User } from "@/types";

interface DashboardShellProps {
  children: ReactNode;
  user: User | null;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <MobileSidebarProvider>
      <div className="flex flex-1 min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header user={user} />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </MobileSidebarProvider>
  );
}
