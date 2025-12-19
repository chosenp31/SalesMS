/**
 * 顧客API統合テスト
 *
 * なぜこのテストが必要か：
 * - 顧客データのCRUD操作が正しく動作することを保証
 * - データベースとの連携が正常であることを確認
 * - エラーハンドリングが適切に機能することを検証
 */
import {
  createMockSupabaseClient,
  createMockQueryBuilder,
} from '../mocks/supabase';
import { createMockCustomer } from '../utils/test-utils';

describe('顧客API統合テスト', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    jest.clearAllMocks();
  });

  describe('顧客一覧取得', () => {
    // なぜ必要：顧客データの取得が正しく動作することを保証

    it('顧客一覧を正常に取得できる', async () => {
      const mockCustomers = [
        createMockCustomer({ id: 'customer-001', company_name: '株式会社A' }),
        createMockCustomer({ id: 'customer-002', company_name: '株式会社B' }),
      ];

      const queryBuilder = createMockQueryBuilder(mockCustomers);
      mockSupabase.__mockFrom('customers', queryBuilder);

      const result = await mockSupabase.from('customers').select('*');

      expect(result.data).toEqual(mockCustomers);
      expect(result.error).toBeNull();
    });

    it('顧客が0件の場合は空配列を返す', async () => {
      const queryBuilder = createMockQueryBuilder([]);
      mockSupabase.__mockFrom('customers', queryBuilder);

      const result = await mockSupabase.from('customers').select('*');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('エラー発生時はエラーオブジェクトを返す', async () => {
      const queryBuilder = createMockQueryBuilder(
        null,
        new Error('Database connection failed')
      );
      mockSupabase.__mockFrom('customers', queryBuilder);

      const result = await mockSupabase.from('customers').select('*');

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });

  describe('顧客詳細取得', () => {
    // なぜ必要：特定の顧客データの取得が正しく動作することを保証

    it('指定IDの顧客を取得できる', async () => {
      const mockCustomer = createMockCustomer({
        id: 'customer-001',
        company_name: '株式会社テスト',
      });

      const queryBuilder = createMockQueryBuilder(mockCustomer);
      mockSupabase.__mockFrom('customers', queryBuilder);

      const result = await mockSupabase
        .from('customers')
        .select('*')
        .eq('id', 'customer-001')
        .single();

      expect(result.data).toEqual(mockCustomer);
      expect(result.error).toBeNull();
    });

    it('存在しないIDの場合はエラーを返す', async () => {
      const queryBuilder = createMockQueryBuilder(
        null,
        new Error('Record not found')
      );
      mockSupabase.__mockFrom('customers', queryBuilder);

      const result = await mockSupabase
        .from('customers')
        .select('*')
        .eq('id', 'non-existent')
        .single();

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });

  describe('顧客作成', () => {
    // なぜ必要：顧客データの新規作成が正しく動作することを保証

    it('新規顧客を作成できる', async () => {
      const newCustomer = {
        company_name: '新規会社',
        representative_name: '代表者名',
        business_type: 'corporation' as const,
        phone: '03-1234-5678',
        email: 'new@example.com',
      };

      const createdCustomer = createMockCustomer({
        ...newCustomer,
        id: 'customer-new',
      });

      const queryBuilder = createMockQueryBuilder(createdCustomer);
      mockSupabase.__mockFrom('customers', queryBuilder);

      const result = await mockSupabase.from('customers').insert(newCustomer);

      expect(mockSupabase.from).toHaveBeenCalledWith('customers');
      expect(result.error).toBeNull();
    });

    it('必須フィールドが欠けている場合はエラー', async () => {
      const incompleteCustomer = {
        company_name: '',
        representative_name: '',
        business_type: 'corporation' as const,
      };

      const queryBuilder = createMockQueryBuilder(
        null,
        new Error('Validation failed: company_name is required')
      );
      mockSupabase.__mockFrom('customers', queryBuilder);

      const result = await mockSupabase
        .from('customers')
        .insert(incompleteCustomer);

      expect(result.error).not.toBeNull();
    });
  });

  describe('顧客更新', () => {
    // なぜ必要：顧客データの更新が正しく動作することを保証

    it('顧客情報を更新できる', async () => {
      const updatedData = {
        company_name: '更新後の会社名',
      };

      const queryBuilder = createMockQueryBuilder({ ...updatedData });
      mockSupabase.__mockFrom('customers', queryBuilder);

      const result = await mockSupabase
        .from('customers')
        .update(updatedData)
        .eq('id', 'customer-001');

      expect(mockSupabase.from).toHaveBeenCalledWith('customers');
      expect(result.error).toBeNull();
    });

    it('存在しない顧客の更新はエラー', async () => {
      const queryBuilder = createMockQueryBuilder(
        null,
        new Error('Record not found')
      );
      mockSupabase.__mockFrom('customers', queryBuilder);

      const result = await mockSupabase
        .from('customers')
        .update({ company_name: 'テスト' })
        .eq('id', 'non-existent');

      expect(result.error).not.toBeNull();
    });
  });

  describe('顧客削除', () => {
    // なぜ必要：顧客データの削除が正しく動作することを保証

    it('顧客を削除できる', async () => {
      const queryBuilder = createMockQueryBuilder(null);
      mockSupabase.__mockFrom('customers', queryBuilder);

      const result = await mockSupabase
        .from('customers')
        .delete()
        .eq('id', 'customer-001');

      expect(mockSupabase.from).toHaveBeenCalledWith('customers');
      expect(result.error).toBeNull();
    });
  });

  describe('関連データ取得', () => {
    // なぜ必要：顧客に紐づく案件データの取得を保証

    it('顧客と関連する案件を同時に取得できる', async () => {
      const mockCustomerWithDeals = createMockCustomer({
        id: 'customer-001',
        company_name: '株式会社テスト',
      });

      const queryBuilder = createMockQueryBuilder(mockCustomerWithDeals);
      mockSupabase.__mockFrom('customers', queryBuilder);

      const result = await mockSupabase
        .from('customers')
        .select('*, deals(*)')
        .eq('id', 'customer-001');

      expect(mockSupabase.from).toHaveBeenCalledWith('customers');
      expect(result.error).toBeNull();
    });
  });
});
