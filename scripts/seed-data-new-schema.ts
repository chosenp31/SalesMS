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

const supabaseUrl = (envVars.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\\n/g, "").replace(/"/g, "").trim();
const supabaseKey = (envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").replace(/\\n/g, "").replace(/"/g, "").trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase環境変数が設定されていません");
}

console.log("🔗 Supabase URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// マスターデータ（新体系）
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

// ★★★ 新体系：契約種別 ★★★
const contractTypes = ["property", "line", "maintenance"] as const;

// 商品カテゴリ（契約種別別）
const productCategoriesByType: Record<string, { categories: string[]; priceRange: [number, number] }> = {
  property: {
    categories: ["UTM", "複合機", "ビジネスフォン", "防犯カメラ"],
    priceRange: [200000, 2500000]
  },
  line: {
    categories: ["光回線", "電話回線", "インターネット回線"],
    priceRange: [5000, 30000]  // 月額
  },
  maintenance: {
    categories: ["UTM保守", "複合機保守", "ビジネスフォン保守", "システム保守"],
    priceRange: [5000, 50000]  // 月額
  },
};

// リース会社
const leaseCompanies = ["C-mind", "オリコ", "ジャックス", "その他"];

// ★★★ 新体系：契約フェーズ・ステータス ★★★
const contractPhaseStatuses = {
  "商談中": ["商談待ち", "商談日程調整中"],
  "審査・申込中": ["審査・申込対応中", "審査・申込待ち"],
  "下見・工事中": ["下見調整中", "下見実施待ち", "工事日程調整中", "工事実施待ち"],
  "契約中": ["検収確認中", "契約書提出対応中", "契約書確認待ち"],
  "入金中": ["入金待ち", "入金済"],
  "請求中": ["初回請求確認待ち", "請求処理対応中"],
  "完了": ["クローズ"],
  "否決": ["対応検討中", "失注"],
} as const;

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
  const phases = Object.keys(contractPhaseStatuses) as (keyof typeof contractPhaseStatuses)[];
  const phase = randomElement(phases);
  const statuses = contractPhaseStatuses[phase];
  const status = randomElement(statuses);
  return { phase, status };
}

// ============================================
// シード実行
// ============================================

async function seed() {
  console.log("🌱 シードデータの投入を開始します（新体系）...\n");
  console.log("⚠️  既存データを削除中...");

  // 既存データを削除（外部キー制約の順序で）
  await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
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

    const createdDate = randomDate(new Date("2024-06-01"), new Date("2024-12-01"));
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
    status: "active" | "won" | "lost" | "pending";
    contract_type: string;
    product_category: string;
    created_at: string;
  }

  const deals: Deal[] = [];
  const salesUsers = users.filter(u => u.role === "sales");
  const dealStatuses: Array<"active" | "won" | "lost" | "pending"> = ["active", "won", "lost", "pending"];
  const dealStatusWeights = [0.5, 0.25, 0.15, 0.1]; // 進行中50%, 成約25%, 失注15%, 保留10%

  for (let i = 0; i < 50; i++) {
    const customer = randomElement(customers);
    const user = randomElement(salesUsers);
    const contractType = randomElement(contractTypes);
    const productInfo = productCategoriesByType[contractType];
    const productCategory = randomElement(productInfo.categories);

    const daysAgo = randomInt(1, 180);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);

    // ステータスの重み付きランダム選択
    const rand = Math.random();
    let status: "active" | "won" | "lost" | "pending";
    let cumulative = 0;
    for (let j = 0; j < dealStatuses.length; j++) {
      cumulative += dealStatusWeights[j];
      if (rand <= cumulative) {
        status = dealStatuses[j];
        break;
      }
    }
    status = status! || "active";

    deals.push({
      id: crypto.randomUUID(),
      customer_id: customer.id,
      assigned_user_id: user.id,
      title: `${productCategory}導入案件`,
      status,
      contract_type: contractType,
      product_category: productCategory,
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
  // 4. 契約作成 - 50件（各案件に1件ずつ）
  // ============================================
  console.log("📝 契約データを作成中（新体系）...");

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

  // 50件の契約を作成（最初の50案件に1件ずつ）
  for (let i = 0; i < 50; i++) {
    const deal = deals[i];
    const contractType = randomElement(contractTypes);
    const productInfo = productCategoriesByType[contractType];
    const productCategory = randomElement(productInfo.categories);

    const { phase, status } = getRandomPhaseAndStatus();
    const months = randomElement(contractMonthsOptions);
    const monthlyAmount = randomInt(10000, 150000);
    const totalAmount = monthlyAmount * months;

    // 入金中以降のフェーズの場合は開始日を設定
    const activePhases = ["入金中", "請求中", "完了"];
    const startDate = activePhases.includes(phase)
      ? new Date(new Date(deal.created_at).getTime() + randomInt(30, 90) * 24 * 60 * 60 * 1000)
      : null;

    const endDate = startDate
      ? new Date(startDate.getTime() + months * 30 * 24 * 60 * 60 * 1000)
      : null;

    // 物件契約の場合はリース会社を設定
    const needsLeaseCompany = contractType === "property" && !["商談中", "否決"].includes(phase);

    // 契約種別の日本語名
    const contractTypeNames: Record<string, string> = {
      property: "物件",
      line: "回線",
      maintenance: "保守",
    };

    contracts.push({
      id: crypto.randomUUID(),
      deal_id: deal.id,
      title: `${productCategory}${contractTypeNames[contractType]}契約`,
      contract_type: contractType,
      product_category: productCategory,
      lease_company: needsLeaseCompany ? randomElement(leaseCompanies) : null,
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
    console.error("詳細:", JSON.stringify(contractsError, null, 2));
    return;
  }
  console.log(`  ✅ ${contracts.length}件の契約を作成しました\n`);

  // ============================================
  // 5. リース審査作成 - 30件（物件契約のみ）
  // ============================================
  console.log("📝 リース審査データを作成中...");

  type LeaseStatus = "準備中" | "審査結果待ち" | "可決" | "否決" | "条件付可決";

  const leaseApplications: Array<{
    id: string;
    deal_id: string;
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

  for (let i = 0; i < Math.min(30, propertyContracts.length); i++) {
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
      deal_id: contract.deal_id,
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
  type PaymentType = "initial" | "monthly" | "final" | "other";

  const payments: Array<{
    id: string;
    deal_id: string;
    contract_id: string;
    expected_amount: number;
    actual_amount: number | null;
    expected_date: string;
    actual_date: string | null;
    status: PaymentStatus;
    lease_company: string | null;
  }> = [];

  // 入金中・請求中・完了のフェーズの契約に対して入金データを作成
  const paymentPhases = ["入金中", "請求中", "完了"];
  const paymentContracts = contracts.filter(c => paymentPhases.includes(c.phase));

  for (let i = 0; i < Math.min(40, paymentContracts.length * 2); i++) {
    const contract = paymentContracts[i % paymentContracts.length];
    const expectedDate = new Date(contract.created_at);
    expectedDate.setDate(expectedDate.getDate() + randomInt(30, 90));

    const isPaid = Math.random() < 0.55;
    const expectedAmount = contract.monthly_amount || randomInt(50000, 200000);

    payments.push({
      id: crypto.randomUUID(),
      deal_id: contract.deal_id,
      contract_id: contract.id,
      expected_amount: expectedAmount,
      actual_amount: isPaid ? expectedAmount : null,
      expected_date: formatDate(expectedDate),
      actual_date: isPaid ? formatDate(new Date(expectedDate.getTime() + randomInt(-5, 10) * 24 * 60 * 60 * 1000)) : null,
      status: isPaid ? "入金済" : "入金予定",
      lease_company: contract.lease_company,
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
    { title: "見積書作成", priority: "high" as const, description: "顧客要望に基づいて見積書を作成する", company: "自社" },
    { title: "契約書準備", priority: "high" as const, description: "契約書のドラフトを作成", company: "自社" },
    { title: "現地調査日程調整", priority: "medium" as const, description: "顧客と現地調査の日程を調整", company: "工事業者" },
    { title: "設置工事立会い", priority: "high" as const, description: "設置工事に立ち会い、完了確認", company: "工事業者" },
    { title: "リース審査書類確認", priority: "high" as const, description: "書類の確認と不足書類の依頼", company: "リース会社" },
    { title: "請求書発行", priority: "medium" as const, description: "納品完了後、請求書を発行", company: "自社" },
    { title: "入金確認", priority: "medium" as const, description: "入金予定日に入金を確認", company: "自社" },
    { title: "アフターフォロー電話", priority: "low" as const, description: "納品後フォローアップ電話", company: "自社" },
    { title: "定期メンテナンス案内", priority: "low" as const, description: "年次メンテナンスの案内送付", company: "その他" },
    { title: "機器搬入準備", priority: "medium" as const, description: "搬入経路と設置場所の確認", company: "工事業者" },
    { title: "デモ機手配", priority: "medium" as const, description: "顧客デモ用の機器を手配", company: "自社" },
    { title: "提案書作成", priority: "high" as const, description: "顧客向けの提案書を作成", company: "自社" },
    { title: "審査申込書類準備", priority: "high" as const, description: "審査申込に必要な書類を準備", company: "自社" },
    { title: "下見日程調整", priority: "medium" as const, description: "工事業者と下見日程を調整", company: "工事業者" },
    { title: "工事完了報告", priority: "high" as const, description: "工事完了後、顧客に報告", company: "自社" },
  ];

  for (let i = 0; i < 50; i++) {
    const template = randomElement(taskTemplates);
    const contract = Math.random() > 0.15 ? randomElement(contracts) : null;
    const deal = contract ? deals.find(d => d.id === contract.deal_id) : (Math.random() > 0.3 ? randomElement(deals) : null);
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
      contract_id: contract?.id || null,
      assigned_user_id: user.id,
      title: template.title,
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
  console.log("🎉 シードデータの投入が完了しました（新体系）！");
  console.log("\n📊 作成されたデータ:");
  console.log(`  - ユーザー: ${users.length}件`);
  console.log(`  - 顧客: ${customers.length}件`);
  console.log(`  - 案件: ${deals.length}件`);
  console.log(`  - 契約: ${contracts.length}件`);
  console.log(`  - リース審査: ${leaseApplications.length}件`);
  console.log(`  - 入金: ${payments.length}件`);
  console.log(`  - タスク: ${tasks.length}件`);
  console.log(`  - 活動履歴: ${activities.length}件`);

  console.log("\n📈 新体系データパターン:");
  console.log("  - 案件ステータス: 進行中50%, 成約25%, 失注15%, 保留10%");
  console.log("  - 契約種別: 物件(property), 回線(line), 保守(maintenance)");
  console.log("  - 契約フェーズ: 商談中, 審査・申込中, 下見・工事中, 契約中, 入金中, 請求中, 完了, 否決");
  console.log("  - タスク: 未着手/進行中/完了 + 担当会社（自社/リース会社/工事業者/その他）");
}

seed().catch(console.error);
