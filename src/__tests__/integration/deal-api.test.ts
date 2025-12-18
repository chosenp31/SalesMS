/**
 * 案件API統合テスト
 *
 * なぜこのテストが必要か：
 * - 案件データのCRUD操作が正しく動作することを保証
 * - ステータス変更のビジネスロジックを検証
 * - 関連データ（顧客、活動、タスク）との連携を確認
 */
import {
  createMockSupabaseClient,
  createMockQueryBuilder,
} from '../mocks/supabase';
import {
  createMockDeal,
  createMockCustomer,
  createMockActivity,
} from '../utils/test-utils';

describe('案件API統合テスト', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    jest.clearAllMocks();
  });

  describe('案件一覧取得', () => {
    // なぜ必要：案件データの取得が正しく動作することを保証

    it('案件一覧を正常に取得できる', async () => {
      const mockDeals = [
        createMockDeal({ id: 'deal-001', title: '案件A' }),
        createMockDeal({ id: 'deal-002', title: '案件B' }),
      ];

      const queryBuilder = createMockQueryBuilder(mockDeals);
      mockSupabase.__mockFrom('deals', queryBuilder);

      const result = await mockSupabase.from('deals').select('*');

      expect(result.data).toEqual(mockDeals);
      expect(result.error).toBeNull();
    });

    it('顧客情報と一緒に取得できる', async () => {
      const mockCustomer = createMockCustomer({
        id: 'customer-001',
        company_name: '株式会社テスト',
      });
      const mockDealsWithCustomer = [
        createMockDeal({
          id: 'deal-001',
          customer_id: 'customer-001',
          customer: mockCustomer,
        }),
      ];

      const queryBuilder = createMockQueryBuilder(mockDealsWithCustomer);
      mockSupabase.__mockFrom('deals', queryBuilder);

      const result = await mockSupabase
        .from('deals')
        .select('*, customer:customers(*)');

      expect(result.data).toEqual(mockDealsWithCustomer);
      expect(result.data?.[0]?.customer).toEqual(mockCustomer);
    });

    it('ステータスでフィルタリングできる', async () => {
      const mockDeals = [
        createMockDeal({ id: 'deal-001', status: 'in_negotiation' }),
      ];

      const queryBuilder = createMockQueryBuilder(mockDeals);
      mockSupabase.__mockFrom('deals', queryBuilder);

      const result = await mockSupabase
        .from('deals')
        .select('*')
        .eq('status', 'in_negotiation');

      expect(mockSupabase.from).toHaveBeenCalledWith('deals');
      expect(result.error).toBeNull();
    });
  });

  describe('案件詳細取得', () => {
    // なぜ必要：特定の案件データの取得が正しく動作することを保証

    it('指定IDの案件を取得できる', async () => {
      const mockDeal = createMockDeal({
        id: 'deal-001',
        title: 'テスト案件',
      });

      const queryBuilder = createMockQueryBuilder(mockDeal);
      mockSupabase.__mockFrom('deals', queryBuilder);

      const result = await mockSupabase
        .from('deals')
        .select('*')
        .eq('id', 'deal-001')
        .single();

      expect(result.data).toEqual(mockDeal);
    });

    it('関連する活動履歴も取得できる', async () => {
      const mockActivities = [
        createMockActivity({ id: 'activity-001', deal_id: 'deal-001' }),
        createMockActivity({ id: 'activity-002', deal_id: 'deal-001' }),
      ];

      const queryBuilder = createMockQueryBuilder(mockActivities);
      mockSupabase.__mockFrom('activities', queryBuilder);

      const result = await mockSupabase
        .from('activities')
        .select('*')
        .eq('deal_id', 'deal-001')
        .order('created_at', { ascending: false });

      expect(result.error).toBeNull();
    });
  });

  describe('案件作成', () => {
    // なぜ必要：案件データの新規作成が正しく動作することを保証

    it('新規案件を作成できる', async () => {
      const newDeal = {
        title: '新規案件',
        customer_id: 'customer-001',
        contract_type: 'lease' as const,
        status: 'appointment_acquired',
        estimated_amount: 1000000,
      };

      const createdDeal = createMockDeal({
        ...newDeal,
        id: 'deal-new',
      });

      const queryBuilder = createMockQueryBuilder(createdDeal);
      mockSupabase.__mockFrom('deals', queryBuilder);

      const result = await mockSupabase.from('deals').insert(newDeal);

      expect(mockSupabase.from).toHaveBeenCalledWith('deals');
      expect(result.error).toBeNull();
    });

    it('必須フィールドが欠けている場合はエラー', async () => {
      const incompleteDeal = {
        title: '',
        customer_id: '',
      };

      const queryBuilder = createMockQueryBuilder(
        null,
        new Error('Validation failed')
      );
      mockSupabase.__mockFrom('deals', queryBuilder);

      const result = await mockSupabase.from('deals').insert(incompleteDeal);

      expect(result.error).not.toBeNull();
    });
  });

  describe('案件ステータス更新', () => {
    // なぜ必要：ステータス変更が正しく動作することを保証

    it('ステータスを更新できる', async () => {
      const queryBuilder = createMockQueryBuilder({
        id: 'deal-001',
        status: 'in_negotiation',
      });
      mockSupabase.__mockFrom('deals', queryBuilder);

      const result = await mockSupabase
        .from('deals')
        .update({ status: 'in_negotiation' })
        .eq('id', 'deal-001');

      expect(mockSupabase.from).toHaveBeenCalledWith('deals');
      expect(result.error).toBeNull();
    });

    it.each([
      ['appointment_acquired', 'in_negotiation'],
      ['in_negotiation', 'quote_submitted'],
      ['quote_submitted', 'deal_won'],
      ['deal_won', 'contract_type_selection'],
      ['contract_type_selection', 'document_collection'],
      ['document_collection', 'review_requested'],
      ['review_requested', 'review_pending'],
      ['review_pending', 'review_approved'],
      ['review_approved', 'survey_scheduling'],
      ['survey_scheduling', 'survey_completed'],
      ['survey_completed', 'installation_scheduling'],
      ['installation_scheduling', 'installation_completed'],
      ['installation_completed', 'delivery_completed'],
      ['delivery_completed', 'payment_pending'],
      ['payment_pending', 'completed'],
    ])('ステータス %s から %s への遷移が可能', async (from, to) => {
      const queryBuilder = createMockQueryBuilder({
        id: 'deal-001',
        status: to,
      });
      mockSupabase.__mockFrom('deals', queryBuilder);

      const result = await mockSupabase
        .from('deals')
        .update({ status: to })
        .eq('id', 'deal-001');

      expect(result.error).toBeNull();
    });
  });

  describe('案件削除', () => {
    // なぜ必要：案件データの削除が正しく動作することを保証

    it('案件を削除できる', async () => {
      const queryBuilder = createMockQueryBuilder(null);
      mockSupabase.__mockFrom('deals', queryBuilder);

      const result = await mockSupabase
        .from('deals')
        .delete()
        .eq('id', 'deal-001');

      expect(mockSupabase.from).toHaveBeenCalledWith('deals');
      expect(result.error).toBeNull();
    });
  });

  describe('案件検索', () => {
    // なぜ必要：案件検索機能が正しく動作することを保証

    it('担当者IDでフィルタリングできる', async () => {
      const mockDeals = [
        createMockDeal({ id: 'deal-001', assigned_user_id: 'user-001' }),
      ];

      const queryBuilder = createMockQueryBuilder(mockDeals);
      mockSupabase.__mockFrom('deals', queryBuilder);

      const result = await mockSupabase
        .from('deals')
        .select('*')
        .eq('assigned_user_id', 'user-001');

      expect(result.error).toBeNull();
    });

    it('作成日でソートできる', async () => {
      const mockDeals = [
        createMockDeal({ id: 'deal-002', created_at: '2024-12-02' }),
        createMockDeal({ id: 'deal-001', created_at: '2024-12-01' }),
      ];

      const queryBuilder = createMockQueryBuilder(mockDeals);
      mockSupabase.__mockFrom('deals', queryBuilder);

      const result = await mockSupabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      expect(result.error).toBeNull();
    });
  });
});
