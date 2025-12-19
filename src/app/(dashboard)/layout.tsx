import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation"; // 認証無効化のためコメントアウト
import { Sidebar } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
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

  // if (!authUser) {
  //   redirect("/login");
  // }

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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
