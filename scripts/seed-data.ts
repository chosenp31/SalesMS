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
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase環境変数が設定されていません");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// マスターデータ
// ============================================

// 実在に近い会社名パターン
const realCompanyPatterns = [
  // 地域 + 業種 + 法人格
  { prefix: "東京", type: "建設", suffix: "株式会社" },
  { prefix: "大阪", type: "不動産", suffix: "株式会社" },
  { prefix: "名古屋", type: "運輸", suffix: "株式会社" },
  { prefix: "横浜", type: "物流", suffix: "株式会社" },
  { prefix: "神戸", type: "製造", suffix: "株式会社" },
  { prefix: "京都", type: "食品", suffix: "株式会社" },
  { prefix: "福岡", type: "IT", suffix: "株式会社" },
  { prefix: "札幌", type: "システム", suffix: "株式会社" },
  // 人名 + 業種
  { prefix: "田中", type: "商事", suffix: "株式会社" },
  { prefix: "鈴木", type: "工業", suffix: "株式会社" },
  { prefix: "佐藤", type: "産業", suffix: "株式会社" },
  { prefix: "山田", type: "電機", suffix: "株式会社" },
  // カタカナ系
  { prefix: "サンライズ", type: "トレーディング", suffix: "株式会社" },
  { prefix: "グローバル", type: "ソリューションズ", suffix: "株式会社" },
  { prefix: "テクノ", type: "システムズ", suffix: "株式会社" },
  { prefix: "アドバンス", type: "コーポレーション", suffix: "株式会社" },
];

// 個人事業主名
const soleProprietorNames = [
  "田中事務所", "鈴木デザイン", "佐藤会計事務所", "高橋クリニック",
  "伊藤法律事務所", "渡辺整骨院", "山本美容室", "中村歯科医院",
  "小林工務店", "加藤写真館", "吉田農園", "山口畳店"
];

// 日本人の名前
const lastNames = [
  "田中", "鈴木", "佐藤", "高橋", "伊藤", "渡辺", "山本", "中村", "小林", "加藤",
  "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水"
];

const firstNames = [
  "太郎", "一郎", "健太", "大輔", "翔太", "裕介", "和也", "直樹", "拓也", "誠",
  "真一", "浩二", "正義", "康弘", "英樹", "秀雄", "勝", "進", "修", "豊"
];

// 都道府県と住所（より詳細に）
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

// 商品カテゴリと詳細
const productDetails = [
  { category: "複合機", models: ["Canon imageRUNNER ADVANCE", "RICOH IM C6000", "SHARP MX-6171"], priceRange: [800000, 2500000] },
  { category: "ビジネスPC", models: ["Dell OptiPlex 7000", "HP ProDesk 400", "Lenovo ThinkCentre"], priceRange: [150000, 300000] },
  { category: "サーバー", models: ["Dell PowerEdge R750", "HPE ProLiant DL380", "NEC Express5800"], priceRange: [500000, 3000000] },
  { category: "ネットワーク機器", models: ["Cisco Catalyst 9200", "YAMAHA RTX1220", "FortiGate 60F"], priceRange: [100000, 800000] },
  { category: "UTM/セキュリティ", models: ["FortiGate 100F", "SonicWall TZ470", "WatchGuard Firebox"], priceRange: [200000, 1500000] },
  { category: "業務用エアコン", models: ["ダイキン SZRC80BV", "三菱電機 PLZ-ZRMP80", "日立 RCI-GP80K"], priceRange: [300000, 1200000] },
  { category: "LED照明", models: ["パナソニック iDシリーズ", "東芝 LEKR430", "オーデリック XD504"], priceRange: [50000, 500000] },
  { category: "防犯カメラ", models: ["HIKVISION DS-2CD2143G2", "Axis P3245-V", "Panasonic WV-S2136"], priceRange: [80000, 600000] },
  { category: "ビジネスフォン", models: ["NTT αA1", "SAXA PLATIA", "NEC UNIVERGE"], priceRange: [200000, 1000000] },
  { category: "POSシステム", models: ["東芝テック QT-100", "CASIO VX-100", "スマレジ"], priceRange: [150000, 800000] },
];

// リース会社（実在）
const leaseCompanies = [
  { name: "オリックス", code: "ORIX" },
  { name: "三井住友ファイナンス＆リース", code: "SMFL" },
  { name: "東京センチュリー", code: "TC" },
  { name: "三菱HCキャピタル", code: "MHCC" },
  { name: "芙蓉総合リース", code: "FUYO" },
  { name: "リコーリース", code: "RICOH" },
  { name: "NTTファイナンス", code: "NTTF" },
  { name: "JA三井リース", code: "JAML" },
];

// 案件ステータス（ワークフロー順）
const dealStatusFlow = [
  "appointment_acquired",    // アポ獲得
  "in_negotiation",          // 商談中
  "quote_submitted",         // 見積提出
  "deal_won",                // 受注
  "contract_type_selection", // 契約形態選択
  "document_collection",     // 書類回収
  "review_requested",        // 審査依頼
  "review_pending",          // 審査中
  "review_approved",         // 審査通過
  "survey_scheduling",       // 現調日程調整
  "survey_completed",        // 現調完了
  "installation_scheduling", // 設置日程調整
  "installation_completed",  // 設置完了
  "delivery_completed",      // 納品完了
  "payment_pending",         // 入金待ち
  "completed",               // 完了
];

// ============================================
// ユーティリティ関数
// ============================================

function randomElement<T>(arr: T[]): T {
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

function generateMobilePhone(): string {
  return `090-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
}

function generateCompanyEmail(companyName: string): string {
  const domains = ["co.jp", "jp", "com"];
  const simplified = companyName
    .replace(/[株式会社有限合同（）()]/g, "")
    .replace(/[ー\s]/g, "")
    .substring(0, 8)
    .toLowerCase();

  // ローマ字風に変換（簡易）
  const romanized = simplified
    .replace(/東京/g, "tokyo")
    .replace(/大阪/g, "osaka")
    .replace(/名古屋/g, "nagoya")
    .replace(/建設/g, "kensetsu")
    .replace(/不動産/g, "fudosan")
    .replace(/商事/g, "shoji")
    .replace(/工業/g, "kogyo")
    .replace(/産業/g, "sangyo")
    .replace(/電機/g, "denki")
    .replace(/システム/g, "system")
    .replace(/IT/g, "it");

  return `info@${romanized || "company"}.${randomElement(domains)}`;
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
  await supabase.from("deals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("  ✅ 既存データを削除しました\n");

  // ============================================
  // 1. ユーザー（営業担当者）作成
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
  ];

  const { error: usersError } = await supabase.from("users").insert(users);
  if (usersError) {
    console.error("ユーザー作成エラー:", usersError);
    return;
  }
  console.log(`  ✅ ${users.length}件のユーザーを作成しました\n`);

  // ============================================
  // 2. 顧客作成（120件：様々なパターン）
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

  // 会社名のバリエーション
  const companyPrefixes = [
    "東京", "大阪", "名古屋", "横浜", "神戸", "京都", "福岡", "札幌", "仙台", "広島",
    "日本", "全国", "関東", "関西", "東海", "九州", "北海道", "中部", "北陸", "東北",
    "田中", "鈴木", "佐藤", "山田", "高橋", "伊藤", "渡辺", "山本", "中村", "小林"
  ];

  const companyTypes = [
    "建設", "不動産", "運輸", "物流", "製造", "食品", "IT", "システム", "設備", "電機",
    "機械", "自動車", "医療", "介護", "教育", "飲食", "小売", "卸売", "印刷", "広告",
    "商事", "工業", "産業", "サービス", "ソリューションズ", "テクノロジー", "コーポレーション"
  ];

  // 120件の顧客を生成
  for (let i = 0; i < 120; i++) {
    const prefix = randomElement(companyPrefixes);
    const type = randomElement(companyTypes);
    const suffix = randomElement(["株式会社", "有限会社", "合同会社"]);
    const companyName = `${prefix}${type}${suffix}`;
    const addr = randomElement(addressDetails);

    // 業種タイプの分布: 法人80%、個人事業主15%、新設法人5%
    let businessType: "corporation" | "sole_proprietor" | "new_corporation";
    const rand = Math.random();
    if (rand < 0.8) {
      businessType = "corporation";
    } else if (rand < 0.95) {
      businessType = "sole_proprietor";
    } else {
      businessType = "new_corporation";
    }

    const createdDate = randomDate(new Date("2023-01-01"), new Date("2024-11-01"));
    customers.push({
      id: crypto.randomUUID(),
      company_name: companyName,
      representative_name: `${randomElement(lastNames)} ${randomElement(firstNames)}`,
      phone: generatePhone(),
      email: generateCompanyEmail(companyName),
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
  // 3. 案件作成（150件：様々なステータス）
  // ============================================
  console.log("📋 案件データを作成中...");

  interface Deal {
    id: string;
    customer_id: string;
    assigned_user_id: string;
    title: string;
    status: string;
    contract_type: "lease" | "rental" | "installment";
    product_category: string;
    estimated_amount: number;
    created_at: string;
  }

  const deals: Deal[] = [];
  const salesUsers = users.filter(u => u.role === "sales");
  const contractTypes: Array<"lease" | "rental" | "installment"> = ["lease", "rental", "installment"];

  // 150件の案件を生成
  for (let i = 0; i < 150; i++) {
    const customer = randomElement(customers);
    const user = randomElement(salesUsers);
    const product = randomElement(productDetails);
    const status = randomElement(dealStatusFlow);
    const contractType = randomElement(contractTypes);
    const daysAgo = randomInt(1, 180);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);

    deals.push({
      id: crypto.randomUUID(),
      customer_id: customer.id,
      assigned_user_id: user.id,
      title: `${customer.company_name.substring(0, 10)} - ${product.category}導入`,
      status: status,
      contract_type: contractType,
      product_category: product.category,
      estimated_amount: randomInt(product.priceRange[0], product.priceRange[1]),
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
  // 4. リース審査作成（100件：様々な結果）
  // ============================================
  console.log("📝 リース審査データを作成中...");

  const leaseApplications: Array<{
    id: string;
    deal_id: string;
    lease_company: string;
    status: "preparing" | "reviewing" | "approved" | "rejected" | "conditionally_approved";
    submitted_at: string | null;
    result_at: string | null;
    conditions: string | null;
    created_at: string;
  }> = [];

  // リース契約の案件のみ
  const leaseDeals = deals.filter(d => d.contract_type === "lease");
  const leaseStatuses: Array<"preparing" | "reviewing" | "approved" | "rejected" | "conditionally_approved"> =
    ["preparing", "reviewing", "approved", "rejected", "conditionally_approved"];
  const conditionsOptions = [
    "保証人の追加が必要",
    "前払い金20%の入金が必要",
    "直近3期分の決算書提出が必要",
    "取引実績の確認後、最終承認",
    "代表者の連帯保証が必要",
    "担保設定が必要",
  ];

  // 100件のリース審査を生成
  for (let i = 0; i < 100; i++) {
    const deal = leaseDeals[i % leaseDeals.length];
    const leaseCompany = randomElement(leaseCompanies);
    const createdDate = new Date(deal.created_at);

    // ステータス分布: 準備中10%、審査中20%、承認50%、却下10%、条件付き10%
    let status: "preparing" | "reviewing" | "approved" | "rejected" | "conditionally_approved";
    const rand = Math.random();
    if (rand < 0.1) status = "preparing";
    else if (rand < 0.3) status = "reviewing";
    else if (rand < 0.8) status = "approved";
    else if (rand < 0.9) status = "rejected";
    else status = "conditionally_approved";

    let submittedAt: string | null = null;
    let resultAt: string | null = null;
    let conditions: string | null = null;

    if (status !== "preparing") {
      const submitDate = new Date(createdDate);
      submitDate.setDate(submitDate.getDate() + randomInt(1, 5));
      submittedAt = submitDate.toISOString();

      if (["approved", "rejected", "conditionally_approved"].includes(status)) {
        const resultDate = new Date(submitDate);
        resultDate.setDate(resultDate.getDate() + randomInt(3, 10));
        resultAt = resultDate.toISOString();
      }
    }

    if (status === "conditionally_approved") {
      conditions = randomElement(conditionsOptions);
    }

    leaseApplications.push({
      id: crypto.randomUUID(),
      deal_id: deal.id,
      lease_company: leaseCompany.name,
      status: status,
      submitted_at: submittedAt,
      result_at: resultAt,
      conditions: conditions,
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
  // 5. 設置工事作成（100件）
  // ============================================
  console.log("🔧 設置工事データを作成中...");

  const installations: Array<{
    id: string;
    deal_id: string;
    status: "not_started" | "survey_scheduling" | "survey_completed" | "installation_scheduling" | "installation_completed";
    survey_date: string | null;
    installation_date: string | null;
    notes: string | null;
    created_at: string;
  }> = [];

  const installationNotes = [
    "エレベーター使用可能。搬入経路確認済み。",
    "2Fまで階段搬入。事前に養生が必要。",
    "駐車場あり。大型トラック進入可。",
    "ビル管理会社への事前連絡必要。",
    "電源工事が必要。別途見積もり済み。",
    "ネットワーク配線工事あり。",
    "既存機器の撤去作業含む。",
    "休日作業希望。事前調整済み。",
    "セキュリティカード発行が必要。",
    null,
  ];

  const installationStatuses: Array<"not_started" | "survey_scheduling" | "survey_completed" | "installation_scheduling" | "installation_completed"> =
    ["not_started", "survey_scheduling", "survey_completed", "installation_scheduling", "installation_completed"];

  // 使用済みのdeal_idを追跡（installations.deal_idはUNIQUE制約あり）
  const usedDealIds = new Set<string>();

  // 100件の設置工事を生成
  for (let i = 0; i < 100 && i < deals.length; i++) {
    const deal = deals[i];
    if (usedDealIds.has(deal.id)) continue;
    usedDealIds.add(deal.id);

    const status = randomElement(installationStatuses);
    let surveyDate: string | null = null;
    let installationDate: string | null = null;

    if (["survey_completed", "installation_scheduling", "installation_completed"].includes(status)) {
      surveyDate = formatDate(new Date(new Date(deal.created_at).getTime() + randomInt(7, 14) * 24 * 60 * 60 * 1000));
    }

    if (status === "installation_completed") {
      installationDate = formatDate(new Date(new Date(deal.created_at).getTime() + randomInt(21, 35) * 24 * 60 * 60 * 1000));
    }

    installations.push({
      id: crypto.randomUUID(),
      deal_id: deal.id,
      status: status,
      survey_date: surveyDate,
      installation_date: installationDate,
      notes: randomElement(installationNotes),
      created_at: deal.created_at,
    });
  }

  const { error: installationsError } = await supabase.from("installations").insert(installations);
  if (installationsError) {
    console.error("設置工事作成エラー:", installationsError);
    return;
  }
  console.log(`  ✅ ${installations.length}件の設置工事を作成しました\n`);

  // ============================================
  // 6. 入金データ作成（120件）
  // ============================================
  console.log("💰 入金データを作成中...");

  const payments: Array<{
    id: string;
    deal_id: string;
    lease_company: string | null;
    expected_amount: number;
    actual_amount: number | null;
    expected_date: string;
    actual_date: string | null;
    status: "pending" | "paid";
    created_at: string;
  }> = [];

  // 120件の入金データを生成
  for (let i = 0; i < 120; i++) {
    const deal = deals[i % deals.length];
    const expectedDate = new Date(deal.created_at);
    expectedDate.setDate(expectedDate.getDate() + randomInt(30, 60));

    // 入金済み60%、未入金40%
    const isPaid = Math.random() < 0.6;
    const leaseCompany = deal.contract_type === "lease" ? randomElement(leaseCompanies).name : null;
    const expectedAmount = deal.estimated_amount || randomInt(500000, 3000000);

    payments.push({
      id: crypto.randomUUID(),
      deal_id: deal.id,
      lease_company: leaseCompany,
      expected_amount: expectedAmount,
      actual_amount: isPaid ? expectedAmount : null,
      expected_date: formatDate(expectedDate),
      actual_date: isPaid ? formatDate(new Date(expectedDate.getTime() + randomInt(-5, 10) * 24 * 60 * 60 * 1000)) : null,
      status: isPaid ? "paid" : "pending",
      created_at: deal.created_at,
    });
  }

  const { error: paymentsError } = await supabase.from("payments").insert(payments);
  if (paymentsError) {
    console.error("入金作成エラー:", paymentsError);
    return;
  }
  console.log(`  ✅ ${payments.length}件の入金データを作成しました\n`);

  // ============================================
  // 7. タスク作成（150件）
  // ============================================
  console.log("✅ タスクデータを作成中...");

  const tasks: Array<{
    id: string;
    deal_id: string | null;
    assigned_user_id: string;
    title: string;
    description: string | null;
    due_date: string;
    status: "not_started" | "in_progress" | "completed";
    priority: "high" | "medium" | "low";
    created_at: string;
  }> = [];

  const taskTemplates = [
    { title: "見積書作成", priority: "high" as const, description: "顧客要望に基づいて見積書を作成する" },
    { title: "契約書準備", priority: "high" as const, description: "契約書のドラフトを作成し、法務確認を依頼する" },
    { title: "現地調査日程調整", priority: "medium" as const, description: "顧客と現地調査の日程を調整する" },
    { title: "設置工事立会い", priority: "high" as const, description: "設置工事に立ち会い、完了確認を行う" },
    { title: "請求書発行", priority: "medium" as const, description: "納品完了後、請求書を発行する" },
    { title: "入金確認", priority: "medium" as const, description: "入金予定日に入金を確認する" },
    { title: "アフターフォロー電話", priority: "low" as const, description: "納品後1週間でフォローアップ電話を行う" },
    { title: "定期メンテナンス案内", priority: "low" as const, description: "年次メンテナンスの案内を送付する" },
    { title: "更新提案準備", priority: "medium" as const, description: "リース満了前の更新提案資料を準備する" },
    { title: "競合調査", priority: "low" as const, description: "競合他社の最新動向を調査する" },
    { title: "リース審査書類確認", priority: "high" as const, description: "顧客から受領した書類の確認と不足書類の依頼" },
    { title: "顧客訪問準備", priority: "medium" as const, description: "訪問時に使用する資料の準備" },
    { title: "提案書作成", priority: "high" as const, description: "顧客向けの提案書を作成する" },
    { title: "価格交渉準備", priority: "medium" as const, description: "競合見積もりを分析し、価格交渉の材料を準備する" },
    { title: "デモ機手配", priority: "medium" as const, description: "顧客デモ用の機器を手配する" },
  ];

  // 150件のタスクを生成
  for (let i = 0; i < 150; i++) {
    const template = randomElement(taskTemplates);
    const deal = Math.random() > 0.2 ? randomElement(deals) : null;
    const user = randomElement(salesUsers);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + randomInt(-14, 30));

    // ステータス分布: 未着手40%、進行中30%、完了30%
    let status: "not_started" | "in_progress" | "completed";
    const rand = Math.random();
    if (rand < 0.4) status = "not_started";
    else if (rand < 0.7) status = "in_progress";
    else status = "completed";

    // 優先度分布: 高25%、中50%、低25%
    let priority: "high" | "medium" | "low";
    const priorityRand = Math.random();
    if (priorityRand < 0.25) priority = "high";
    else if (priorityRand < 0.75) priority = "medium";
    else priority = "low";

    tasks.push({
      id: crypto.randomUUID(),
      deal_id: deal?.id || null,
      assigned_user_id: user.id,
      title: deal ? `${template.title} - ${deal.title.substring(0, 15)}` : template.title,
      description: template.description,
      due_date: formatDate(dueDate),
      status: status,
      priority: priority,
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
  // 8. 活動履歴作成（200件）
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
    { type: "phone" as const, content: "初回ヒアリング実施。現状の課題として、既存機器の老朽化とランニングコストの高さを挙げられた。来週の訪問を約束。" },
    { type: "visit" as const, content: "現地訪問でヒアリング実施。設置場所を確認し、電源・ネットワーク環境をチェックした。見積もりを来週提出予定。" },
    { type: "email" as const, content: "見積書を送付。ご不明点があればお気軽にお問い合わせくださいとご案内。" },
    { type: "phone" as const, content: "見積書の確認状況をフォロー。社内検討中とのこと。来週回答予定。" },
    { type: "online_meeting" as const, content: "Web会議で詳細説明実施。決裁者にも同席いただき、前向きに検討いただける見込み。" },
    { type: "visit" as const, content: "契約書の説明と押印手続き。リース審査書類も合わせて受領。" },
    { type: "phone" as const, content: "リース審査の状況報告。順調に進んでおり、来週結果が出る見込み。" },
    { type: "email" as const, content: "リース審査通過のご報告。設置工事の日程調整のため、ご都合をお伺い。" },
    { type: "visit" as const, content: "現地調査実施。搬入経路と設置場所を確認。電源増設工事が必要なことが判明。" },
    { type: "phone" as const, content: "設置工事日程の最終確認。当日の立ち会い者と連絡先を確認。" },
    { type: "visit" as const, content: "設置工事完了。動作確認を実施し、操作説明を行った。特に問題なく稼働開始。" },
    { type: "phone" as const, content: "納品後フォロー電話。順調に稼働中とのこと。追加の消耗品注文の打診あり。" },
    { type: "email" as const, content: "請求書送付のご案内。月末支払いでお願いしたい旨をお伝え。" },
    { type: "phone" as const, content: "入金確認の連絡。問題なく処理されていることを確認。" },
    { type: "other" as const, content: "社内報告書作成。案件完了報告を上長に提出。" },
    { type: "phone" as const, content: "決算期アプローチ。来期の予算取りについてヒアリング。" },
    { type: "visit" as const, content: "定期訪問。機器の稼働状況確認と新製品のご案内。" },
    { type: "email" as const, content: "カタログ資料を送付。ご検討のほどよろしくお願いいたします。" },
    { type: "online_meeting" as const, content: "リモートデモ実施。新機能の操作説明を行った。" },
    { type: "phone" as const, content: "クレーム対応。印刷品質の問題について調査を約束。" },
  ];

  // 200件の活動履歴を生成
  for (let i = 0; i < 200; i++) {
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
  console.log(`  - リース審査: ${leaseApplications.length}件`);
  console.log(`  - 設置工事: ${installations.length}件`);
  console.log(`  - 入金: ${payments.length}件`);
  console.log(`  - タスク: ${tasks.length}件`);
  console.log(`  - 活動履歴: ${activities.length}件`);

  console.log("\n📈 データパターン:");
  console.log("  - 顧客: 法人約80%、個人事業主約15%、新設法人約5%");
  console.log("  - 案件: 全16ステータスをランダムに分布");
  console.log("  - 契約: リース/レンタル/分割払いの3種類");
  console.log("  - リース審査: 準備中10%/審査中20%/承認50%/却下10%/条件付き10%");
  console.log("  - 入金: 入金済み60%/未入金40%");
  console.log("  - タスク: 未着手40%/進行中30%/完了30%");
}

seed().catch(console.error);
