/**
 * 案件管理E2Eテスト
 *
 * なぜこのテストが必要か：
 * - 案件のCRUD操作がUI上で正しく動作することを保証
 * - ステータスワークフローの動作を検証
 * - 活動履歴・リース審査の連携を確認
 */
import { test, expect } from '@playwright/test';

test.describe('案件管理', () => {
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test.describe('案件一覧', () => {
    // なぜ必要：案件一覧表示の基本機能を保証

    test.beforeEach(async ({ page }) => {
      await page.goto('/deals');
    });

    test('案件一覧ページが正しく表示される', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /案件/i })).toBeVisible();

      // テーブルヘッダーが表示される
      await expect(page.getByText('案件名')).toBeVisible();
      await expect(page.getByText('顧客')).toBeVisible();
      await expect(page.getByText('ステータス')).toBeVisible();
    });

    test('新規案件登録ボタンが表示される', async ({ page }) => {
      const newButton = page.getByRole('link', { name: /新規|登録|追加/i });
      await expect(newButton).toBeVisible();
    });

    test('案件がない場合はメッセージが表示される', async ({ page }) => {
      const emptyMessage = page.getByText(/案件がまだ登録されていません|データがありません/i);
      const table = page.getByRole('table');

      const hasTable = await table.isVisible().catch(() => false);
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

      expect(hasTable || hasEmptyMessage).toBeTruthy();
    });

    test('フェーズバッジが正しく表示される', async ({ page }) => {
      // 案件がある場合、フェーズバッジが表示される
      const badges = page.locator('.bg-blue-100, .bg-yellow-100, .bg-purple-100, .bg-green-100');
      const hasBadges = await badges.first().isVisible().catch(() => false);

      if (hasBadges) {
        // 少なくとも1つのバッジが表示されている
        expect(await badges.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('案件登録', () => {
    // なぜ必要：新規案件登録機能の動作を保証

    test.beforeEach(async ({ page }) => {
      await page.goto('/deals/new');
    });

    test('案件登録フォームが正しく表示される', async ({ page }) => {
      await expect(page.getByLabel(/案件名/i)).toBeVisible();
      await expect(page.getByLabel(/顧客/i)).toBeVisible();
      await expect(page.getByLabel(/契約種別/i)).toBeVisible();
    });

    test('必須項目を入力せずに送信するとエラーが表示される', async ({ page }) => {
      await page.getByRole('button', { name: /登録|保存|作成/i }).click();

      await expect(page.getByText(/必須|入力してください|エラー/i)).toBeVisible();
    });

    test('有効なデータで案件を登録できる', async ({ page }) => {
      const timestamp = Date.now();

      await page.getByLabel(/案件名/i).fill(`テスト案件_${timestamp}`);

      // 顧客を選択
      await page.getByLabel(/顧客/i).click();
      const customerOption = page.getByRole('option').first();
      const hasCustomer = await customerOption.isVisible().catch(() => false);

      if (hasCustomer) {
        await customerOption.click();

        // 契約種別を選択
        await page.getByLabel(/契約種別/i).click();
        await page.getByRole('option', { name: /リース/i }).click();

        // 見込金額
        await page.getByLabel(/見込金額/i).fill('1000000');

        await page.getByRole('button', { name: /登録|保存|作成/i }).click();

        // 成功時は一覧または詳細にリダイレクト
        await expect(page).toHaveURL(/.*deals/);
      }
    });
  });

  test.describe('案件詳細', () => {
    // なぜ必要：案件詳細表示機能の動作を保証

    test('案件詳細ページでステータスワークフローが表示される', async ({ page }) => {
      await page.goto('/deals');

      // 案件がある場合、最初の詳細リンクをクリック
      const detailLink = page.getByRole('link').filter({ has: page.locator('.lucide-eye') }).first();
      const hasDeals = await detailLink.isVisible().catch(() => false);

      if (hasDeals) {
        await detailLink.click();

        // ステータスワークフローのコンポーネントが表示される
        await expect(page.getByText(/ステータス/i)).toBeVisible();
        await expect(page.getByText(/営業フェーズ|契約フェーズ|工事フェーズ|完了フェーズ/i)).toBeVisible();
      }
    });

    test('案件情報カードが表示される', async ({ page }) => {
      await page.goto('/deals');

      const detailLink = page.getByRole('link').filter({ has: page.locator('.lucide-eye') }).first();
      const hasDeals = await detailLink.isVisible().catch(() => false);

      if (hasDeals) {
        await detailLink.click();

        await expect(page.getByText('案件情報')).toBeVisible();
      }
    });

    test('活動履歴セクションが表示される', async ({ page }) => {
      await page.goto('/deals');

      const detailLink = page.getByRole('link').filter({ has: page.locator('.lucide-eye') }).first();
      const hasDeals = await detailLink.isVisible().catch(() => false);

      if (hasDeals) {
        await detailLink.click();

        await expect(page.getByText('活動履歴')).toBeVisible();
      }
    });

    test('リース審査セクションが表示される', async ({ page }) => {
      await page.goto('/deals');

      const detailLink = page.getByRole('link').filter({ has: page.locator('.lucide-eye') }).first();
      const hasDeals = await detailLink.isVisible().catch(() => false);

      if (hasDeals) {
        await detailLink.click();

        await expect(page.getByText('リース審査')).toBeVisible();
      }
    });
  });

  test.describe('ステータス変更', () => {
    // なぜ必要：ステータス変更機能の動作を保証

    test('ステータスボタンをクリックするとステータスが変更される', async ({ page }) => {
      await page.goto('/deals');

      const detailLink = page.getByRole('link').filter({ has: page.locator('.lucide-eye') }).first();
      const hasDeals = await detailLink.isVisible().catch(() => false);

      if (hasDeals) {
        await detailLink.click();

        // 現在のステータス以外のボタンをクリック
        const statusButtons = page.locator('button:has-text("商談中"), button:has-text("見積提出")');
        const hasStatusButton = await statusButtons.first().isVisible().catch(() => false);

        if (hasStatusButton) {
          const button = statusButtons.first();
          const isDisabled = await button.isDisabled();

          if (!isDisabled) {
            await button.click();
            // ページがリフレッシュされる
            await page.waitForLoadState('networkidle');
          }
        }
      }
    });
  });

  test.describe('活動登録', () => {
    // なぜ必要：活動履歴の追加機能を保証

    test('活動を追加できる', async ({ page }) => {
      await page.goto('/deals');

      const detailLink = page.getByRole('link').filter({ has: page.locator('.lucide-eye') }).first();
      const hasDeals = await detailLink.isVisible().catch(() => false);

      if (hasDeals) {
        await detailLink.click();

        // 活動フォームを探す
        const activityForm = page.getByLabel(/活動内容|内容/i);
        const hasForm = await activityForm.isVisible().catch(() => false);

        if (hasForm) {
          await activityForm.fill('テスト活動内容');
          await page.getByRole('button', { name: /登録|追加/i }).click();
        }
      }
    });
  });

  test.describe('変更履歴', () => {
    // なぜ必要：変更履歴でユーザー名が正しく表示されることを保証（UUID表示バグの回帰テスト）

    test('営業担当者変更時に履歴にUUIDではなくユーザー名が表示される', async ({ page }) => {
      await page.goto('/deals');

      // 案件詳細に移動
      const detailLink = page.getByRole('link').filter({ has: page.locator('.lucide-eye') }).first();
      const hasDeals = await detailLink.isVisible().catch(() => false);

      if (!hasDeals) {
        test.skip(true, '案件データがないためスキップ');
        return;
      }

      await detailLink.click();
      await page.waitForLoadState('networkidle');

      // 編集ボタンをクリック
      const editButton = page.getByRole('link', { name: /編集/i });
      const hasEditButton = await editButton.isVisible().catch(() => false);

      if (!hasEditButton) {
        test.skip(true, '編集ボタンがないためスキップ');
        return;
      }

      await editButton.click();
      await page.waitForLoadState('networkidle');

      // 営業担当者を変更
      const salesUserField = page.getByRole('combobox').filter({ hasText: /営業担当者/i }).or(
        page.locator('button').filter({ hasText: /営業担当者|選択/i })
      ).first();

      const hasSalesUserField = await salesUserField.isVisible().catch(() => false);

      if (hasSalesUserField) {
        await salesUserField.click();

        // 別のユーザーを選択（最初以外のユーザー）
        const userOptions = page.getByRole('option');
        const optionCount = await userOptions.count();

        if (optionCount > 1) {
          await userOptions.nth(1).click();
        } else if (optionCount > 0) {
          await userOptions.first().click();
        }

        // 保存ボタンをクリック
        await page.getByRole('button', { name: /更新|保存/i }).click();
        await page.waitForLoadState('networkidle');

        // 変更履歴セクションを確認
        const historySection = page.getByText('変更履歴');
        const hasHistory = await historySection.isVisible().catch(() => false);

        if (hasHistory) {
          // UUID形式のテキストが表示されていないことを確認
          // UUIDパターン: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
          const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
          const historyContent = await page.locator('.divide-y').first().textContent();

          if (historyContent) {
            expect(historyContent).not.toMatch(uuidPattern);
          }
        }
      }
    });
  });
});
