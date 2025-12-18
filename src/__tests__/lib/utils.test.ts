/**
 * ユーティリティ関数のテスト
 *
 * なぜこのテストが必要か：
 * - cn関数はTailwindクラスの結合に使用される重要なユーティリティ
 * - スタイリングの一貫性を保証するため
 */
import { cn } from '@/lib/utils';

describe('ユーティリティ関数テスト', () => {
  describe('cn関数（クラス名結合）', () => {
    // なぜ必要：UIコンポーネントのスタイリングに広く使用される

    it('単一のクラス名を正しく返す', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('複数のクラス名を結合する', () => {
      const result = cn('text-red-500', 'bg-blue-100');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-100');
    });

    it('条件付きクラス名を正しく処理する', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('falsy値は無視される', () => {
      const result = cn('base-class', false && 'hidden', null, undefined);
      expect(result).toBe('base-class');
    });

    it('重複するTailwindクラスをマージする', () => {
      // tailwind-mergeにより後のクラスが優先される
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('異なるプロパティのクラスは両方保持される', () => {
      const result = cn('text-red-500', 'bg-blue-500', 'p-4');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('p-4');
    });

    it('オブジェクト形式の条件付きクラスを処理する', () => {
      const result = cn({
        'base-class': true,
        'active-class': true,
        'disabled-class': false,
      });
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
      expect(result).not.toContain('disabled-class');
    });

    it('配列形式のクラス名を処理する', () => {
      const result = cn(['class-1', 'class-2']);
      expect(result).toContain('class-1');
      expect(result).toContain('class-2');
    });

    it('空の入力で空文字を返す', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(null)).toBe('');
      expect(cn(undefined)).toBe('');
    });

    it('実際のUIコンポーネントで使用されるパターンを正しく処理する', () => {
      // バッジコンポーネントの典型的なパターン
      const status = 'pending';
      const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-green-100 text-green-800',
      };
      const result = cn('px-2 py-1 rounded', statusColors[status]);
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).toContain('rounded');
      expect(result).toContain('bg-yellow-100');
      expect(result).toContain('text-yellow-800');
    });
  });
});

describe('境界値テスト', () => {
  describe('cn関数の境界値', () => {
    // なぜ必要：エッジケースでのクラッシュを防止

    it('非常に長いクラス名を処理できる', () => {
      const longClassName = 'a'.repeat(1000);
      expect(() => cn(longClassName)).not.toThrow();
    });

    it('特殊文字を含むクラス名を処理できる', () => {
      const result = cn('hover:bg-blue-500', 'focus:ring-2', 'sm:text-lg');
      expect(result).toContain('hover:bg-blue-500');
      expect(result).toContain('focus:ring-2');
      expect(result).toContain('sm:text-lg');
    });

    it('数値から始まるクラス名も処理できる', () => {
      const result = cn('2xl:text-lg', 'w-1/2');
      expect(result).toContain('2xl:text-lg');
      expect(result).toContain('w-1/2');
    });

    it('多数のクラスを結合できる', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      expect(() => cn(...classes)).not.toThrow();
    });
  });
});
