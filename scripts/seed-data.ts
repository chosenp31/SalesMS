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
    let value = valueParts.join("=").trim();
    // クォートを除去
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key.trim()] = value;
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase環境変数が設定されていません（SUPABASE_SERVICE_ROLE_KEYが必要です）");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// マスターデータ
// ============================================

// 日本人の名前
const lastNames = [
  "田中", "鈴木", "佐藤", "高橋", "伊藤", "渡辺", "山本", "中村", "小林", "加藤",
  "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水"
];

const firstNames = [
  "太郎", "一郎", "健太", "大輔", "翔太", "裕介", "和也", "直樹", "拓也", "誠",
  "美咲", "陽子", "裕子", "真由美", "恵子", "智子", "由美子", "久美子", "京子", "幸子"
];

// 会社名パターン（様々な業種）
const companyData = [
  // IT・通信系
  { name: "テックソリューションズ", suffix: "株式会社" },
  { name: "デジタルイノベーション", suffix: "株式会社" },
  { name: "クラウドシステムズ", suffix: "株式会社" },
  { name: "サイバーネット", suffix: "株式会社" },
  { name: "AIテクノロジー", suffix: "株式会社" },
  { name: "ネクストウェブ", suffix: "合同会社" },
  { name: "スマートシステムズ", suffix: "株式会社" },
  // 小売・サービス系
  { name: "グルメダイニング", suffix: "株式会社" },
  { name: "ビューティーサロン田中", suffix: "" },
  { name: "ファッションプラス", suffix: "株式会社" },
  { name: "リテールマート", suffix: "株式会社" },
  { name: "カフェ・ド・パリ", suffix: "" },
  { name: "レストラン山田", suffix: "" },
  { name: "美容室ミラクル", suffix: "" },
  { name: "居酒屋さくら", suffix: "" },
  // 製造・建設系
  { name: "精密機械工業", suffix: "株式会社" },
  { name: "建設コーポレーション", suffix: "株式会社" },
  { name: "東海マニュファクチャリング", suffix: "株式会社" },
  { name: "プラント工業", suffix: "株式会社" },
  { name: "メタルワークス", suffix: "有限会社" },
  { name: "木村建設", suffix: "株式会社" },
  { name: "中央製作所", suffix: "株式会社" },
  { name: "関東建材", suffix: "株式会社" },
  { name: "大和工務店", suffix: "有限会社" },
  // 医療・介護系
  { name: "メディカルサービス", suffix: "株式会社" },
  { name: "ケアサポート", suffix: "株式会社" },
  { name: "健康クリニック", suffix: "" },
  // 不動産・物流系
  { name: "不動産管理センター", suffix: "株式会社" },
  { name: "ロジスティクス", suffix: "株式会社" },
  { name: "トランスポート", suffix: "株式会社" },
  // 士業・コンサル系
  { name: "法律事務所佐藤", suffix: "" },
  { name: "会計事務所高橋", suffix: "" },
  { name: "コンサルティングファーム", suffix: "株式会社" },
  // 広告・メディア系
  { name: "広告代理店ネクスト", suffix: "株式会社" },
  { name: "イベント企画", suffix: "株式会社" },
  { name: "メディアプロダクション", suffix: "株式会社" },
  // 教育系
  { name: "エデュケーション", suffix: "株式会社" },
  { name: "学習塾サクセス", suffix: "" },
  // その他
  { name: "総合商事", suffix: "株式会社" },
  { name: "ビジネスサポート", suffix: "株式会社" },
];

// 住所詳細
const addressDetails = [
  { pref: "東京都", city: "千代田区", town: "丸の内" },
  { pref: "東京都", city: "港区", town: "六本木" },
  { pref: "東京都", city: "新宿区", town: "西新宿" },
  { pref: "東京都", city: "渋谷区", town: "道玄坂" },
  { pref: "東京都", city: "中央区", town: "銀座" },
  { pref: "東京都", city: "品川区", town: "大崎" },
  { pref: "東京都", city: "目黒区", town: "中目黒" },
  { pref: "東京都", city: "世田谷区", town: "三軒茶屋" },
  { pref: "大阪府", city: "大阪市北区", town: "梅田" },
  { pref: "大阪府", city: "大阪市中央区", town: "難波" },
  { pref: "愛知県", city: "名古屋市中区", town: "栄" },
  { pref: "神奈川県", city: "横浜市西区", town: "みなとみらい" },
  { pref: "福岡県", city: "福岡市博多区", town: "博多駅前" },
  { pref: "北海道", city: "札幌市中央区", town: "北1条西" },
  { pref: "宮城県", city: "仙台市青葉区", town: "国分町" },
  { pref: "広島県", city: "広島市中区", town: "紙屋町" },
];

// 契約種別（新スキーマ）- 物件40%, 回線35%, 保守25%
const contractTypes = [
  { type: "property" as const, weight: 40 },
  { type: "line" as const, weight: 35 },
  { type: "maintenance" as const, weight: 25 },
];

// 契約種別ごとの商品カテゴリ（アプリと同じ値）
const productCategoriesByType: Record<string, string[]> = {
  property: ["UTM", "ルーター", "複合機", "その他"],
  line: ["インターネット", "電話", "その他"],
  maintenance: ["インターネット", "電話", "その他"],
};

// リース会社
const leaseCompanies = ["C-mind", "オリコ", "ジャックス", "その他"];

// 契約フェーズ・ステータス（新スキーマ準拠）- 進行中70%, 完了・失注30%
// phase: '商談中', '審査・申込中', '下見・工事中', '契約中', '入金中', '請求中', '完了', '否決'
// status: 商談待ち, 商談日程調整中, 審査・申込対応中, 審査・申込待ち, 下見調整中, 下見実施待ち, 工事日程調整中, 工事実施待ち, 検収確認中, 契約書提出対応中, 契約書確認待ち, 入金待ち, 入金済, 初回請求確認待ち, 請求処理対応中, クローズ, 対応検討中, 失注
const contractPhaseStatuses = [
  { phase: "商談中" as const, statuses: ["商談待ち", "商談日程調整中"], weight: 20 },
  { phase: "審査・申込中" as const, statuses: ["審査・申込対応中", "審査・申込待ち"], weight: 15 },
  { phase: "下見・工事中" as const, statuses: ["下見調整中", "下見実施待ち", "工事日程調整中", "工事実施待ち"], weight: 20 },
  { phase: "契約中" as const, statuses: ["検収確認中", "契約書提出対応中", "契約書確認待ち"], weight: 10 },
  { phase: "入金中" as const, statuses: ["入金待ち", "入金済"], weight: 10 },
  { phase: "請求中" as const, statuses: ["初回請求確認待ち", "請求処理対応中"], weight: 5 },
  { phase: "完了" as const, statuses: ["クローズ"], weight: 10 },
  { phase: "否決" as const, statuses: ["対応検討中", "失注"], weight: 10 },
];

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

// 重み付きランダム選択
function weightedRandomChoice<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

type ContractPhase = "商談中" | "審査・申込中" | "下見・工事中" | "契約中" | "入金中" | "請求中" | "完了" | "否決";

function getRandomPhaseAndStatus(): { phase: ContractPhase; status: string } {
  const phaseData = weightedRandomChoice(contractPhaseStatuses);
  const status = randomElement(phaseData.statuses);
  return { phase: phaseData.phase as ContractPhase, status };
}

type ContractType = "property" | "line" | "maintenance";

function getRandomContractType(): ContractType {
  const typeData = weightedRandomChoice([...contractTypes]);
  return typeData.type;
}

// ============================================
// シード実行
// ============================================

async function seed() {
  console.log("🌱 シードデータの投入を開始します...\n");
  console.log("⚠️  既存データを削除中...");

  // 既存データを削除（外部キー制約の順序で）
  await supabase.from("activities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("lease_applications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("contracts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("deals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  // デモユーザーは残す
  await supabase.from("users").delete().neq("email", "demoslaesms@example.com");

  console.log("  ✅ 既存データを削除しました\n");

  // ============================================
  // 1. ユーザー（営業担当者）作成 - 10人
  // ============================================
  console.log("👤 ユーザーを作成中...");
  const users = [
    { id: crypto.randomUUID(), email: "admin@example.com", name: "管理者 太郎", role: "admin" },
    { id: crypto.randomUUID(), email: "manager1@example.com", name: "佐藤 健一", role: "manager" },
    { id: crypto.randomUUID(), email: "sales1@example.com", name: "田中 大輔", role: "sales" },
    { id: crypto.randomUUID(), email: "sales2@example.com", name: "鈴木 翔太", role: "sales" },
    { id: crypto.randomUUID(), email: "sales3@example.com", name: "伊藤 裕子", role: "sales" },
    { id: crypto.randomUUID(), email: "sales4@example.com", name: "渡辺 健太", role: "sales" },
    { id: crypto.randomUUID(), email: "sales5@example.com", name: "山本 直樹", role: "sales" },
    { id: crypto.randomUUID(), email: "sales6@example.com", name: "中村 和也", role: "sales" },
    { id: crypto.randomUUID(), email: "sales7@example.com", name: "小林 誠", role: "sales" },
    { id: crypto.randomUUID(), email: "sales8@example.com", name: "加藤 真一", role: "sales" },
  ];

  const { error: usersError } = await supabase.from("users").insert(users);
  if (usersError) {
    console.error("ユーザー作成エラー:", usersError);
    return;
  }
  console.log(`  ✅ ${users.length}人のユーザーを作成しました\n`);

  // ============================================
  // 2. 顧客作成 - 40件
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
    updated_at: string;
  }> = [];

  // companyDataをシャッフルして使用
  const shuffledCompanies = [...companyData].sort(() => Math.random() - 0.5).slice(0, 40);

  for (let i = 0; i < 40; i++) {
    const company = shuffledCompanies[i];
    const companyName = company.suffix ? `${company.suffix}${company.name}` : company.name;
    const addr = randomElement(addressDetails);

    // 業種タイプの分布: 法人75%, 個人事業主15%, 新設法人10%
    let businessType: "corporation" | "sole_proprietor" | "new_corporation";
    const rand = Math.random();
    if (rand < 0.75) businessType = "corporation";
    else if (rand < 0.90) businessType = "sole_proprietor";
    else businessType = "new_corporation";

    const createdDate = randomDate(new Date("2024-06-01"), new Date("2024-12-15"));
    const updatedDate = randomDate(createdDate, new Date());

    customers.push({
      id: crypto.randomUUID(),
      company_name: companyName,
      representative_name: `${randomElement(lastNames)} ${randomElement(firstNames)}`,
      phone: generatePhone(),
      email: `info@${company.name.toLowerCase().replace(/[^a-z]/g, "").substring(0, 10)}.co.jp`,
      address: `${addr.pref}${addr.city}${addr.town}${randomInt(1, 10)}-${randomInt(1, 20)}-${randomInt(1, 15)}`,
      business_type: businessType,
      created_at: createdDate.toISOString(),
      updated_at: updatedDate.toISOString(),
    });
  }

  const { error: customersError } = await supabase.from("customers").insert(customers);
  if (customersError) {
    console.error("顧客作成エラー:", customersError);
    return;
  }
  console.log(`  ✅ ${customers.length}件の顧客を作成しました\n`);

  // ============================================
  // 3. 案件作成 - 40件
  // ============================================
  console.log("📋 案件データを作成中...");

  interface Deal {
    id: string;
    customer_id: string;
    assigned_user_id: string;
    title: string;
    status: string;
    contract_type: ContractType;
    product_category: string | null;
    estimated_amount: number | null;
    created_at: string;
    updated_at: string;
  }

  const deals: Deal[] = [];
  const salesUsers = users.filter(u => u.role === "sales");

  for (let i = 0; i < 40; i++) {
    const customer = customers[i];
    const user = randomElement(salesUsers);

    const daysAgo = randomInt(1, 180);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);
    const updatedDate = randomDate(createdDate, new Date());

    // 案件ステータス（deals.statusの許容値）
    const dealStatuses = [
      "appointment_acquired", "negotiating", "contract_pending",
      "won", "lost"
    ];
    const status = randomElement(dealStatuses);

    // 契約タイプ（新スキーマ）
    const dealContractType = getRandomContractType();

    // 製品カテゴリ（契約タイプに合わせる）
    const productCategories = productCategoriesByType[dealContractType];
    const productCategory = randomElement(productCategories);

    deals.push({
      id: crypto.randomUUID(),
      customer_id: customer.id,
      assigned_user_id: user.id,
      title: `${customer.company_name} - ${productCategory}導入`,
      status,
      contract_type: dealContractType,
      product_category: productCategory,
      estimated_amount: randomElement([null, randomInt(100000, 10000000)]),
      created_at: createdDate.toISOString(),
      updated_at: updatedDate.toISOString(),
    });
  }

  const { error: dealsError } = await supabase.from("deals").insert(deals);
  if (dealsError) {
    console.error("案件作成エラー:", dealsError);
    return;
  }
  console.log(`  ✅ ${deals.length}件の案件を作成しました\n`);

  // ============================================
  // 4. 契約作成 - 70件
  // ============================================
  console.log("📝 契約データを作成中...");

  interface Contract {
    id: string;
    deal_id: string;
    title: string;
    contract_type: ContractType;
    product_category: string | null;
    lease_company: string | null;
    phase: ContractPhase;
    status: string;
    monthly_amount: number | null;
    total_amount: number | null;
    contract_months: number | null;
    start_date: string | null;
    end_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }

  const contracts: Contract[] = [];
  const contractMonthsOptions = [12, 24, 36, 48, 60, 72, 84];

  // 70件の契約を作成（各案件に1〜3件）
  for (let i = 0; i < 70; i++) {
    const deal = deals[i % deals.length];
    const contractType = getRandomContractType();
    const products = productCategoriesByType[contractType];
    const productCategory = randomElement(products);

    const { phase, status } = getRandomPhaseAndStatus();
    const months = randomElement(contractMonthsOptions);
    const monthlyAmount = randomInt(5000, 150000);
    const totalAmount = monthlyAmount * months;

    // 入金中以降・完了のフェーズの場合は開始日を設定
    const activePhases: ContractPhase[] = ["入金中", "請求中", "完了"];
    const startDate = activePhases.includes(phase)
      ? new Date(new Date(deal.created_at).getTime() + randomInt(30, 90) * 24 * 60 * 60 * 1000)
      : null;

    const endDate = startDate
      ? new Date(startDate.getTime() + months * 30 * 24 * 60 * 60 * 1000)
      : null;

    // 物件契約でフェーズが進んでいる場合はリース会社を設定
    const needsLeaseCompany = contractType === "property" && !["商談中", "否決"].includes(phase);

    const createdDate = new Date(deal.created_at);
    const updatedDate = randomDate(createdDate, new Date());

    // 契約タイトル
    let title = productCategory;
    if (contractType === "property") title = `${productCategory}`;
    else if (contractType === "line") title = `${productCategory}`;
    else if (contractType === "maintenance") title = `${productCategory}保守`;

    contracts.push({
      id: crypto.randomUUID(),
      deal_id: deal.id,
      title,
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
      notes: randomElement([null, null, null, "特記事項あり", "カスタマイズあり"]),
      created_at: createdDate.toISOString(),
      updated_at: updatedDate.toISOString(),
    });
  }

  const { error: contractsError } = await supabase.from("contracts").insert(contracts);
  if (contractsError) {
    console.error("契約作成エラー:", contractsError);
    return;
  }
  console.log(`  ✅ ${contracts.length}件の契約を作成しました\n`);

  // ============================================
  // 5. タスク作成 - 140件
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
    due_date: string | null;
    status: TaskStatus;
    priority: "high" | "medium" | "low";
    company: string | null;
    created_at: string;
    updated_at: string;
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
    { title: "顧客への電話連絡", priority: "medium" as const, description: "進捗状況の報告", company: "自社" },
    { title: "NTT申込", priority: "high" as const, description: "NTTへの回線申込手続き", company: "自社" },
    { title: "保守契約確認", priority: "medium" as const, description: "保守契約内容の確認", company: "自社" },
    { title: "検収書取得", priority: "high" as const, description: "顧客から検収書を取得", company: "自社" },
    { title: "口座情報確認", priority: "medium" as const, description: "引き落とし口座情報の確認", company: "リース会社" },
  ];

  for (let i = 0; i < 140; i++) {
    const template = randomElement(taskTemplates);
    const contract = Math.random() > 0.2 ? randomElement(contracts) : null;
    const deal = contract ? deals.find(d => d.id === contract.deal_id)! : randomElement(deals);
    const user = randomElement(salesUsers);

    // 期限設定：20%過去、50%未来、30%なし
    let dueDate: string | null = null;
    const dueDateRandom = Math.random();
    if (dueDateRandom < 0.20) {
      // 過去の期限（期限切れ）
      const d = new Date();
      d.setDate(d.getDate() - randomInt(1, 30));
      dueDate = formatDate(d);
    } else if (dueDateRandom < 0.70) {
      // 未来の期限
      const d = new Date();
      d.setDate(d.getDate() + randomInt(1, 60));
      dueDate = formatDate(d);
    }

    // ステータス分布: 未着手35%, 進行中35%, 完了30%
    let status: TaskStatus;
    const rand = Math.random();
    if (rand < 0.35) status = "未着手";
    else if (rand < 0.70) status = "進行中";
    else status = "完了";

    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - randomInt(1, 60));

    tasks.push({
      id: crypto.randomUUID(),
      deal_id: deal.id,
      contract_id: contract?.id || null,
      assigned_user_id: user.id,
      title: template.title,
      description: template.description,
      due_date: dueDate,
      status,
      priority: template.priority,
      company: template.company,
      created_at: createdDate.toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const { error: tasksError } = await supabase.from("tasks").insert(tasks);
  if (tasksError) {
    console.error("タスク作成エラー:", tasksError);
    return;
  }
  console.log(`  ✅ ${tasks.length}件のタスクを作成しました\n`);

  // ============================================
  // 6. 活動履歴作成 - 各案件に2〜5件
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
    { type: "email" as const, content: "NTT申込書類を送付。記入・返送をお願いした。" },
    { type: "phone" as const, content: "NTT工事日程の連絡。来週月曜日で確定。" },
    { type: "other" as const, content: "社内ミーティングで案件進捗を共有。上長承認を取得。" },
  ];

  for (const deal of deals) {
    const numActivities = randomInt(2, 5);

    for (let i = 0; i < numActivities; i++) {
      const template = randomElement(activityTemplates);
      const user = randomElement(salesUsers);
      const activityDate = new Date(deal.created_at);
      activityDate.setDate(activityDate.getDate() + randomInt(0, 90));

      activities.push({
        id: crypto.randomUUID(),
        deal_id: deal.id,
        user_id: user.id,
        activity_type: template.type,
        content: template.content,
        created_at: activityDate.toISOString(),
      });
    }
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
  console.log(`  - ユーザー: ${users.length}人`);
  console.log(`  - 顧客: ${customers.length}件`);
  console.log(`  - 案件: ${deals.length}件`);
  console.log(`  - 契約: ${contracts.length}件`);
  console.log(`  - タスク: ${tasks.length}件`);
  console.log(`  - 活動履歴: ${activities.length}件`);

  console.log("\n📈 データパターン:");
  console.log("  - 契約種別: 物件40%, 回線35%, 保守25%");
  console.log("  - 契約フェーズ: 進行中70%, 完了・否決30%");
  console.log("  - タスク: 未完了70%, 完了30%（期限切れ20%含む）");
  console.log("  - 活動履歴: 各案件に2〜5件");
}

seed().catch(console.error);
