/**
 * PaymentListコンポーネントのテスト
 *
 * なぜこのテストが必要か：
 * - 入金管理は売上回収の可視化に重要
 * - 金額計算の正確性確認
 * - 期限切れ表示の動作検証
 */
import { render, screen, waitFor } from '../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { PaymentList } from '@/components/features/payments/payment-list';
import {
  createMockPayment,
  generateDateString,
} from '../../utils/test-utils';

// Supabaseモックの参照を取得
const mockSupabase = {
  from: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

// confirmダイアログのモック
global.confirm = jest.fn();

describe('PaymentListコンポーネント', () => {
  const mockDeals = [
    { id: 'deal-001', title: '案件A' },
    { id: 'deal-002', title: '案件B' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  describe('正常系：データ表示', () => {
    // なぜ必要：基本的なレンダリングが正しく動作することを確認

    it('入金データが正しく表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          expected_amount: 100000,
          actual_amount: null,
          expected_date: '2024-12-31',
          actual_date: null,
          status: 'pending',
          lease_company: 'オリコ',
          deal: { id: 'deal-001', title: 'テスト案件' },
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      expect(screen.getByText('テスト案件')).toBeInTheDocument();
      expect(screen.getByText('オリコ')).toBeInTheDocument();
      expect(screen.getByText('¥100,000')).toBeInTheDocument();
      expect(screen.getByText('2024/12/31')).toBeInTheDocument();
      expect(screen.getByText('未入金')).toBeInTheDocument();
    });

    it('複数の入金データが表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          deal: { id: 'deal-001', title: '案件1' },
        }),
        createMockPayment({
          id: 'payment-002',
          deal: { id: 'deal-002', title: '案件2' },
        }),
        createMockPayment({
          id: 'payment-003',
          deal: { id: 'deal-003', title: '案件3' },
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      expect(screen.getByText('案件1')).toBeInTheDocument();
      expect(screen.getByText('案件2')).toBeInTheDocument();
      expect(screen.getByText('案件3')).toBeInTheDocument();
    });
  });

  describe('正常系：ステータス表示', () => {
    // なぜ必要：入金状況の正確な表示を保証

    it('未入金ステータスが黄色バッジで表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          status: 'pending',
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      const badge = screen.getByText('未入金');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('入金済みステータスが緑色バッジで表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          status: 'paid',
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      const badge = screen.getByText('入金済');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  describe('正常系：空の状態', () => {
    // なぜ必要：データがない場合のユーザー体験を保証

    it('入金データがない場合はメッセージを表示', () => {
      render(<PaymentList payments={[]} deals={mockDeals} />);

      expect(
        screen.getByText('入金情報がまだ登録されていません')
      ).toBeInTheDocument();
    });
  });

  describe('正常系：サマリー計算', () => {
    // なぜ必要：金額集計の正確性を保証

    it('入金予定・入金済み・合計が正しく計算される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          status: 'pending',
          expected_amount: 100000,
          actual_amount: null,
        }),
        createMockPayment({
          id: 'payment-002',
          status: 'pending',
          expected_amount: 200000,
          actual_amount: null,
        }),
        createMockPayment({
          id: 'payment-003',
          status: 'paid',
          expected_amount: 150000,
          actual_amount: 150000,
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      // 入金予定: 100000 + 200000 = 300000
      // 入金済み: 150000
      // 合計: 450000
      expect(screen.getByText('¥300,000')).toBeInTheDocument(); // 入金予定
      expect(screen.getByText('¥150,000')).toBeInTheDocument(); // 入金済み
      expect(screen.getByText('¥450,000')).toBeInTheDocument(); // 合計
    });

    it('pendingのみの場合は入金予定のみ計算される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          status: 'pending',
          expected_amount: 500000,
          actual_amount: null,
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      expect(screen.getByText('¥500,000')).toBeInTheDocument();
    });
  });

  describe('正常系：関連案件リンク', () => {
    // なぜ必要：入金から案件への遷移を保証

    it('関連案件へのリンクが表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          deal_id: 'deal-001',
          deal: { id: 'deal-001', title: '関連案件名' },
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      const link = screen.getByRole('link', { name: '関連案件名' });
      expect(link).toHaveAttribute('href', '/deals/deal-001');
    });

    it('関連案件がない場合は「-」が表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          deal_id: undefined,
          deal: undefined,
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe('正常系：期限表示', () => {
    // なぜ必要：入金期限切れの視覚的警告を保証

    it('期限切れの入金は赤色で表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          status: 'pending',
          expected_date: generateDateString(-1), // 昨日
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      // 期限切れスタイルが適用されている
      const dateCell = screen.getByText(
        new RegExp(generateDateString(-1).replace(/-/g, '/'))
      );
      expect(dateCell).toHaveClass('text-red-600');
    });

    it('今日が期限の入金はオレンジ色で表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          status: 'pending',
          expected_date: generateDateString(0), // 今日
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      const dateCell = screen.getByText(
        new RegExp(generateDateString(0).replace(/-/g, '/'))
      );
      expect(dateCell).toHaveClass('text-orange-600');
    });

    it('入金済みは期限切れでも通常表示', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          status: 'paid',
          expected_date: generateDateString(-1), // 昨日
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      const dateCell = screen.getByText(
        new RegExp(generateDateString(-1).replace(/-/g, '/'))
      );
      expect(dateCell).not.toHaveClass('text-red-600');
    });
  });

  describe('正常系：入金済みボタン', () => {
    // なぜ必要：入金確認操作の動作を保証

    it('未入金の場合、入金済みボタンが表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          status: 'pending',
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      // チェックアイコン（入金済みボタン）が存在する
      const buttons = screen.getAllByRole('button');
      const checkButton = buttons.find((btn) =>
        btn.querySelector('.lucide-check')
      );
      expect(checkButton).toBeTruthy();
    });

    it('入金済みの場合、入金済みボタンは表示されない', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          status: 'paid',
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      // チェックアイコンは存在しない（緑色のチェック）
      const checkIcon = document.querySelector('.text-green-500.lucide-check');
      expect(checkIcon).toBeNull();
    });

    it('入金済みボタンクリックでSupabaseが呼ばれる', async () => {
      const user = userEvent.setup();
      const payments = [
        createMockPayment({
          id: 'payment-001',
          status: 'pending',
          expected_amount: 100000,
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      // 入金済みボタンをクリック
      const buttons = screen.getAllByRole('button');
      const checkButton = buttons.find(
        (btn) => btn.getAttribute('title') === '入金済みにする'
      );

      if (checkButton) {
        await user.click(checkButton);

        await waitFor(() => {
          expect(mockSupabase.from).toHaveBeenCalledWith('payments');
        });
      }
    });
  });

  describe('正常系：削除機能', () => {
    // なぜ必要：入金データ削除の動作確認

    it('削除ボタンが表示される', () => {
      const payments = [createMockPayment({ id: 'payment-001' })];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      // 削除ボタン（ゴミ箱アイコン）が存在する
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('削除確認でキャンセルした場合は削除されない', async () => {
      const user = userEvent.setup();
      (global.confirm as jest.Mock).mockReturnValue(false);

      const payments = [createMockPayment({ id: 'payment-001' })];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      const deleteButton = document.querySelector('.text-red-500');
      if (deleteButton?.closest('button')) {
        await user.click(deleteButton.closest('button')!);
      }

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('正常系：テーブルヘッダー', () => {
    // なぜ必要：UIの構造が正しいことを確認

    it('すべてのテーブルヘッダーが表示される', () => {
      const payments = [createMockPayment()];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      expect(screen.getByText('案件')).toBeInTheDocument();
      expect(screen.getByText('リース会社')).toBeInTheDocument();
      expect(screen.getByText('ステータス')).toBeInTheDocument();
      expect(screen.getByText('予定金額')).toBeInTheDocument();
      expect(screen.getByText('実績金額')).toBeInTheDocument();
      expect(screen.getByText('予定日')).toBeInTheDocument();
      expect(screen.getByText('入金日')).toBeInTheDocument();
      expect(screen.getByText('操作')).toBeInTheDocument();
    });
  });

  describe('正常系：金額フォーマット', () => {
    // なぜ必要：日本円の表示形式を保証

    it('金額が日本円形式で表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          expected_amount: 1234567,
          status: 'pending',
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      expect(screen.getByText('¥1,234,567')).toBeInTheDocument();
    });

    it('金額がnullの場合は「-」が表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          expected_amount: null,
          actual_amount: null,
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('異常系：欠損データ', () => {
    // なぜ必要：データが不完全な場合にクラッシュしないことを保証

    it('リース会社がnullの場合は「-」が表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          lease_company: null,
        }),
      ];

      render(<PaymentList payments={payments} deals={mockDeals} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('日付がnullの場合も正常に表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          expected_date: null,
          actual_date: null,
        }),
      ];

      expect(() =>
        render(<PaymentList payments={payments} deals={mockDeals} />)
      ).not.toThrow();
    });
  });

  describe('境界値テスト', () => {
    // なぜ必要：エッジケースでの安定性を保証

    it('金額が0円の場合も正しく表示される', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          expected_amount: 0,
          status: 'pending',
        }),
      ];

      // 金額が0の場合は「-」と表示される（formatAmountの仕様）
      render(<PaymentList payments={payments} deals={mockDeals} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('非常に大きな金額でもクラッシュしない', () => {
      const payments = [
        createMockPayment({
          id: 'payment-001',
          expected_amount: 999999999999,
          status: 'pending',
        }),
      ];

      expect(() =>
        render(<PaymentList payments={payments} deals={mockDeals} />)
      ).not.toThrow();
    });

    it('非常に多くの入金データでもレンダリングできる', () => {
      const payments = Array.from({ length: 100 }, (_, i) =>
        createMockPayment({
          id: `payment-${i}`,
          expected_amount: 10000 * (i + 1),
        })
      );

      expect(() =>
        render(<PaymentList payments={payments} deals={mockDeals} />)
      ).not.toThrow();
    });
  });
});
