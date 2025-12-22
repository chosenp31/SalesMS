import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// 環境変数を取得（.env.localファイルまたはprocess.envから）
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// .env.localファイルがあれば読み込む
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      if (key.trim() === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = value;
      if (key.trim() === "SUPABASE_SERVICE_ROLE_KEY") supabaseServiceKey = value;
    }
  });
}

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(`Supabase環境変数が設定されていません
  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "設定済" : "未設定"}
  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? "設定済" : "未設定"}

  .env.localファイルを作成するか、環境変数を設定してください。`);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// マスターデータ
// ============================================

// 日本人の名前
const lastNames = [
  "田中", "鈴木", "佐藤", "高橋", "伊藤", "渡辺", "山本", "中村", "小林", "加藤",
  "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水",
  "森", "池田", "橋本", "阿部", "石川", "前田", "藤田", "後藤", "岡田", "長谷川"
];

const firstNames = [
  "太郎", "一郎", "健太", "大輔", "翔太", "裕介", "和也", "直樹", "拓也", "誠",
  "真一", "浩二", "正義", "康弘", "英樹", "秀雄", "勝", "進", "修", "豊",
  "美咲", "陽子", "裕子", "真由美", "恵子", "智子", "由美子", "久美子", "京子", "幸子"
];

// 会社名パターン
const companyPrefixes = [
  "東京", "大阪", "名古屋", "横浜", "神戸", "京都", "福岡", "札幌", "仙台", "広島",
  "日本", "全国", "関東", "関西", "東海", "九州", "北海道", "中部", "北陸", "東北",
  "田中", "鈴木", "佐藤", "山田", "高橋", "伊藤", "渡辺", "山本", "中村", "小林",
  "サンライズ", "グローバル", "テクノ", "アドバンス", "フューチャー", "ネクスト"
];

const companyTypes = [
  "建設", "不動産", "運輸", "物流", "製造", "食品", "IT", "システム", "設備", "電機",
  "機械", "自動車", "医療", "介護", "教育", "飲食", "小売", "卸売", "印刷", "広告",
  "商事", "工業", "産業", "サービス", "ソリューションズ", "テクノロジー", "コーポレーション"
];

// 住所詳細
const addressDetails = [
  { pref: "東京都", city: "千代田区", town: "丸の内", building: "丸の内ビルディング" },
  { pref: "東京都", city: "港区", town: "六本木", building: "六本木ヒルズ森タワー" },
  { pref: "東京都", city: "新宿区", town: "西新宿", building: "新宿アイランドタワー" },
  { pref: "東京都", city: "渋谷区", town: "道玄坂", building: "渋谷マークシティ" },
  { pref: "東京都", city: "中央区", town: "銀座", building: "銀座三越ビル" },
  { pref: "東京都", city: "品川区", town: "大崎", building: "ゲートシティ大崎" },
  { pref: "大阪府", city: "大阪市北区", town: "梅田", building: "グランフロント大阪" },
  { pref: "大阪府", city: "大阪市中央区", town: "難波", building: "なんばパークス" },
  { pref: "愛知県", city: "名古屋市中区", town: "栄", building: "名古屋ミッドランドスクエア" },
  { pref: "神奈川県", city: "横浜市西区", town: "みなとみらい", building: "ランドマークタワー" },
  { pref: "福岡県", city: "福岡市博多区", town: "博多駅前", building: "JR博多シティ" },
  { pref: "北海道", city: "札幌市中央区", town: "北1条西", building: "札幌ステラプレイス" },
];

// 新しい契約種別
const contractTypes = ["property", "line", "maintenance"] as const;

// 契約種別ごとの商品カテゴリ
const productCategoriesByType: Record<string, string[]> = {
  property: ["UTM", "ルーター", "複合機", "その他"],
  line: ["インターネット", "電話", "その他"],
  maintenance: ["インターネット", "電話", "その他"],
};

// リース会社
const leaseCompanies = ["C-mind", "オリコ", "ジャックス", "その他"];

// 新しい契約フェーズ・ステータス
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

// タスク担当会社
const taskCompanies = ["自社", "リース会社", "工事業者", "その他"] as const;

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
  const area = ["03", "06", "052", "045", "092", "011", "022", "082", "075", "078"];
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
// シード実行
// ============================================

async function seed() {
  console.log("🌱 シードデータの投入を開始します...\n");
  console.log("⚠️  既存データを削除中...");

  // 既存データを削除（外部キー制約の順序で）
  await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("installations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("lease_applications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("contracts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("deals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("  ✅ 既存データを削除しました\n");

  // ============================================
  // 1. ユーザー（営業担当者）作成 - 15件
  // ============================================
  console.log("👤 ユーザーを作成中...");
  const users = [
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
    return;
  }
  console.log(`  ✅ ${users.length}件のユーザーを作成しました\n`);

  // ============================================
  // 2. 顧客作成 - 50件
  // ============================================
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

    // 業種タイプの分布
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
      address: `${addr.pref}${addr.city}${addr.town}${randomInt(1, 10)}-${randomInt(1, 20)}-${randomInt(1, 30)} ${addr.building}${randomInt(1, 20)}F`,
      business_type: businessType,
      created_at: createdDate.toISOString(),
    });
  }

  const { error: customersError } = await supabase.from("customers").insert(customers);
  if (customersError) {
    console.error("顧客作成エラー:", customersError);
    return;
  }
  console.log(`  ✅ ${customers.length}件の顧客を作成しました\n`);

  // ============================================
  // 3. 案件作成 - 50件
  // ============================================
  console.log("📋 案件データを作成中...");

  interface Deal {
    id: string;
    customer_id: string;
    assigned_user_id: string;
    title: string;
    status: string;
    description: string | null;
    total_amount: number | null;
    created_at: string;
  }

  const deals: Deal[] = [];
  const salesUsers = users.filter(u => u.role === "sales");

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
    return;
  }
  console.log(`  ✅ ${deals.length}件の案件を作成しました\n`);

  // ============================================
  // 4. 契約作成 - 50件（新しいフェーズ・ステータスを使用）
  // ============================================
  console.log("📝 契約データを作成中...");

  interface Contract {
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
  }

  const contracts: Contract[] = [];
  const contractMonthsOptions = [12, 24, 36, 48, 60, 72, 84];

  for (let i = 0; i < 50; i++) {
    const deal = deals[i];
    const { phase, status } = getRandomPhaseAndStatus();
    const contractType = randomElement(contractTypes);
    const productCategory = randomElement(productCategoriesByType[contractType]);
    const months = randomElement(contractMonthsOptions);
    const monthlyAmount = randomInt(10000, 150000);
    const totalAmount = monthlyAmount * months;

    // 入金中、請求中、完了の場合は開始日・終了日を設定
    const startDate = ["入金中", "請求中", "完了"].includes(phase)
      ? new Date(new Date(deal.created_at).getTime() + randomInt(30, 90) * 24 * 60 * 60 * 1000)
      : null;

    const endDate = startDate
      ? new Date(startDate.getTime() + months * 30 * 24 * 60 * 60 * 1000)
      : null;

    // 物件タイプの場合のみリース会社を設定
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
    return;
  }
  console.log(`  ✅ ${contracts.length}件の契約を作成しました\n`);

  // ============================================
  // 5. リース審査作成 - 30件（物件タイプのみ）
  // ============================================
  console.log("📝 リース審査データを作成中...");

  type LeaseStatus = "準備中" | "審査結果待ち" | "可決" | "否決" | "条件付可決";

  const leaseApplications: Array<{
    id: string;
    contract_id: string;
    lease_company: string;
    status: LeaseStatus;
    submitted_at: string | null;
    result_at: string | null;
    conditions: string | null;
    created_at: string;
  }> = [];

  const propertyContracts = contracts.filter(c => c.contract_type === "property");
  const conditionsOptions = [
    "保証人の追加が必要",
    "前払い金20%の入金が必要",
    "直近3期分の決算書提出が必要",
    "代表者の連帯保証が必要",
  ];

  for (let i = 0; i < 30 && i < propertyContracts.length; i++) {
    const contract = propertyContracts[i];
    const createdDate = new Date(contract.created_at);

    // ステータス分布
    let status: LeaseStatus;
    const rand = Math.random();
    if (rand < 0.15) status = "準備中";
    else if (rand < 0.35) status = "審査結果待ち";
    else if (rand < 0.75) status = "可決";
    else if (rand < 0.85) status = "否決";
    else status = "条件付可決";

    let submittedAt: string | null = null;
    let resultAt: string | null = null;
    let conditions: string | null = null;

    if (status !== "準備中") {
      const submitDate = new Date(createdDate);
      submitDate.setDate(submitDate.getDate() + randomInt(1, 7));
      submittedAt = submitDate.toISOString();

      if (["可決", "否決", "条件付可決"].includes(status)) {
        const resultDate = new Date(submitDate);
        resultDate.setDate(resultDate.getDate() + randomInt(3, 14));
        resultAt = resultDate.toISOString();
      }
    }

    if (status === "条件付可決") {
      conditions = randomElement(conditionsOptions);
    }

    leaseApplications.push({
      id: crypto.randomUUID(),
      contract_id: contract.id,
      lease_company: contract.lease_company || randomElement(leaseCompanies),
      status,
      submitted_at: submittedAt,
      result_at: resultAt,
      conditions,
      created_at: createdDate.toISOString(),
    });
  }

  const { error: leaseError } = await supabase.from("lease_applications").insert(leaseApplications);
  if (leaseError) {
    console.error("リース審査作成エラー:", leaseError);
    return;
  }
  console.log(`  ✅ ${leaseApplications.length}件のリース審査を作成しました\n`);

  // ============================================
  // 6. 入金データ作成 - 40件
  // ============================================
  console.log("💰 入金データを作成中...");

  type PaymentStatus = "入金予定" | "入金済";

  const payments: Array<{
    id: string;
    contract_id: string;
    payment_type: "initial" | "monthly" | "final" | "other";
    expected_amount: number;
    actual_amount: number | null;
    expected_date: string;
    actual_date: string | null;
    status: PaymentStatus;
    notes: string | null;
  }> = [];

  for (let i = 0; i < 40; i++) {
    const contract = contracts[i % contracts.length];
    const expectedDate = new Date(contract.created_at);
    expectedDate.setDate(expectedDate.getDate() + randomInt(30, 90));

    const isPaid = Math.random() < 0.55;
    const expectedAmount = contract.monthly_amount || randomInt(50000, 200000);

    payments.push({
      id: crypto.randomUUID(),
      contract_id: contract.id,
      payment_type: randomElement(["initial", "monthly", "final", "other"] as const),
      expected_amount: expectedAmount,
      actual_amount: isPaid ? expectedAmount : null,
      expected_date: formatDate(expectedDate),
      actual_date: isPaid ? formatDate(new Date(expectedDate.getTime() + randomInt(-5, 10) * 24 * 60 * 60 * 1000)) : null,
      status: isPaid ? "入金済" : "入金予定",
      notes: null,
    });
  }

  const { error: paymentsError } = await supabase.from("payments").insert(payments);
  if (paymentsError) {
    console.error("入金作成エラー:", paymentsError);
    return;
  }
  console.log(`  ✅ ${payments.length}件の入金データを作成しました\n`);

  // ============================================
  // 7. タスク作成 - 50件
  // ============================================
  console.log("✅ タスクデータを作成中...");

  type TaskStatus = "未着手" | "進行中" | "完了";

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

  const taskTemplates = [
    { title: "商談日程調整", priority: "high" as const, description: "顧客と商談の日程を調整する", company: "自社" },
    { title: "見積書作成", priority: "high" as const, description: "顧客要望に基づいて見積書を作成する", company: "自社" },
    { title: "審査書類準備", priority: "high" as const, description: "リース審査用の書類を準備する", company: "自社" },
    { title: "審査申込", priority: "high" as const, description: "リース会社に審査を申し込む", company: "リース会社" },
    { title: "下見日程調整", priority: "medium" as const, description: "工事業者と下見の日程を調整", company: "工事業者" },
    { title: "下見実施", priority: "medium" as const, description: "現地下見を実施する", company: "工事業者" },
    { title: "工事日程調整", priority: "medium" as const, description: "工事の日程を調整する", company: "工事業者" },
    { title: "工事実施", priority: "high" as const, description: "設置工事を実施する", company: "工事業者" },
    { title: "検収確認", priority: "high" as const, description: "納品物の検収を確認する", company: "自社" },
    { title: "契約書作成", priority: "high" as const, description: "契約書のドラフトを作成", company: "自社" },
    { title: "契約書確認依頼", priority: "medium" as const, description: "顧客に契約書の確認を依頼", company: "自社" },
    { title: "入金確認", priority: "medium" as const, description: "入金予定日に入金を確認", company: "自社" },
    { title: "初回請求確認", priority: "medium" as const, description: "初回請求の内容を確認", company: "自社" },
    { title: "請求処理", priority: "medium" as const, description: "請求書を発行して送付", company: "自社" },
    { title: "アフターフォロー", priority: "low" as const, description: "納品後のフォローアップ電話", company: "自社" },
  ];

  for (let i = 0; i < 50; i++) {
    const template = randomElement(taskTemplates);
    const contract = randomElement(contracts);
    const deal = deals.find(d => d.id === contract.deal_id);
    const user = randomElement(salesUsers);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + randomInt(-14, 30));

    // ステータス分布
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
    return;
  }
  console.log(`  ✅ ${tasks.length}件のタスクを作成しました\n`);

  // ============================================
  // 8. 活動履歴作成 - 80件
  // ============================================
  console.log("📞 活動履歴を作成中...");

  const activities: Array<{
    id: string;
    deal_id: string;
    user_id: string;
    activity_type: "phone" | "visit" | "email" | "online_meeting" | "other";
    content: string;
    created_at: string;
  }> = [];

  const activityTemplates = [
    { type: "phone" as const, content: "初回ヒアリング実施。現状の課題として、既存機器の老朽化を挙げられた。" },
    { type: "visit" as const, content: "現地訪問でヒアリング実施。設置場所を確認し、電源・ネットワーク環境をチェック。" },
    { type: "email" as const, content: "見積書を送付。ご不明点があればお問い合わせくださいとご案内。" },
    { type: "phone" as const, content: "見積書の確認状況をフォロー。社内検討中とのこと。" },
    { type: "online_meeting" as const, content: "Web会議で詳細説明実施。決裁者にも同席いただいた。" },
    { type: "visit" as const, content: "契約書の説明と押印手続き。リース審査書類も受領。" },
    { type: "phone" as const, content: "リース審査の状況報告。順調に進行中。" },
    { type: "email" as const, content: "リース審査通過のご報告。設置工事の日程調整依頼。" },
    { type: "visit" as const, content: "現地調査実施。搬入経路と設置場所を確認。" },
    { type: "phone" as const, content: "設置工事日程の最終確認。当日の立ち会い者を確認。" },
    { type: "visit" as const, content: "設置工事完了。動作確認を実施し、操作説明を行った。" },
    { type: "phone" as const, content: "納品後フォロー電話。順調に稼働中とのこと。" },
  ];

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
    return;
  }
  console.log(`  ✅ ${activities.length}件の活動履歴を作成しました\n`);

  // ============================================
  // 完了サマリー
  // ============================================
  console.log("🎉 シードデータの投入が完了しました！");
  console.log("\n📊 作成されたデータ:");
  console.log(`  - ユーザー: ${users.length}件`);
  console.log(`  - 顧客: ${customers.length}件`);
  console.log(`  - 案件: ${deals.length}件`);
  console.log(`  - 契約: ${contracts.length}件`);
  console.log(`  - リース審査: ${leaseApplications.length}件`);
  console.log(`  - 入金: ${payments.length}件`);
  console.log(`  - タスク: ${tasks.length}件`);
  console.log(`  - 活動履歴: ${activities.length}件`);

  console.log("\n📈 新しいフェーズ・ステータス:");
  console.log("  - 商談中: 商談待ち, 商談日程調整中");
  console.log("  - 審査・申込中: 審査・申込対応中, 審査・申込待ち");
  console.log("  - 下見・工事中: 下見調整中, 下見実施待ち, 工事日程調整中, 工事実施待ち");
  console.log("  - 契約中: 検収確認中, 契約書提出対応中, 契約書確認待ち");
  console.log("  - 入金中: 入金待ち, 入金済");
  console.log("  - 請求中: 初回請求確認待ち, 請求処理対応中");
  console.log("  - 完了: クローズ");
  console.log("  - 否決: 対応検討中, 失注");

  console.log("\n📦 新しい契約種別:");
  console.log("  - property (物件): UTM, ルーター, 複合機, その他");
  console.log("  - line (回線): インターネット, 電話, その他");
  console.log("  - maintenance (保守): インターネット, 電話, その他");
}

seed().catch(console.error);
