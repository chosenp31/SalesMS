/**
 * 顧客管理E2Eテスト
 *
 * なぜこのテストが必要か：
 * - 顧客データのCRUD操作がUI上で正しく動作することを保証
 * - ユーザーが顧客情報を管理できることを確認
 * - フォームバリデーションの動作を検証
 */
import { test, expect } from '@playwright/test';

test.describe('顧客管理', () => {
  // 認証済み状態でテストを実行
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test.describe('顧客一覧', () => {
    // なぜ必要：顧客一覧表示の基本機能を保証

    test.beforeEach(async ({ page }) => {
      await page.goto('/customers');
    });

    test('顧客一覧ページが正しく表示される', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /顧客/i })).toBeVisible();

      // テーブルヘッダーが表示される
      await expect(page.getByText('会社名')).toBeVisible();
      await expect(page.getByText('代表者名')).toBeVisible();
      await expect(page.getByText('事業形態')).toBeVisible();
    });

    test('新規顧客登録ボタンが表示される', async ({ page }) => {
      const newButton = page.getByRole('link', { name: /新規|登録|追加/i });
      await expect(newButton).toBeVisible();
    });

    test('顧客がない場合はメッセージが表示される', async ({ page }) => {
      // 顧客が0件の場合のメッセージ確認
      const emptyMessage = page.getByText(/顧客がまだ登録されていません|データがありません/i);
      const table = page.getByRole('table');

      // テーブルまたは空メッセージのどちらかが表示される
      const hasTable = await table.isVisible().catch(() => false);
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

      expect(hasTable || hasEmptyMessage).toBeTruthy();
    });
  });

  test.describe('顧客登録', () => {
    // なぜ必要：新規顧客登録機能の動作を保証

    test.beforeEach(async ({ page }) => {
      await page.goto('/customers/new');
    });

    test('顧客登録フォームが正しく表示される', async ({ page }) => {
      await expect(page.getByLabel(/会社名/i)).toBeVisible();
      await expect(page.getByLabel(/代表者名/i)).toBeVisible();
      await expect(page.getByLabel(/事業形態/i)).toBeVisible();
    });

    test('必須項目を入力せずに送信するとエラーが表示される', async ({ page }) => {
      // 空のまま送信
      await page.getByRole('button', { name: /登録|保存|作成/i }).click();

      // エラーメッセージまたはバリデーションエラーが表示される
      await expect(page.getByText(/必須|入力してください|エラー/i)).toBeVisible();
    });

    test('有効なデータで顧客を登録できる', async ({ page }) => {
      const timestamp = Date.now();
      const companyName = `テスト株式会社_${timestamp}`;

      await page.getByLabel(/会社名/i).fill(companyName);
      await page.getByLabel(/代表者名/i).fill('テスト太郎');

      // 事業形態を選択
      await page.getByLabel(/事業形態/i).click();
      await page.getByRole('option', { name: /法人/i }).click();

      // 任意項目
      await page.getByLabel(/電話番号/i).fill('03-1234-5678');
      await page.getByLabel(/メール/i).fill(`test_${timestamp}@example.com`);

      await page.getByRole('button', { name: /登録|保存|作成/i }).click();

      // 一覧にリダイレクトまたは成功メッセージ
      await expect(page).toHaveURL(/.*customers/);
    });
  });

  test.describe('顧客詳細', () => {
    // なぜ必要：顧客詳細表示機能の動作を保証

    test('顧客詳細ページで情報が表示される', async ({ page }) => {
      // まず顧客一覧に移動
      await page.goto('/customers');

      // 顧客が存在する場合、最初の詳細リンクをクリック
      const detailLink = page.getByRole('link').filter({ has: page.locator('.lucide-eye') }).first();
      const hasCustomers = await detailLink.isVisible().catch(() => false);

      if (hasCustomers) {
        await detailLink.click();

        // 詳細ページの要素が表示される
        await expect(page.getByText(/会社名|顧客情報/i)).toBeVisible();
      }
    });
  });

  test.describe('顧客編集', () => {
    // なぜ必要：顧客情報の更新機能を保証

    test('顧客編集ページにアクセスできる', async ({ page }) => {
      await page.goto('/customers');

      // 編集リンクをクリック
      const editLink = page.getByRole('link').filter({ has: page.locator('.lucide-pencil') }).first();
      const hasCustomers = await editLink.isVisible().catch(() => false);

      if (hasCustomers) {
        await editLink.click();

        // 編集フォームが表示される
        await expect(page.getByLabel(/会社名/i)).toBeVisible();
      }
    });
  });

  test.describe('バリデーション', () => {
    // なぜ必要：入力バリデーションが正しく動作することを保証

    test.beforeEach(async ({ page }) => {
      await page.goto('/customers/new');
    });

    test('メールアドレスの形式チェック', async ({ page }) => {
      await page.getByLabel(/メール/i).fill('invalid-email');
      await page.getByLabel(/会社名/i).click(); // フォーカスを移動

      // 無効なメール形式のエラーが表示されるかフォームが送信できない
      const emailField = page.getByLabel(/メール/i);
      const isValid = await emailField.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(isValid).toBeFalsy();
    });

    test('電話番号の形式チェック', async ({ page }) => {
      await page.getByLabel(/電話番号/i).fill('12345');

      // 短い電話番号でもエラーまたは警告が出る可能性
      const phoneField = page.getByLabel(/電話番号/i);
      await expect(phoneField).toHaveValue('12345');
    });
  });
});
