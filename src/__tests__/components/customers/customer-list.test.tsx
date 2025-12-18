/**
 * CustomerListコンポーネントのテスト
 *
 * なぜこのテストが必要か：
 * - 顧客一覧は営業活動の基盤
 * - 顧客データの正確な表示を保証
 * - 編集・詳細へのナビゲーションを検証
 */
import { render, screen } from '../../utils/test-utils';
import { CustomerList } from '@/components/features/customers/customer-list';
import { createMockCustomer } from '../../utils/test-utils';

describe('CustomerListコンポーネント', () => {
  describe('正常系：データ表示', () => {
    // なぜ必要：基本的なレンダリングが正しく動作することを確認

    it('顧客データが正しく表示される', () => {
      const customers = [
        createMockCustomer({
          id: 'customer-001',
          company_name: '株式会社テスト',
          representative_name: '山田太郎',
          business_type: 'corporation',
          phone: '03-1234-5678',
          email: 'test@example.com',
        }),
      ];

      render(<CustomerList customers={customers} />);

      expect(screen.getByText('株式会社テスト')).toBeInTheDocument();
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
      expect(screen.getByText('法人')).toBeInTheDocument();
      expect(screen.getByText('03-1234-5678')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('複数の顧客データが表示される', () => {
      const customers = [
        createMockCustomer({ id: 'customer-001', company_name: '会社A' }),
        createMockCustomer({ id: 'customer-002', company_name: '会社B' }),
        createMockCustomer({ id: 'customer-003', company_name: '会社C' }),
      ];

      render(<CustomerList customers={customers} />);

      expect(screen.getByText('会社A')).toBeInTheDocument();
      expect(screen.getByText('会社B')).toBeInTheDocument();
      expect(screen.getByText('会社C')).toBeInTheDocument();
    });
  });

  describe('正常系：事業形態表示', () => {
    // なぜ必要：事業形態による顧客の識別を保証

    it.each([
      ['corporation', '法人'],
      ['sole_proprietor', '個人事業主'],
      ['new_corporation', '新設法人'],
    ])('事業形態 %s は %s と表示される', (businessType, label) => {
      const customers = [
        createMockCustomer({
          id: 'customer-001',
          business_type: businessType as
            | 'corporation'
            | 'sole_proprietor'
            | 'new_corporation',
        }),
      ];

      render(<CustomerList customers={customers} />);

      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  describe('正常系：空の状態', () => {
    // なぜ必要：データがない場合のユーザー体験を保証

    it('顧客がいない場合はメッセージを表示', () => {
      render(<CustomerList customers={[]} />);

      expect(
        screen.getByText('顧客がまだ登録されていません')
      ).toBeInTheDocument();
    });
  });

  describe('正常系：ナビゲーションリンク', () => {
    // なぜ必要：詳細・編集画面への遷移を保証

    it('詳細ページへのリンクが正しい', () => {
      const customers = [
        createMockCustomer({
          id: 'customer-001',
          company_name: '株式会社テスト',
        }),
      ];

      render(<CustomerList customers={customers} />);

      // 詳細リンク（Eyeアイコン）
      const links = screen.getAllByRole('link');
      const detailLink = links.find((link) =>
        link.getAttribute('href')?.includes('/customers/customer-001')
      );
      expect(detailLink).toHaveAttribute('href', '/customers/customer-001');
    });

    it('編集ページへのリンクが正しい', () => {
      const customers = [
        createMockCustomer({
          id: 'customer-001',
          company_name: '株式会社テスト',
        }),
      ];

      render(<CustomerList customers={customers} />);

      const links = screen.getAllByRole('link');
      const editLink = links.find((link) =>
        link.getAttribute('href')?.includes('/edit')
      );
      expect(editLink).toHaveAttribute('href', '/customers/customer-001/edit');
    });
  });

  describe('正常系：テーブルヘッダー', () => {
    // なぜ必要：UIの構造が正しいことを確認

    it('すべてのテーブルヘッダーが表示される', () => {
      const customers = [createMockCustomer()];

      render(<CustomerList customers={customers} />);

      expect(screen.getByText('会社名')).toBeInTheDocument();
      expect(screen.getByText('代表者名')).toBeInTheDocument();
      expect(screen.getByText('事業形態')).toBeInTheDocument();
      expect(screen.getByText('電話番号')).toBeInTheDocument();
      expect(screen.getByText('メール')).toBeInTheDocument();
      expect(screen.getByText('操作')).toBeInTheDocument();
    });
  });

  describe('異常系：欠損データ', () => {
    // なぜ必要：データが不完全な場合にクラッシュしないことを保証

    it('電話番号がない場合は「-」が表示される', () => {
      const customers = [
        createMockCustomer({
          id: 'customer-001',
          phone: null,
        }),
      ];

      render(<CustomerList customers={customers} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('メールアドレスがない場合は「-」が表示される', () => {
      const customers = [
        createMockCustomer({
          id: 'customer-001',
          email: null,
        }),
      ];

      render(<CustomerList customers={customers} />);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('電話番号とメールアドレス両方がない場合も正常に表示される', () => {
      const customers = [
        createMockCustomer({
          id: 'customer-001',
          phone: null,
          email: null,
        }),
      ];

      expect(() => render(<CustomerList customers={customers} />)).not.toThrow();

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBe(2);
    });
  });

  describe('境界値テスト', () => {
    // なぜ必要：エッジケースでの安定性を保証

    it('長い会社名でもクラッシュしない', () => {
      const longName = '株式会社'.repeat(50);
      const customers = [
        createMockCustomer({ id: 'customer-001', company_name: longName }),
      ];

      expect(() => render(<CustomerList customers={customers} />)).not.toThrow();
    });

    it('長いメールアドレスでもクラッシュしない', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      const customers = [
        createMockCustomer({ id: 'customer-001', email: longEmail }),
      ];

      expect(() => render(<CustomerList customers={customers} />)).not.toThrow();
    });

    it('非常に多くの顧客データでもレンダリングできる', () => {
      const customers = Array.from({ length: 100 }, (_, i) =>
        createMockCustomer({ id: `customer-${i}`, company_name: `会社${i}` })
      );

      expect(() => render(<CustomerList customers={customers} />)).not.toThrow();
    });

    it('特殊文字を含む会社名も表示される', () => {
      const customers = [
        createMockCustomer({
          id: 'customer-001',
          company_name: '株式会社<テスト>&"会社\'',
        }),
      ];

      render(<CustomerList customers={customers} />);

      expect(
        screen.getByText('株式会社<テスト>&"会社\'')
      ).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    // なぜ必要：アクセシブルなUIを保証

    it('テーブル構造が正しい', () => {
      const customers = [createMockCustomer()];

      render(<CustomerList customers={customers} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1); // ヘッダー行 + データ行
    });

    it('リンクボタンにアクセス可能', () => {
      const customers = [createMockCustomer({ id: 'customer-001' })];

      render(<CustomerList customers={customers} />);

      const links = screen.getAllByRole('link');
      expect(links.length).toBe(2); // 詳細と編集
    });
  });
});
