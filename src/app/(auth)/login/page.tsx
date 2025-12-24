"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/deals");
      router.refresh();
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: "demoslaesms@example.com",
      password: "dn4hkg6xp",
    });

    if (error) {
      setError("デモログインに失敗しました: " + error.message);
      setDemoLoading(false);
    } else {
      router.push("/deals");
      router.refresh();
    }
  };

  const isLoading = loading || demoLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sales MS
          </CardTitle>
          <CardDescription className="text-center">
            リース販売管理システム
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* デモログインボタン */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 text-blue-700"
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              <Play className="h-5 w-5 mr-2" />
              {demoLoading ? "ログイン中..." : "デモで試す"}
            </Button>
            <p className="text-xs text-center text-gray-500">
              アカウント不要で機能を体験できます
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">または</span>
            </div>
          </div>

          {/* 通常ログインフォーム */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-sm text-red-500 text-center">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
