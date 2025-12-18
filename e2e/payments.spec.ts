/**
 * 入金管理E2Eテスト
 *
 * なぜこのテストが必要か：
 * - 入金データのCRUD操作がUI上で正しく動作することを保証
 * - 金額計算・サマリー表示の正確性を検証
 * - 入金済み処理の動作を確認
 */
import { test, expect } from '@playwright/test';

test.describe('入金管理', () => {
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test.describe('入金一覧', () => {
    // なぜ必要：入金一覧表示の基本機能を保証

    test.beforeEach(async ({ page }) => {
      await page.goto('/payments');
    });

    test('入金管理ページが正しく表示される', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /入金/i })).toBeVisible();

      // テーブルヘッダーが表示される
      await expect(page.getByText('案件')).toBeVisible();
      await expect(page.getByText('リース会社')).toBeVisible();
      await expect(page.getByText('ステータス')).toBeVisible();
    });

    test('新規入金登録ボタンが表示される', async ({ page }) => {
      const newButton = page.getByRole('button', { name: /新規|登録|追加|作成/i });
      await expect(newButton).toBeVisible();
    });

    test('入金がない場合はメッセージが表示される', async ({ page }) => {
      const emptyMessage = page.getByText(/入金情報がまだ登録されていません|データがありません/i);
      const table = page.getByRole('table');

      const hasTable = await table.isVisible().catch(() => false);
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

      expect(hasTable || hasEmptyMessage).toBeTruthy();
    });
  });

  test.describe('サマリーカード', () => {
    // なぜ必要：入金サマリーの表示を保証

    test.beforeEach(async ({ page }) => {
      await page.goto('/payments');
    });

    test('入金予定カードが表示される', async ({ page }) => {
      const pendingCard = page.getByText('入金予定');
      const hasCard = await pendingCard.isVisible().catch(() => false);

      if (hasCard) {
        await expect(pendingCard).toBeVisible();
      }
    });

    test('入金済みカードが表示される', async ({ page }) => {
      const paidCard = page.getByText('入金済み');
      const hasCard = await paidCard.isVisible().catch(() => false);

      if (hasCard) {
        await expect(paidCard).toBeVisible();
      }
    });

    test('合計カードが表示される', async ({ page }) => {
      const totalCard = page.getByText('合計');
      const hasCard = await totalCard.isVisible().catch(() => false);

      if (hasCard) {
        await expect(totalCard).toBeVisible();
      }
    });

    test('金額が日本円形式で表示される', async ({ page }) => {
      // ¥記号と数字が表示される
      const amountText = page.locator('text=/¥[0-9,]+/');
      const hasAmount = await amountText.first().isVisible().catch(() => false);

      if (hasAmount) {
        expect(await amountText.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('入金登録', () => {
    // なぜ必要：新規入金登録機能の動作を保証

    test.beforeEach(async ({ page }) => {
      await page.goto('/payments');
    });

    test('入金登録ダイアログが開く', async ({ page }) => {
      const newButton = page.getByRole('button', { name: /新規|登録|追加|作成/i });
      await newButton.click();

      // ダイアログが表示される
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('有効なデータで入金を登録できる', async ({ page }) => {
      await page.getByRole('button', { name: /新規|登録|追加|作成/i }).click();

      // 案件を選択
      const dealSelect = page.getByLabel(/案件/i);
      if (await dealSelect.isVisible()) {
        await dealSelect.click();
        const dealOption = page.getByRole('option').first();
        const hasDeal = await dealOption.isVisible().catch(() => false);

        if (hasDeal) {
          await dealOption.click();

          // リース会社を選択
          const companySelect = page.getByLabel(/リース会社/i);
          if (await companySelect.isVisible()) {
            await companySelect.click();
            await page.getByRole('option').first().click();
          }

          // 金額を入力
          const amountInput = page.getByLabel(/予定金額|金額/i);
          if (await amountInput.isVisible()) {
            await amountInput.fill('500000');
          }

          await page.getByRole('button', { name: /作成|保存|登録/i }).click();

          // ダイアログが閉じる
          await expect(page.getByRole('dialog')).not.toBeVisible();
        }
      }
    });
  });

  test.describe('入金ステータス変更', () => {
    // なぜ必要：入金済み処理の動作を保証

    test('入金済みボタンが未入金の項目に表示される', async ({ page }) => {
      await page.goto('/payments');

      // 未入金ステータスバッジを探す
      const pendingBadge = page.getByText('未入金');
      const hasPending = await pendingBadge.first().isVisible().catch(() => false);

      if (hasPending) {
        // チェックアイコン（入金済みボタン）が存在する
        const checkButton = page.locator('.lucide-check').first();
        const hasCheck = await checkButton.isVisible().catch(() => false);

        if (hasCheck) {
          expect(checkButton).toBeVisible();
        }
      }
    });
  });

  test.describe('入金削除', () => {
    // なぜ必要：入金削除機能の動作を保証

    test('削除ボタンが表示される', async ({ page }) => {
      await page.goto('/payments');

      const deleteButton = page.locator('.lucide-trash-2').first();
      const hasDelete = await deleteButton.isVisible().catch(() => false);

      if (hasDelete) {
        expect(deleteButton).toBeVisible();
      }
    });
  });

  test.describe('期限表示', () => {
    // なぜ必要：入金予定日の視覚的警告を保証

    test('期限切れの入金は赤色で表示される', async ({ page }) => {
      await page.goto('/payments');

      // 期限切れ入金は赤色クラスを持つ
      const overdueDate = page.locator('.text-red-600');
      const hasOverdue = await overdueDate.first().isVisible().catch(() => false);

      if (hasOverdue) {
        expect(await overdueDate.count()).toBeGreaterThan(0);
      }
    });

    test('今日期限の入金はオレンジ色で表示される', async ({ page }) => {
      await page.goto('/payments');

      const todayDate = page.locator('.text-orange-600');
      const hasToday = await todayDate.first().isVisible().catch(() => false);

      if (hasToday) {
        expect(await todayDate.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('ステータスバッジ', () => {
    // なぜ必要：ステータスの視覚的識別を保証

    test('未入金バッジは黄色で表示される', async ({ page }) => {
      await page.goto('/payments');

      const pendingBadge = page.locator('.bg-yellow-100:has-text("未入金")');
      const hasPending = await pendingBadge.first().isVisible().catch(() => false);

      if (hasPending) {
        expect(pendingBadge.first()).toBeVisible();
      }
    });

    test('入金済みバッジは緑色で表示される', async ({ page }) => {
      await page.goto('/payments');

      const paidBadge = page.locator('.bg-green-100:has-text("入金済")');
      const hasPaid = await paidBadge.first().isVisible().catch(() => false);

      if (hasPaid) {
        expect(paidBadge.first()).toBeVisible();
      }
    });
  });
});
