/**
 * Jest設定ファイル
 * Next.js 14 + TypeScript + React Testing Library用
 */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Next.jsアプリのパスを指定（next.config.jsとテスト環境で.envを読み込むため）
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // テスト環境の設定
  testEnvironment: 'jsdom',

  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // モジュールパスエイリアス（tsconfig.jsonと同期）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // テストファイルのパターン
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/*.test.[jt]s?(x)',
  ],

  // カバレッジ設定
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
  ],

  // カバレッジ閾値
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // テストタイムアウト（ミリ秒）
  testTimeout: 10000,

  // 詳細な出力
  verbose: true,
};

module.exports = createJestConfig(customJestConfig);
