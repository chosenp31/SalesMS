import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
const envPath = path.join(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
  }
});

const supabaseUrl = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const supabaseServiceKey = envVars["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log("Starting migration...");

  try {
    // 1. 活動履歴を契約に紐付け
    console.log("1. Updating activities to link to contracts...");

    // まず活動履歴を契約に紐付け
    const { error: updateError } = await supabase.rpc("exec_sql", {
      sql: `
        UPDATE activities a
        SET contract_id = (
          SELECT c.id FROM contracts c WHERE c.deal_id = a.deal_id ORDER BY c.created_at LIMIT 1
        )
        WHERE a.contract_id IS NULL AND a.deal_id IS NOT NULL
      `,
    });

    if (updateError) {
      console.log("Note: RPC exec_sql not available, will need to run SQL manually");
    }

    // 2. タスク名マスタを作成
    console.log("2. Creating task_name_master table and data...");

    // テーブルが存在するか確認
    const { data: existingTaskMaster } = await supabase
      .from("task_name_master")
      .select("id")
      .limit(1);

    if (!existingTaskMaster) {
      console.log("   task_name_master table does not exist, needs to be created via SQL");
    } else {
      console.log("   task_name_master table already exists");
    }

    // 3. 商材マスタを作成
    console.log("3. Creating product_master table and data...");

    const { data: existingProductMaster } = await supabase
      .from("product_master")
      .select("id")
      .limit(1);

    if (!existingProductMaster) {
      console.log("   product_master table does not exist, needs to be created via SQL");
    } else {
      console.log("   product_master table already exists");
    }

    // 4. ステータス変更履歴テーブルを確認
    console.log("4. Checking status_change_history table...");

    const { data: existingStatusHistory } = await supabase
      .from("status_change_history")
      .select("id")
      .limit(1);

    if (!existingStatusHistory) {
      console.log("   status_change_history table does not exist, needs to be created via SQL");
    } else {
      console.log("   status_change_history table already exists");
    }

    console.log("\n=== Migration Notes ===");
    console.log("Please run the following SQL in Supabase SQL Editor:");
    console.log("File: supabase/migrations/20241225000000_version8_schema_updates.sql");
    console.log("\nYou can access the SQL Editor at:");
    console.log(`${supabaseUrl.replace('.supabase.co', '')}/project/mlkoowkkxibmljfsanae/sql`);

  } catch (error) {
    console.error("Error during migration:", error);
  }
}

applyMigration();
