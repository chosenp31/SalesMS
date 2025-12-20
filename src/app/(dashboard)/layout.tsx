import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { User } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 認証チェックを一時的に無効化（デモ用）
  // TODO: 本番運用時は認証を有効化すること
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Get user profile - デモ用にnullを許容
  let user: User | null = null;
  if (authUser) {
    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    user = userProfile;
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
