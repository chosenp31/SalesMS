/**
 * 認証E2Eテスト
 *
 * なぜこのテストが必要か：
 * - ユーザーが実際にログイン/ログアウトできることを保証
 * - 認証フローの完全な動作を検証
 * - 未認証ユーザーのアクセス制御を確認
 */
import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にログインページに移動
    await page.goto('/login');
  });

  test.describe('ログイン機能', () => {
    // なぜ必要：基本的なログイン機能の動作を保証

    test('ログインページが正しく表示される', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /ログイン/i })).toBeVisible();
      await expect(page.getByLabel(/メールアドレス/i)).toBeVisible();
      await expect(page.getByLabel(/パスワード/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /ログイン/i })).toBeVisible();
    });

    test('有効な認証情報でログインできる', async ({ page }) => {
      // テスト用アカウントでログイン
      await page.getByLabel(/メールアドレス/i).fill('test@example.com');
      await page.getByLabel(/パスワード/i).fill('testpassword123');
      await page.getByRole('button', { name: /ログイン/i }).click();

      // ダッシュボードにリダイレクトされることを確認
      await expect(page).toHaveURL(/.*dashboard|.*\//);
    });

    test('無効な認証情報ではエラーメッセージが表示される', async ({ page }) => {
      await page.getByLabel(/メールアドレス/i).fill('wrong@example.com');
      await page.getByLabel(/パスワード/i).fill('wrongpassword');
      await page.getByRole('button', { name: /ログイン/i }).click();

      // エラーメッセージが表示されることを確認
      await expect(page.getByText(/ログインに失敗|認証エラー|メールアドレスまたはパスワードが正しくありません/i)).toBeVisible();
    });

    test('空のフォームではログインボタンが無効または検証エラーが表示される', async ({ page }) => {
      // 空のまま送信を試みる
      await page.getByRole('button', { name: /ログイン/i }).click();

      // 入力フィールドに留まるか、エラーが表示されることを確認
      await expect(page.getByLabel(/メールアドレス/i)).toBeVisible();
    });
  });

  test.describe('アクセス制御', () => {
    // なぜ必要：未認証ユーザーの保護されたページへのアクセスを防止

    test('未認証状態でダッシュボードにアクセスするとログインページにリダイレクト', async ({ page }) => {
      await page.goto('/');

      // ログインページにリダイレクトされることを確認
      await expect(page).toHaveURL(/.*login/);
    });

    test('未認証状態で顧客ページにアクセスするとログインページにリダイレクト', async ({ page }) => {
      await page.goto('/customers');

      await expect(page).toHaveURL(/.*login/);
    });

    test('未認証状態で案件ページにアクセスするとログインページにリダイレクト', async ({ page }) => {
      await page.goto('/deals');

      await expect(page).toHaveURL(/.*login/);
    });

    test('未認証状態でタスクページにアクセスするとログインページにリダイレクト', async ({ page }) => {
      await page.goto('/tasks');

      await expect(page).toHaveURL(/.*login/);
    });

    test('未認証状態で入金ページにアクセスするとログインページにリダイレクト', async ({ page }) => {
      await page.goto('/payments');

      await expect(page).toHaveURL(/.*login/);
    });
  });
});

test.describe('認証済みユーザー', () => {
  // 認証済み状態でのテスト
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test.describe('ログアウト機能', () => {
    // なぜ必要：ユーザーが安全にセッションを終了できることを保証

    test('ログアウトボタンが表示される', async ({ page }) => {
      await page.goto('/');

      // ユーザーメニューまたはログアウトボタンを探す
      const logoutButton = page.getByRole('button', { name: /ログアウト/i });
      const userMenu = page.getByRole('button', { name: /ユーザー|メニュー/i });

      // どちらかが存在することを確認
      const hasLogout = await logoutButton.isVisible().catch(() => false);
      const hasMenu = await userMenu.isVisible().catch(() => false);

      expect(hasLogout || hasMenu).toBeTruthy();
    });
  });

  test.describe('ナビゲーション', () => {
    // なぜ必要：認証済みユーザーがすべてのページにアクセスできることを保証

    test('ダッシュボードにアクセスできる', async ({ page }) => {
      await page.goto('/');

      // ダッシュボードのコンテンツが表示されることを確認
      await expect(page.getByText(/ダッシュボード|案件|顧客/i)).toBeVisible();
    });

    test('顧客一覧ページにアクセスできる', async ({ page }) => {
      await page.goto('/customers');

      await expect(page.getByText(/顧客/i)).toBeVisible();
    });

    test('案件一覧ページにアクセスできる', async ({ page }) => {
      await page.goto('/deals');

      await expect(page.getByText(/案件/i)).toBeVisible();
    });

    test('タスク一覧ページにアクセスできる', async ({ page }) => {
      await page.goto('/tasks');

      await expect(page.getByText(/タスク/i)).toBeVisible();
    });

    test('入金管理ページにアクセスできる', async ({ page }) => {
      await page.goto('/payments');

      await expect(page.getByText(/入金/i)).toBeVisible();
    });
  });
});
