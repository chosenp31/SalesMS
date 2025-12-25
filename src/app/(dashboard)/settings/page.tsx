"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListTodo, Package } from "lucide-react";

const settingsSections = [
  {
    title: "ユーザー管理",
    description: "ユーザーの追加、編集、権限の設定を行います",
    href: "/settings/users",
    icon: Users,
  },
  {
    title: "タスク名マスタ",
    description: "タスク名のプルダウン選択肢を管理します",
    href: "/settings/task-names",
    icon: ListTodo,
  },
  {
    title: "商材マスタ",
    description: "契約種別ごとの商材を管理します",
    href: "/settings/products",
    icon: Package,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-gray-500">システムの各種設定を管理します</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <section.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{section.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
