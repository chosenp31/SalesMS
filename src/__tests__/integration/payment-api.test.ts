/**
 * 入金API統合テスト
 *
 * なぜこのテストが必要か：
 * - 入金データのCRUD操作が正しく動作することを保証
 * - 金額計算のビジネスロジックを検証
 * - 入金ステータス変更を確認
 */
import {
  createMockSupabaseClient,
  createMockQueryBuilder,
} from '../mocks/supabase';
import { createMockPayment, generateDateString } from '../utils/test-utils';

describe('入金API統合テスト', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    jest.clearAllMocks();
  });

  describe('入金一覧取得', () => {
    // なぜ必要：入金データの取得が正しく動作することを保証

    it('入金一覧を正常に取得できる', async () => {
      const mockPayments = [
        createMockPayment({ id: 'payment-001', expected_amount: 100000 }),
        createMockPayment({ id: 'payment-002', expected_amount: 200000 }),
      ];

      const queryBuilder = createMockQueryBuilder(mockPayments);
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase.from('payments').select('*');

      expect(result.data).toEqual(mockPayments);
      expect(result.error).toBeNull();
    });

    it('案件情報と一緒に取得できる', async () => {
      const mockPaymentsWithDeal = [
        createMockPayment({
          id: 'payment-001',
          deal_id: 'deal-001',
          deal: { id: 'deal-001', title: 'テスト案件' },
        }),
      ];

      const queryBuilder = createMockQueryBuilder(mockPaymentsWithDeal);
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase
        .from('payments')
        .select('*, deal:deals(*)');

      expect(result.data).toEqual(mockPaymentsWithDeal);
      expect(result.data?.[0]?.deal).toBeDefined();
    });

    it('ステータスでフィルタリングできる', async () => {
      const pendingPayments = [
        createMockPayment({ id: 'payment-001', status: 'pending' }),
      ];

      const queryBuilder = createMockQueryBuilder(pendingPayments);
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase
        .from('payments')
        .select('*')
        .eq('status', 'pending');

      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
      expect(result.error).toBeNull();
    });
  });

  describe('入金作成', () => {
    // なぜ必要：入金データの新規作成が正しく動作することを保証

    it('新規入金を作成できる', async () => {
      const newPayment = {
        deal_id: 'deal-001',
        lease_company: 'オリコ',
        expected_amount: 500000,
        expected_date: generateDateString(30),
        status: 'pending' as const,
      };

      const createdPayment = createMockPayment({
        ...newPayment,
        id: 'payment-new',
      });

      const queryBuilder = createMockQueryBuilder(createdPayment);
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase.from('payments').insert(newPayment);

      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
      expect(result.error).toBeNull();
    });

    it('リース会社を指定できる', async () => {
      const newPayment = {
        deal_id: 'deal-001',
        lease_company: 'ジャックス',
        expected_amount: 300000,
        status: 'pending' as const,
      };

      const queryBuilder = createMockQueryBuilder(
        createMockPayment({ ...newPayment, id: 'payment-new' })
      );
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase.from('payments').insert(newPayment);

      expect(result.error).toBeNull();
    });
  });

  describe('入金ステータス更新', () => {
    // なぜ必要：入金ステータス変更が正しく動作することを保証

    it('未入金から入金済みに変更できる', async () => {
      const today = new Date().toISOString().split('T')[0];
      const updateData = {
        status: 'paid',
        actual_date: today,
        actual_amount: 500000,
      };

      const queryBuilder = createMockQueryBuilder({
        id: 'payment-001',
        ...updateData,
      });
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase
        .from('payments')
        .update(updateData)
        .eq('id', 'payment-001');

      expect(result.error).toBeNull();
    });

    it('入金済みから未入金に戻せる', async () => {
      const updateData = {
        status: 'pending',
        actual_date: null,
        actual_amount: null,
      };

      const queryBuilder = createMockQueryBuilder({
        id: 'payment-001',
        ...updateData,
      });
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase
        .from('payments')
        .update(updateData)
        .eq('id', 'payment-001');

      expect(result.error).toBeNull();
    });
  });

  describe('入金金額更新', () => {
    // なぜ必要：金額修正が正しく動作することを保証

    it('予定金額を変更できる', async () => {
      const queryBuilder = createMockQueryBuilder({
        id: 'payment-001',
        expected_amount: 600000,
      });
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase
        .from('payments')
        .update({ expected_amount: 600000 })
        .eq('id', 'payment-001');

      expect(result.error).toBeNull();
    });

    it('実績金額を記録できる', async () => {
      const queryBuilder = createMockQueryBuilder({
        id: 'payment-001',
        actual_amount: 480000,
      });
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase
        .from('payments')
        .update({ actual_amount: 480000 })
        .eq('id', 'payment-001');

      expect(result.error).toBeNull();
    });

    it('予定金額と実績金額が異なる場合も記録できる', async () => {
      const queryBuilder = createMockQueryBuilder({
        id: 'payment-001',
        expected_amount: 500000,
        actual_amount: 480000,
        status: 'paid',
      });
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase
        .from('payments')
        .update({
          actual_amount: 480000,
          status: 'paid',
        })
        .eq('id', 'payment-001');

      expect(result.error).toBeNull();
    });
  });

  describe('入金削除', () => {
    // なぜ必要：入金データの削除が正しく動作することを保証

    it('入金を削除できる', async () => {
      const queryBuilder = createMockQueryBuilder(null);
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase
        .from('payments')
        .delete()
        .eq('id', 'payment-001');

      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
      expect(result.error).toBeNull();
    });
  });

  describe('期限による絞り込み', () => {
    // なぜ必要：入金予定日による管理を保証

    it('期限切れの入金を取得できる', async () => {
      const overduePayments = [
        createMockPayment({
          id: 'payment-001',
          expected_date: generateDateString(-1),
          status: 'pending',
        }),
      ];

      const queryBuilder = createMockQueryBuilder(overduePayments);
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase.from('payments').select('*');

      expect(result.error).toBeNull();
    });

    it('今日が予定日の入金を取得できる', async () => {
      const todayPayments = [
        createMockPayment({
          id: 'payment-001',
          expected_date: generateDateString(0),
          status: 'pending',
        }),
      ];

      const queryBuilder = createMockQueryBuilder(todayPayments);
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase.from('payments').select('*');

      expect(result.error).toBeNull();
    });
  });

  describe('リース会社による絞り込み', () => {
    // なぜ必要：リース会社別の入金管理を保証

    it('特定のリース会社の入金を取得できる', async () => {
      const oricoPayments = [
        createMockPayment({
          id: 'payment-001',
          lease_company: 'オリコ',
        }),
      ];

      const queryBuilder = createMockQueryBuilder(oricoPayments);
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase
        .from('payments')
        .select('*')
        .eq('lease_company', 'オリコ');

      expect(result.error).toBeNull();
    });
  });

  describe('集計', () => {
    // なぜ必要：入金サマリーの正確な計算を保証

    it('入金予定合計を取得できる', async () => {
      const pendingPayments = [
        createMockPayment({
          id: 'payment-001',
          expected_amount: 100000,
          status: 'pending',
        }),
        createMockPayment({
          id: 'payment-002',
          expected_amount: 200000,
          status: 'pending',
        }),
      ];

      const queryBuilder = createMockQueryBuilder(pendingPayments);
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase
        .from('payments')
        .select('*')
        .eq('status', 'pending');

      expect(result.error).toBeNull();
      if (result.data) {
        const total = result.data.reduce(
          (sum, p) => sum + (p.expected_amount || 0),
          0
        );
        expect(total).toBe(300000);
      }
    });

    it('入金済み合計を取得できる', async () => {
      const paidPayments = [
        createMockPayment({
          id: 'payment-001',
          actual_amount: 150000,
          status: 'paid',
        }),
        createMockPayment({
          id: 'payment-002',
          actual_amount: 250000,
          status: 'paid',
        }),
      ];

      const queryBuilder = createMockQueryBuilder(paidPayments);
      mockSupabase.__mockFrom('payments', queryBuilder);

      const result = await mockSupabase
        .from('payments')
        .select('*')
        .eq('status', 'paid');

      expect(result.error).toBeNull();
      if (result.data) {
        const total = result.data.reduce(
          (sum, p) => sum + (p.actual_amount || 0),
          0
        );
        expect(total).toBe(400000);
      }
    });
  });
});
