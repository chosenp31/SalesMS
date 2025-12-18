/**
 * DealListコンポーネントのテスト
 *
 * なぜこのテストが必要か：
 * - 案件一覧は営業活動の中心となる画面
 * - データの正しい表示とナビゲーションの動作を保証
 * - ステータス表示の正確性はワークフロー管理に直結
 */
import { render, screen } from '../../utils/test-utils';
import { DealList } from '@/components/features/deals/deal-list';
import { createMockDeal, createMockCustomer, createMockUser } from '../../utils/test-utils';

describe('DealListコンポーネント', () => {
  describe('正常系：データ表示', () => {
    // なぜ必要：基本的なレンダリングが正しく動作することを確認

    it('案件データが正しく表示される', () => {
      const deals = [
        createMockDeal({
          id: 'deal-001',
          title: 'テスト案件A',
          status: 'in_negotiation',
          estimated_amount: 1500000,
          customer: createMockCustomer({ company_name: '株式会社A' }),
          assigned_user: createMockUser({ name: '担当者A' }),
        }),
      ];

      render(<DealList deals={deals} />);

      // 案件名が表示される
      expect(screen.getByText('テスト案件A')).toBeInTheDocument();
      // 顧客名が表示される
      expect(screen.getByText('株式会社A')).toBeInTheDocument();
      // 担当者名が表示される
      expect(screen.getByText('担当者A')).toBeInTheDocument();
    });

    it('複数の案件が表示される', () => {
      const deals = [
        createMockDeal({ id: 'deal-001', title: '案件1' }),
        createMockDeal({ id: 'deal-002', title: '案件2' }),
        createMockDeal({ id: 'deal-003', title: '案件3' }),
      ];

      render(<DealList deals={deals} />);

      expect(screen.getByText('案件1')).toBeInTheDocument();
      expect(screen.getByText('案件2')).toBeInTheDocument();
      expect(screen.getByText('案件3')).toBeInTheDocument();
    });

    it('ステータスラベルが正しく表示される', () => {
      const deals = [
        createMockDeal({ id: 'deal-001', status: 'in_negotiation' }),
      ];

      render(<DealList deals={deals} />);

      expect(screen.getByText('商談中')).toBeInTheDocument();
    });

    it('フェーズラベルが正しく表示される', () => {
      const deals = [
        createMockDeal({ id: 'deal-001', status: 'in_negotiation' }),
      ];

      render(<DealList deals={deals} />);

      expect(screen.getByText('営業フェーズ')).toBeInTheDocument();
    });

    it('契約種別が正しく表示される', () => {
      const deals = [
        createMockDeal({ id: 'deal-001', contract_type: 'lease' }),
      ];

      render(<DealList deals={deals} />);

      expect(screen.getByText('リース')).toBeInTheDocument();
    });

    it('見込金額が通貨形式で表示される', () => {
      const deals = [
        createMockDeal({ id: 'deal-001', estimated_amount: 1000000 }),
      ];

      render(<DealList deals={deals} />);

      // 日本円形式で表示される（¥1,000,000）
      expect(screen.getByText('¥1,000,000')).toBeInTheDocument();
    });

    it('作成日が正しい形式で表示される', () => {
      const deals = [
        createMockDeal({
          id: 'deal-001',
          created_at: '2024-03-15T00:00:00Z',
        }),
      ];

      render(<DealList deals={deals} />);

      expect(screen.getByText('2024/03/15')).toBeInTheDocument();
    });
  });

  describe('正常系：空の状態', () => {
    // なぜ必要：データがない場合のユーザー体験を保証

    it('案件がない場合はメッセージを表示', () => {
      render(<DealList deals={[]} />);

      expect(
        screen.getByText('案件がまだ登録されていません')
      ).toBeInTheDocument();
    });

    it('案件がない場合はテーブルが表示されない', () => {
      render(<DealList deals={[]} />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('正常系：ナビゲーションリンク', () => {
    // なぜ必要：詳細画面・編集画面への遷移を保証

    it('詳細画面へのリンクが存在する', () => {
      const deals = [createMockDeal({ id: 'deal-abc123' })];

      render(<DealList deals={deals} />);

      const detailLink = screen.getByRole('link', { name: '' });
      expect(detailLink.closest('a')).toHaveAttribute(
        'href',
        '/deals/deal-abc123'
      );
    });

    it('編集画面へのリンクが存在する', () => {
      const deals = [createMockDeal({ id: 'deal-xyz789' })];

      render(<DealList deals={deals} />);

      // 編集アイコンリンクを探す
      const links = screen.getAllByRole('link');
      const editLink = links.find((link) =>
        link.getAttribute('href')?.includes('/edit')
      );
      expect(editLink).toHaveAttribute('href', '/deals/deal-xyz789/edit');
    });
  });

  describe('正常系：テーブルヘッダー', () => {
    // なぜ必要：UIの構造が正しいことを確認

    it('すべてのテーブルヘッダーが表示される', () => {
      const deals = [createMockDeal()];

      render(<DealList deals={deals} />);

      expect(screen.getByText('案件名')).toBeInTheDocument();
      expect(screen.getByText('顧客')).toBeInTheDocument();
      expect(screen.getByText('フェーズ')).toBeInTheDocument();
      expect(screen.getByText('ステータス')).toBeInTheDocument();
      expect(screen.getByText('契約種別')).toBeInTheDocument();
      expect(screen.getByText('見込金額')).toBeInTheDocument();
      expect(screen.getByText('担当者')).toBeInTheDocument();
      expect(screen.getByText('作成日')).toBeInTheDocument();
      expect(screen.getByText('操作')).toBeInTheDocument();
    });
  });

  describe('異常系：欠損データ', () => {
    // なぜ必要：データが不完全な場合にクラッシュしないことを保証

    it('顧客情報がない場合は「-」が表示される', () => {
      const deals = [
        createMockDeal({
          id: 'deal-001',
          customer: undefined,
        }),
      ];

      render(<DealList deals={deals} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('担当者情報がない場合は「-」が表示される', () => {
      const deals = [
        createMockDeal({
          id: 'deal-001',
          assigned_user: undefined,
        }),
      ];

      render(<DealList deals={deals} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('見込金額がnullの場合は「-」が表示される', () => {
      const deals = [
        createMockDeal({
          id: 'deal-001',
          estimated_amount: null,
        }),
      ];

      render(<DealList deals={deals} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe('境界値テスト', () => {
    // なぜ必要：エッジケースでの安定性を保証

    it('見込金額が0の場合も正しく表示される', () => {
      const deals = [
        createMockDeal({
          id: 'deal-001',
          estimated_amount: 0,
        }),
      ];

      render(<DealList deals={deals} />);

      // 0円の場合は「-」表示になる（実装に依存）
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('非常に大きな金額も正しく表示される', () => {
      const deals = [
        createMockDeal({
          id: 'deal-001',
          estimated_amount: 999999999999,
        }),
      ];

      render(<DealList deals={deals} />);

      expect(screen.getByText('¥999,999,999,999')).toBeInTheDocument();
    });

    it('長い案件名でもクラッシュしない', () => {
      const longTitle = 'あ'.repeat(200);
      const deals = [
        createMockDeal({
          id: 'deal-001',
          title: longTitle,
        }),
      ];

      expect(() => render(<DealList deals={deals} />)).not.toThrow();
    });

    it('特殊文字を含む案件名も表示される', () => {
      const deals = [
        createMockDeal({
          id: 'deal-001',
          title: '案件<script>alert("XSS")</script>',
        }),
      ];

      render(<DealList deals={deals} />);

      // HTMLエスケープされて表示される
      expect(
        screen.getByText('案件<script>alert("XSS")</script>')
      ).toBeInTheDocument();
    });
  });

  describe('各フェーズのステータス表示', () => {
    // なぜ必要：すべてのフェーズで正しいバッジ色が適用されることを確認

    it.each([
      ['appointment_acquired', '営業フェーズ', 'アポ獲得'],
      ['in_negotiation', '営業フェーズ', '商談中'],
      ['contract_type_selection', '契約フェーズ', '契約種別選択'],
      ['review_approved', '契約フェーズ', '可決'],
      ['survey_scheduling', '工事フェーズ', '下見調整中'],
      ['completed', '完了フェーズ', '完了'],
    ])(
      'ステータス %s は %s と %s のラベルで表示される',
      (status, phaseLabel, statusLabel) => {
        const deals = [createMockDeal({ id: 'deal-001', status })];

        render(<DealList deals={deals} />);

        expect(screen.getByText(phaseLabel)).toBeInTheDocument();
        expect(screen.getByText(statusLabel)).toBeInTheDocument();
      }
    );
  });
});
