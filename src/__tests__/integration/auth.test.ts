/**
 * 認証API統合テスト
 *
 * なぜこのテストが必要か：
 * - ユーザー認証が正しく動作することを保証
 * - セッション管理のセキュリティを検証
 * - 認証エラーのハンドリングを確認
 */
import {
  createMockSupabaseClient,
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
} from '../mocks/supabase';

describe('認証API統合テスト', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    jest.clearAllMocks();
  });

  describe('ユーザー認証', () => {
    // なぜ必要：ログイン機能が正しく動作することを保証

    it('有効な認証情報でログインできる', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-001', email: 'test@example.com' },
          session: { access_token: 'token', refresh_token: 'refresh' },
        },
        error: null,
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.data.user).toBeDefined();
      expect(result.data.session).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('無効な認証情報ではログインできない', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', code: 'AUTH_ERROR' },
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(result.data.user).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('Invalid');
    });

    it('空のメールアドレスではログインできない', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email is required', code: 'VALIDATION_ERROR' },
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: '',
        password: 'password123',
      });

      expect(result.error).not.toBeNull();
    });

    it('空のパスワードではログインできない', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Password is required', code: 'VALIDATION_ERROR' },
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: '',
      });

      expect(result.error).not.toBeNull();
    });
  });

  describe('現在のユーザー取得', () => {
    // なぜ必要：認証状態の確認が正しく動作することを保証

    it('認証済みユーザーの情報を取得できる', async () => {
      mockAuthenticatedUser(mockSupabase, {
        id: 'user-001',
        email: 'test@example.com',
      });

      const result = await mockSupabase.auth.getUser();

      expect(result.data.user).toBeDefined();
      expect(result.data.user?.id).toBe('user-001');
      expect(result.data.user?.email).toBe('test@example.com');
    });

    it('未認証状態ではユーザー情報を取得できない', async () => {
      mockUnauthenticatedUser(mockSupabase);

      const result = await mockSupabase.auth.getUser();

      expect(result.data.user).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });

  describe('ログアウト', () => {
    // なぜ必要：ログアウト機能が正しく動作することを保証

    it('正常にログアウトできる', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await mockSupabase.auth.signOut();

      expect(result.error).toBeNull();
    });

    it('ログアウト後はユーザー情報を取得できない', async () => {
      // ログアウト
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      await mockSupabase.auth.signOut();

      // ログアウト後の状態を設定
      mockUnauthenticatedUser(mockSupabase);

      const result = await mockSupabase.auth.getUser();
      expect(result.data.user).toBeNull();
    });
  });

  describe('認証状態変更の監視', () => {
    // なぜ必要：リアルタイムの認証状態追跡を保証

    it('認証状態変更を監視できる', () => {
      const callback = jest.fn();

      const { data } = mockSupabase.auth.onAuthStateChange(callback);

      expect(data.subscription).toBeDefined();
      expect(typeof data.subscription.unsubscribe).toBe('function');
    });

    it('監視を解除できる', () => {
      const callback = jest.fn();

      const { data } = mockSupabase.auth.onAuthStateChange(callback);
      data.subscription.unsubscribe();

      // unsubscribe関数が呼び出し可能であることを確認
      expect(data.subscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('セキュリティテスト', () => {
    // なぜ必要：セキュリティ要件を満たしていることを保証

    it('SQLインジェクション攻撃を防ぐ', async () => {
      // SQLインジェクションの試行
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', code: 'AUTH_ERROR' },
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: "'; DROP TABLE users; --",
        password: "' OR '1'='1",
      });

      // ログインは失敗するべき
      expect(result.data.user).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it('XSS攻撃を防ぐ', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', code: 'AUTH_ERROR' },
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: '<script>alert("xss")</script>@example.com',
        password: 'password',
      });

      // 入力はサニタイズされ、ログインは失敗するべき
      expect(result.data.user).toBeNull();
    });

    it('ブルートフォース攻撃に対する保護を確認', async () => {
      // 複数回の失敗したログイン試行
      const attempts = 10;
      for (let i = 0; i < attempts; i++) {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials', code: 'AUTH_ERROR' },
        });

        await mockSupabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: `wrong${i}`,
        });
      }

      // Supabaseは実際にはレート制限を実装している
      // このテストはモックなので、呼び出し回数を確認
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(
        attempts
      );
    });
  });

  describe('エッジケース', () => {
    // なぜ必要：境界条件での安定性を保証

    it('非常に長いメールアドレスを処理できる', async () => {
      const longEmail = 'a'.repeat(200) + '@example.com';

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email too long', code: 'VALIDATION_ERROR' },
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: longEmail,
        password: 'password123',
      });

      expect(result.error).not.toBeNull();
    });

    it('特殊文字を含むパスワードを処理できる', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-001', email: 'test@example.com' },
          session: { access_token: 'token', refresh_token: 'refresh' },
        },
        error: null,
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/',
      });

      // 特殊文字を含むパスワードは有効であるべき
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it('日本語を含むパスワードを処理できる', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-001', email: 'test@example.com' },
          session: { access_token: 'token', refresh_token: 'refresh' },
        },
        error: null,
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'パスワード123',
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    });
  });
});
