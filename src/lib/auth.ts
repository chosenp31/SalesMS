import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * サーバーサイドで現在のユーザーを取得する
 * 認証されていない場合はログインページにリダイレクト
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

/**
 * サーバーサイドで現在のユーザーIDを取得する（リダイレクトなし）
 * デモモード対応：認証がない場合はusersテーブルの最初のユーザーを使用
 */
export async function getCurrentUserIdOrFallback(): Promise<string> {
  const supabase = await createClient();

  // まず認証ユーザーを確認
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return user.id;
  }

  // デモモード：認証がない場合はusersテーブルから取得
  const { data: users } = await supabase
    .from("users")
    .select("id")
    .order("created_at")
    .limit(1);

  return users?.[0]?.id || "";
}

/**
 * サーバーサイドで現在のユーザー情報を取得する（usersテーブルから）
 */
export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Failed to fetch user profile:", profileError);
    return null;
  }

  return profile;
}
