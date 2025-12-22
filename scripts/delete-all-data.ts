import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// .env.localファイルを読み込む
const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
envContent.split("\n").forEach(line => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join("=").trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase環境変数が設定されていません（SUPABASE_SERVICE_ROLE_KEYが必要です）");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllData() {
  console.log("⚠️  全データを削除中...\n");

  // 外部キー制約の順序で削除
  console.log("  - activities を削除中...");
  await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("  - payments を削除中...");
  await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("  - lease_applications を削除中...");
  await supabase.from("lease_applications").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("  - tasks を削除中...");
  await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("  - contracts を削除中...");
  await supabase.from("contracts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("  - deals を削除中...");
  await supabase.from("deals").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("  - customers を削除中...");
  await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("  - users を削除中...");
  await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("\n✅ 全データの削除が完了しました！");
}

deleteAllData().catch(console.error);
