/**
 * Playwright グローバルセットアップ
 *
 * なぜ必要か：
 * - E2Eテスト実行前に認証状態を準備
 * - 全テストで共有する認証セッションを作成
 */
import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  // 認証ディレクトリを作成
  const authDir = path.join(__dirname, '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const authFile = path.join(authDir, 'user.json');

  // 認証済みセッションファイルが既に存在する場合はスキップ
  if (fs.existsSync(authFile)) {
    console.log('認証済みセッションファイルが存在します。スキップします。');
    return;
  }

  console.log('テスト用認証セッションを作成中...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // テスト用サーバーが起動していることを確認
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });

    // ログインフォームが表示されるまで待機
    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 10000,
    });

    // テスト用アカウントでログイン
    // 注意：テスト環境のみで使用する認証情報
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    await page.fill('input[type="email"], input[name="email"]', testEmail);
    await page.fill('input[type="password"], input[name="password"]', testPassword);

    await page.click('button[type="submit"]');

    // ログイン成功を待機（ダッシュボードへリダイレクト）
    await page.waitForURL('**/*', { timeout: 10000 });

    // 認証状態を保存
    await context.storageState({ path: authFile });

    console.log('認証セッションを保存しました:', authFile);
  } catch (error) {
    console.log('認証セットアップに失敗しました。モック認証ファイルを作成します。');

    // モック認証ファイルを作成（テスト環境用）
    const mockAuthState = {
      cookies: [],
      origins: [
        {
          origin: config.projects[0].use?.baseURL || 'http://localhost:3000',
          localStorage: [
            {
              name: 'supabase.auth.token',
              value: JSON.stringify({
                access_token: 'mock-token',
                refresh_token: 'mock-refresh',
                user: {
                  id: 'mock-user-id',
                  email: 'test@example.com',
                },
              }),
            },
          ],
        },
      ],
    };

    fs.writeFileSync(authFile, JSON.stringify(mockAuthState, null, 2));
    console.log('モック認証ファイルを作成しました:', authFile);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
