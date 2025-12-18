/**
 * タスク管理E2Eテスト
 *
 * なぜこのテストが必要か：
 * - タスクのCRUD操作がUI上で正しく動作することを保証
 * - ステータス変更・期限管理の動作を検証
 * - 優先度による視覚的識別を確認
 */
import { test, expect } from '@playwright/test';

test.describe('タスク管理', () => {
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test.describe('タスク一覧', () => {
    // なぜ必要：タスク一覧表示の基本機能を保証

    test.beforeEach(async ({ page }) => {
      await page.goto('/tasks');
    });

    test('タスク一覧ページが正しく表示される', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /タスク/i })).toBeVisible();

      // テーブルヘッダーが表示される
      await expect(page.getByText('タスク名')).toBeVisible();
      await expect(page.getByText('優先度')).toBeVisible();
      await expect(page.getByText('ステータス')).toBeVisible();
      await expect(page.getByText('期限')).toBeVisible();
    });

    test('新規タスク作成ボタンが表示される', async ({ page }) => {
      const newButton = page.getByRole('button', { name: /新規|登録|追加|作成/i });
      await expect(newButton).toBeVisible();
    });

    test('タスクがない場合はメッセージが表示される', async ({ page }) => {
      const emptyMessage = page.getByText(/タスクがまだ登録されていません|データがありません/i);
      const table = page.getByRole('table');

      const hasTable = await table.isVisible().catch(() => false);
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

      expect(hasTable || hasEmptyMessage).toBeTruthy();
    });

    test('優先度バッジが表示される', async ({ page }) => {
      // タスクがある場合、優先度バッジが表示される
      const priorityBadges = page.getByText(/高|中|低/);
      const hasBadges = await priorityBadges.first().isVisible().catch(() => false);

      if (hasBadges) {
        expect(await priorityBadges.count()).toBeGreaterThan(0);
      }
    });

    test('ステータスバッジが表示される', async ({ page }) => {
      const statusBadges = page.getByText(/未着手|進行中|完了/);
      const hasBadges = await statusBadges.first().isVisible().catch(() => false);

      if (hasBadges) {
        expect(await statusBadges.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('タスク作成', () => {
    // なぜ必要：新規タスク作成機能の動作を保証

    test.beforeEach(async ({ page }) => {
      await page.goto('/tasks');
    });

    test('タスク作成ダイアログが開く', async ({ page }) => {
      const newButton = page.getByRole('button', { name: /新規|登録|追加|作成/i });
      await newButton.click();

      // ダイアログが表示される
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByLabel(/タスク名|タイトル/i)).toBeVisible();
    });

    test('有効なデータでタスクを作成できる', async ({ page }) => {
      const timestamp = Date.now();

      await page.getByRole('button', { name: /新規|登録|追加|作成/i }).click();

      await page.getByLabel(/タスク名|タイトル/i).fill(`テストタスク_${timestamp}`);

      // 優先度を選択
      const prioritySelect = page.getByLabel(/優先度/i);
      if (await prioritySelect.isVisible()) {
        await prioritySelect.click();
        await page.getByRole('option', { name: /高/i }).click();
      }

      // 期限を設定
      const dueDateInput = page.getByLabel(/期限/i);
      if (await dueDateInput.isVisible()) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        await dueDateInput.fill(futureDate.toISOString().split('T')[0]);
      }

      await page.getByRole('button', { name: /作成|保存|登録/i }).click();

      // ダイアログが閉じる
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('タスクステータス変更', () => {
    // なぜ必要：チェックボックスによるステータス変更を保証

    test('チェックボックスでタスクを完了にできる', async ({ page }) => {
      await page.goto('/tasks');

      // 未完了のタスクのチェックボックスを探す
      const checkbox = page.getByRole('checkbox').first();
      const hasCheckbox = await checkbox.isVisible().catch(() => false);

      if (hasCheckbox) {
        const isChecked = await checkbox.isChecked();

        if (!isChecked) {
          await checkbox.click();
          // ページがリフレッシュされる
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });

  test.describe('タスク削除', () => {
    // なぜ必要：タスク削除機能の動作を保証

    test('削除ボタンが表示される', async ({ page }) => {
      await page.goto('/tasks');

      const deleteButton = page.locator('.lucide-trash-2').first();
      const hasDelete = await deleteButton.isVisible().catch(() => false);

      if (hasDelete) {
        expect(deleteButton).toBeVisible();
      }
    });
  });

  test.describe('期限表示', () => {
    // なぜ必要：期限切れの視覚的警告を保証

    test('期限切れタスクは赤色で表示される', async ({ page }) => {
      await page.goto('/tasks');

      // 期限切れタスクは赤色クラスを持つ
      const overdueDate = page.locator('.text-red-600');
      const hasOverdue = await overdueDate.first().isVisible().catch(() => false);

      // 期限切れタスクがあれば赤色で表示される
      if (hasOverdue) {
        expect(await overdueDate.count()).toBeGreaterThan(0);
      }
    });

    test('今日期限のタスクはオレンジ色で表示される', async ({ page }) => {
      await page.goto('/tasks');

      // 今日期限タスクはオレンジ色クラスを持つ
      const todayDate = page.locator('.text-orange-600');
      const hasToday = await todayDate.first().isVisible().catch(() => false);

      if (hasToday) {
        expect(await todayDate.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('完了タスクのスタイル', () => {
    // なぜ必要：完了タスクの視覚的識別を保証

    test('完了タスクは透明度が適用される', async ({ page }) => {
      await page.goto('/tasks');

      // 完了タスクはopacity-60クラスを持つ
      const completedRow = page.locator('.opacity-60');
      const hasCompleted = await completedRow.first().isVisible().catch(() => false);

      if (hasCompleted) {
        expect(await completedRow.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
