import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================
// マスターデータ
// ============================================

const lastNames = [
  "田中", "鈴木", "佐藤", "高橋", "伊藤", "渡辺", "山本", "中村", "小林", "加藤",
  "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水",
];

const firstNames = [
  "太郎", "一郎", "健太", "大輔", "翔太", "裕介", "和也", "直樹", "拓也", "誠",
  "美咲", "陽子", "裕子", "真由美", "恵子", "智子", "由美子", "久美子", "京子", "幸子"
];

const companyPrefixes = [
  "東京", "大阪", "名古屋", "横浜", "神戸", "京都", "福岡", "札幌", "仙台", "広島",
  "日本", "全国", "関東", "関西", "東海", "九州", "北海道", "中部", "北陸", "東北",
];

const companyTypes = [
  "建設", "不動産", "運輸", "物流", "製造", "食品", "IT", "システム", "設備", "電機",
  "機械", "自動車", "医療", "介護", "教育", "飲食", "小売", "卸売", "印刷", "広告",
];

const addressDetails = [
  { pref: "東京都", city: "千代田区", town: "丸の内" },
  { pref: "東京都", city: "港区", town: "六本木" },
  { pref: "東京都", city: "新宿区", town: "西新宿" },
  { pref: "東京都", city: "渋谷区", town: "道玄坂" },
  { pref: "大阪府", city: "大阪市北区", town: "梅田" },
  { pref: "愛知県", city: "名古屋市中区", town: "栄" },
];

const contractTypes = ["property", "line", "maintenance"] as const;

const productCategoriesByType: Record<string, string[]> = {
  property: ["UTM", "ルーター", "複合機", "その他"],
  line: ["インターネット", "電話", "その他"],
  maintenance: ["インターネット", "電話", "その他"],
};

const leaseCompanies = ["C-mind", "オリコ", "ジャックス", "その他"];

const phaseStatuses: Record<string, string[]> = {
  商談中: ["商談待ち", "商談日程調整中"],
  "審査・申込中": ["審査・申込対応中", "審査・申込待ち"],
  "下見・工事中": ["下見調整中", "下見実施待ち", "工事日程調整中", "工事実施待ち"],
  契約中: ["検収確認中", "契約書提出対応中", "契約書確認待ち"],
  入金中: ["入金待ち", "入金済"],
  請求中: ["初回請求確認待ち", "請求処理対応中"],
  完了: ["クローズ"],
  否決: ["対応検討中", "失注"],
};

const phases = Object.keys(phaseStatuses);

// ============================================
// ユーティリティ関数
// ============================================

function randomElement<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function generatePhone(): string {
  const area = ["03", "06", "052", "045", "092"];
  return `${randomElement(area)}-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
}

function generateEmail(name: string): string {
  const domains = ["co.jp", "jp", "com"];
  const simplified = name.replace(/[株式会社有限合同（）()\s]/g, "").substring(0, 6).toLowerCase();
  return `info@${simplified || "company"}.${randomElement(domains)}`;
}

function getRandomPhaseAndStatus(): { phase: string; status: string } {
  const phase = randomElement(phases);
  const statuses = phaseStatuses[phase];
  const status = randomElement(statuses);
  return { phase, status };
}

// ============================================
// Seed API
// ============================================

export async function POST() {
  try {
    const supabase = await createClient();

    console.log("🌱 シードデータの投入を開始します...");

    // 既存データを削除
    console.log("⚠️ 既存データを削除中...");
    await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("lease_applications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("contracts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("deals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 1. ユーザー作成 - 15件
    console.log("👤 ユーザーを作成中...");
    type UserRole = "admin" | "manager" | "sales";
    const users: Array<{ id: string; email: string; name: string; role: UserRole }> = [
      { id: crypto.randomUUID(), email: "admin@example.com", name: "管理者 太郎", role: "admin" },
      { id: crypto.randomUUID(), email: "manager1@example.com", name: "佐藤 健一", role: "manager" },
      { id: crypto.randomUUID(), email: "manager2@example.com", name: "高橋 美咲", role: "manager" },
      { id: crypto.randomUUID(), email: "sales1@example.com", name: "田中 大輔", role: "sales" },
      { id: crypto.randomUUID(), email: "sales2@example.com", name: "鈴木 翔太", role: "sales" },
      { id: crypto.randomUUID(), email: "sales3@example.com", name: "伊藤 裕子", role: "sales" },
      { id: crypto.randomUUID(), email: "sales4@example.com", name: "渡辺 健太", role: "sales" },
      { id: crypto.randomUUID(), email: "sales5@example.com", name: "山本 直樹", role: "sales" },
      { id: crypto.randomUUID(), email: "sales6@example.com", name: "中村 和也", role: "sales" },
      { id: crypto.randomUUID(), email: "sales7@example.com", name: "小林 誠", role: "sales" },
      { id: crypto.randomUUID(), email: "sales8@example.com", name: "加藤 真一", role: "sales" },
      { id: crypto.randomUUID(), email: "sales9@example.com", name: "吉田 浩二", role: "sales" },
      { id: crypto.randomUUID(), email: "sales10@example.com", name: "山田 智子", role: "sales" },
      { id: crypto.randomUUID(), email: "sales11@example.com", name: "佐々木 由美", role: "sales" },
      { id: crypto.randomUUID(), email: "sales12@example.com", name: "松本 恵子", role: "sales" },
    ];

    const { error: usersError } = await supabase.from("users").insert(users);
    if (usersError) {
      console.error("ユーザー作成エラー:", usersError);
      return NextResponse.json({ error: "ユーザー作成エラー", details: usersError }, { status: 500 });
    }

    // 2. 顧客作成 - 50件
    console.log("🏢 顧客データを作成中...");
    const customers: Array<{
      id: string;
      company_name: string;
      representative_name: string;
      phone: string;
      email: string;
      address: string;
      business_type: "corporation" | "sole_proprietor" | "new_corporation";
      created_at: string;
    }> = [];

    for (let i = 0; i < 50; i++) {
      const prefix = randomElement(companyPrefixes);
      const type = randomElement(companyTypes);
      const suffix = randomElement(["株式会社", "有限会社", "合同会社"]);
      const companyName = `${prefix}${type}${suffix}`;
      const addr = randomElement(addressDetails);

      let businessType: "corporation" | "sole_proprietor" | "new_corporation";
      const rand = Math.random();
      if (rand < 0.75) businessType = "corporation";
      else if (rand < 0.9) businessType = "sole_proprietor";
      else businessType = "new_corporation";

      const createdDate = randomDate(new Date("2023-06-01"), new Date("2024-12-01"));
      customers.push({
        id: crypto.randomUUID(),
        company_name: companyName,
        representative_name: `${randomElement(lastNames)} ${randomElement(firstNames)}`,
        phone: generatePhone(),
        email: generateEmail(companyName),
        address: `${addr.pref}${addr.city}${addr.town}${randomInt(1, 10)}-${randomInt(1, 20)}-${randomInt(1, 30)}`,
        business_type: businessType,
        created_at: createdDate.toISOString(),
      });
    }

    const { error: customersError } = await supabase.from("customers").insert(customers);
    if (customersError) {
      console.error("顧客作成エラー:", customersError);
      return NextResponse.json({ error: "顧客作成エラー", details: customersError }, { status: 500 });
    }

    // 3. 案件作成 - 50件
    console.log("📋 案件データを作成中...");
    const salesUsers = users.filter(u => u.role === "sales");
    type DealStatus = "active" | "won" | "lost" | "pending";
    const deals: Array<{
      id: string;
      customer_id: string;
      assigned_user_id: string;
      title: string;
      status: DealStatus;
      description: string | null;
      total_amount: number | null;
      created_at: string;
    }> = [];

    for (let i = 0; i < 50; i++) {
      const customer = randomElement(customers);
      const user = randomElement(salesUsers);
      const contractType = randomElement(contractTypes);
      const productCategory = randomElement(productCategoriesByType[contractType]);
      const daysAgo = randomInt(1, 180);
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - daysAgo);

      deals.push({
        id: crypto.randomUUID(),
        customer_id: customer.id,
        assigned_user_id: user.id,
        title: `${customer.company_name.substring(0, 12)} - ${productCategory}`,
        status: "active",
        description: `${productCategory}の導入案件`,
        total_amount: randomInt(100000, 3000000),
        created_at: createdDate.toISOString(),
      });
    }

    const { error: dealsError } = await supabase.from("deals").insert(deals);
    if (dealsError) {
      console.error("案件作成エラー:", dealsError);
      return NextResponse.json({ error: "案件作成エラー", details: dealsError }, { status: 500 });
    }

    // 4. 契約作成 - 50件
    console.log("📝 契約データを作成中...");
    const contractMonthsOptions = [12, 24, 36, 48, 60, 72, 84];
    const contracts: Array<{
      id: string;
      deal_id: string;
      title: string;
      contract_type: string;
      product_category: string;
      lease_company: string | null;
      phase: string;
      status: string;
      monthly_amount: number | null;
      total_amount: number | null;
      contract_months: number | null;
      start_date: string | null;
      end_date: string | null;
      notes: string | null;
      created_at: string;
    }> = [];

    for (let i = 0; i < 50; i++) {
      const deal = deals[i];
      const { phase, status } = getRandomPhaseAndStatus();
      const contractType = randomElement(contractTypes);
      const productCategory = randomElement(productCategoriesByType[contractType]);
      const months = randomElement(contractMonthsOptions);
      const monthlyAmount = randomInt(10000, 150000);
      const totalAmount = monthlyAmount * months;

      const startDate = ["入金中", "請求中", "完了"].includes(phase)
        ? new Date(new Date(deal.created_at).getTime() + randomInt(30, 90) * 24 * 60 * 60 * 1000)
        : null;

      const endDate = startDate
        ? new Date(startDate.getTime() + months * 30 * 24 * 60 * 60 * 1000)
        : null;

      const leaseCompany = contractType === "property" ? randomElement(leaseCompanies) : null;

      contracts.push({
        id: crypto.randomUUID(),
        deal_id: deal.id,
        title: `${productCategory}契約`,
        contract_type: contractType,
        product_category: productCategory,
        lease_company: leaseCompany,
        phase,
        status,
        monthly_amount: monthlyAmount,
        total_amount: totalAmount,
        contract_months: months,
        start_date: startDate ? formatDate(startDate) : null,
        end_date: endDate ? formatDate(endDate) : null,
        notes: Math.random() > 0.7 ? "特記事項あり" : null,
        created_at: deal.created_at,
      });
    }

    const { error: contractsError } = await supabase.from("contracts").insert(contracts);
    if (contractsError) {
      console.error("契約作成エラー:", contractsError);
      return NextResponse.json({ error: "契約作成エラー", details: contractsError }, { status: 500 });
    }

    // 5. タスク作成 - 50件
    console.log("✅ タスクデータを作成中...");
    type TaskStatus = "未着手" | "進行中" | "完了";
    const taskTemplates = [
      { title: "商談日程調整", priority: "high" as const, description: "顧客と商談の日程を調整する", company: "自社" },
      { title: "見積書作成", priority: "high" as const, description: "顧客要望に基づいて見積書を作成する", company: "自社" },
      { title: "審査書類準備", priority: "high" as const, description: "リース審査用の書類を準備する", company: "自社" },
      { title: "審査申込", priority: "high" as const, description: "リース会社に審査を申し込む", company: "リース会社" },
      { title: "下見日程調整", priority: "medium" as const, description: "工事業者と下見の日程を調整", company: "工事業者" },
      { title: "工事実施", priority: "high" as const, description: "設置工事を実施する", company: "工事業者" },
      { title: "検収確認", priority: "high" as const, description: "納品物の検収を確認する", company: "自社" },
      { title: "契約書作成", priority: "high" as const, description: "契約書のドラフトを作成", company: "自社" },
      { title: "入金確認", priority: "medium" as const, description: "入金予定日に入金を確認", company: "自社" },
      { title: "請求処理", priority: "medium" as const, description: "請求書を発行して送付", company: "自社" },
    ];

    const tasks: Array<{
      id: string;
      deal_id: string | null;
      contract_id: string | null;
      assigned_user_id: string;
      title: string;
      description: string | null;
      due_date: string;
      status: TaskStatus;
      priority: "high" | "medium" | "low";
      company: string | null;
      created_at: string;
    }> = [];

    for (let i = 0; i < 50; i++) {
      const template = randomElement(taskTemplates);
      const contract = randomElement(contracts);
      const deal = deals.find(d => d.id === contract.deal_id);
      const user = randomElement(salesUsers);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + randomInt(-14, 30));

      let status: TaskStatus;
      const rand = Math.random();
      if (rand < 0.35) status = "未着手";
      else if (rand < 0.65) status = "進行中";
      else status = "完了";

      tasks.push({
        id: crypto.randomUUID(),
        deal_id: deal?.id || null,
        contract_id: contract.id,
        assigned_user_id: user.id,
        title: deal ? `${template.title} - ${deal.title.substring(0, 12)}` : template.title,
        description: template.description,
        due_date: formatDate(dueDate),
        status,
        priority: template.priority,
        company: template.company,
        created_at: new Date(dueDate.getTime() - randomInt(3, 14) * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    const { error: tasksError } = await supabase.from("tasks").insert(tasks);
    if (tasksError) {
      console.error("タスク作成エラー:", tasksError);
      return NextResponse.json({ error: "タスク作成エラー", details: tasksError }, { status: 500 });
    }

    // 6. 活動履歴作成 - 80件
    console.log("📞 活動履歴を作成中...");
    const activityTemplates = [
      { type: "phone" as const, content: "初回ヒアリング実施。" },
      { type: "visit" as const, content: "現地訪問でヒアリング実施。" },
      { type: "email" as const, content: "見積書を送付。" },
      { type: "phone" as const, content: "見積書の確認状況をフォロー。" },
      { type: "online_meeting" as const, content: "Web会議で詳細説明実施。" },
      { type: "visit" as const, content: "契約書の説明と押印手続き。" },
    ];

    const activities: Array<{
      id: string;
      deal_id: string;
      user_id: string;
      activity_type: "phone" | "visit" | "email" | "online_meeting" | "other";
      content: string;
      created_at: string;
    }> = [];

    for (let i = 0; i < 80; i++) {
      const template = randomElement(activityTemplates);
      const deal = randomElement(deals);
      const user = randomElement(salesUsers);
      const activityDate = new Date(deal.created_at);
      activityDate.setDate(activityDate.getDate() + randomInt(0, 60));

      activities.push({
        id: crypto.randomUUID(),
        deal_id: deal.id,
        user_id: user.id,
        activity_type: template.type,
        content: template.content,
        created_at: activityDate.toISOString(),
      });
    }

    const { error: activitiesError } = await supabase.from("activities").insert(activities);
    if (activitiesError) {
      console.error("活動履歴作成エラー:", activitiesError);
      return NextResponse.json({ error: "活動履歴作成エラー", details: activitiesError }, { status: 500 });
    }

    console.log("🎉 シードデータの投入が完了しました！");

    return NextResponse.json({
      success: true,
      message: "シードデータの投入が完了しました",
      data: {
        users: users.length,
        customers: customers.length,
        deals: deals.length,
        contracts: contracts.length,
        tasks: tasks.length,
        activities: activities.length,
      },
      phases: Object.keys(phaseStatuses),
      contractTypes: ["property", "line", "maintenance"],
    });

  } catch (error) {
    console.error("シードエラー:", error);
    return NextResponse.json(
      { error: "シード処理中にエラーが発生しました", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "シードAPIです。POSTリクエストでデータを投入します。",
    warning: "このエンドポイントは既存データを全て削除してから新しいデータを投入します。",
    usage: "curl -X POST http://localhost:3000/api/seed",
  });
}
