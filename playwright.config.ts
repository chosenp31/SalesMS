/**
 * Playwright E2Eテスト設定ファイル
 * ブラウザ自動化テスト用
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // テストディレクトリ
  testDir: './e2e',

  // テストファイルのパターン
  testMatch: '**/*.spec.ts',

  // グローバルセットアップ（認証状態の準備）
  globalSetup: './e2e/global-setup.ts',

  // 並列実行（CI環境では無効化）
  fullyParallel: !process.env.CI,

  // 失敗時のリトライ回数
  retries: process.env.CI ? 2 : 0,

  // ワーカー数
  workers: process.env.CI ? 1 : undefined,

  // レポーター設定
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // グローバル設定
  use: {
    // ベースURL（開発サーバー）
    baseURL: 'http://localhost:3000',

    // トレース設定（失敗時のみ記録）
    trace: 'on-first-retry',

    // スクリーンショット設定
    screenshot: 'only-on-failure',

    // ビデオ設定
    video: 'on-first-retry',

    // タイムアウト設定
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // テスト全体のタイムアウト
  timeout: 60000,

  // ブラウザ設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 必要に応じて他のブラウザを追加
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // 開発サーバーの起動設定
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
