/**
 * Supabaseモックヘルパー
 * テスト用のSupabaseクライアントモックを提供
 */

type MockQueryResult<T> = {
  data: T | null;
  error: Error | null;
};

type MockQueryBuilder = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  order: jest.Mock;
  single: jest.Mock;
  limit: jest.Mock;
  range: jest.Mock;
};

/**
 * Supabaseクエリビルダーのモックを生成
 * @param mockData - 返却するモックデータ
 * @param mockError - 返却するエラー（オプション）
 */
export const createMockQueryBuilder = <T>(
  mockData: T | null = null,
  mockError: Error | null = null
): MockQueryBuilder => {
  const result: MockQueryResult<T> = { data: mockData, error: mockError };

  const mockBuilder: MockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  };

  // チェーンの最後で結果を返す
  Object.keys(mockBuilder).forEach((key) => {
    if (key !== 'single') {
      (mockBuilder[key as keyof MockQueryBuilder] as jest.Mock).mockReturnValue({
        ...mockBuilder,
        then: (resolve: (value: MockQueryResult<T>) => void) => {
          resolve(result);
          return Promise.resolve(result);
        },
      });
    }
  });

  return mockBuilder;
};

/**
 * Supabaseクライアントのフルモックを生成
 */
export const createMockSupabaseClient = () => {
  const mockFrom = jest.fn();

  return {
    from: mockFrom,
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({
        error: null,
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    // 追加のモックを設定するためのヘルパー
    __mockFrom: (tableName: string, queryBuilder: MockQueryBuilder) => {
      mockFrom.mockImplementation((table: string) => {
        if (table === tableName) {
          return queryBuilder;
        }
        return createMockQueryBuilder(null);
      });
    },
  };
};

/**
 * 成功レスポンスを生成
 */
export const mockSuccessResponse = <T>(data: T) => ({
  data,
  error: null,
});

/**
 * エラーレスポンスを生成
 */
export const mockErrorResponse = (message: string, code: string = 'ERROR') => ({
  data: null,
  error: {
    message,
    code,
  },
});

/**
 * 認証済みユーザーのモックを設定
 */
export const mockAuthenticatedUser = (
  supabaseClient: ReturnType<typeof createMockSupabaseClient>,
  user = { id: 'user-001', email: 'test@example.com' }
) => {
  supabaseClient.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  });
};

/**
 * 未認証状態のモックを設定
 */
export const mockUnauthenticatedUser = (
  supabaseClient: ReturnType<typeof createMockSupabaseClient>
) => {
  supabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated', code: 'AUTH_ERROR' },
  });
};
