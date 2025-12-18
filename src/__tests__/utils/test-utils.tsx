/**
 * テストユーティリティ
 * 共通のレンダリングヘルパーとモックデータ生成関数
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { User, Customer, Deal, Task, Payment, Activity, LeaseApplication } from '@/types';

/**
 * カスタムレンダラー
 * プロバイダーをラップした状態でコンポーネントをレンダリング
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// ============================================
// モックデータファクトリー関数
// ============================================

/**
 * テスト用ユーザーデータ生成
 * @param overrides - 上書きするプロパティ
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-001',
  email: 'test@example.com',
  name: '田中 太郎',
  role: 'sales',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

/**
 * テスト用顧客データ生成
 * @param overrides - 上書きするプロパティ
 */
export const createMockCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: 'customer-001',
  company_name: '株式会社テスト',
  representative_name: '山田 花子',
  phone: '03-1234-5678',
  email: 'yamada@test-company.co.jp',
  address: '東京都渋谷区テスト町1-2-3',
  business_type: 'corporation',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

/**
 * テスト用案件データ生成
 * @param overrides - 上書きするプロパティ
 */
export const createMockDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: 'deal-001',
  customer_id: 'customer-001',
  assigned_user_id: 'user-001',
  title: 'テスト案件',
  status: 'in_negotiation',
  contract_type: 'lease',
  product_category: '複合機',
  estimated_amount: 1000000,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  customer: createMockCustomer(),
  assigned_user: createMockUser(),
  ...overrides,
});

/**
 * テスト用タスクデータ生成
 * @param overrides - 上書きするプロパティ
 */
export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-001',
  deal_id: 'deal-001',
  assigned_user_id: 'user-001',
  title: 'テストタスク',
  description: 'テストタスクの説明文',
  due_date: '2024-12-31',
  status: 'not_started',
  priority: 'medium',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deal: { id: 'deal-001', title: 'テスト案件' },
  assigned_user: createMockUser(),
  ...overrides,
});

/**
 * テスト用入金データ生成
 * @param overrides - 上書きするプロパティ
 */
export const createMockPayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 'payment-001',
  deal_id: 'deal-001',
  lease_company: 'C-mind',
  expected_amount: 1000000,
  actual_amount: null,
  expected_date: '2024-12-31',
  actual_date: null,
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  deal: { id: 'deal-001', title: 'テスト案件' },
  ...overrides,
});

/**
 * テスト用活動履歴データ生成
 * @param overrides - 上書きするプロパティ
 */
export const createMockActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'activity-001',
  deal_id: 'deal-001',
  user_id: 'user-001',
  activity_type: 'phone',
  content: 'テスト活動の内容',
  created_at: '2024-01-01T00:00:00Z',
  user: createMockUser(),
  ...overrides,
});

/**
 * テスト用リース審査データ生成
 * @param overrides - 上書きするプロパティ
 */
export const createMockLeaseApplication = (
  overrides: Partial<LeaseApplication> = {}
): LeaseApplication => ({
  id: 'lease-app-001',
  deal_id: 'deal-001',
  lease_company: 'C-mind',
  status: 'preparing',
  submitted_at: null,
  result_at: null,
  conditions: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// ============================================
// テストヘルパー関数
// ============================================

/**
 * 指定ミリ秒待機する
 * @param ms - 待機時間（ミリ秒）
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 日付文字列を生成（YYYY-MM-DD形式）
 * @param daysFromNow - 今日からの日数（負の値で過去）
 */
export const generateDateString = (daysFromNow: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

/**
 * ランダムなIDを生成
 * @param prefix - IDのプレフィックス
 */
export const generateId = (prefix: string = 'id'): string =>
  `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
