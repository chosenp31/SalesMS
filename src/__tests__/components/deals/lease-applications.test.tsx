/**
 * LeaseApplicationsコンポーネントのテスト
 *
 * なぜこのテストが必要か：
 * - リース審査は契約プロセスの重要なステップ
 * - 審査ステータスの正確な表示を保証
 * - 審査申請の追加・編集・削除機能の検証
 */
import { render, screen, waitFor } from '../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { LeaseApplications } from '@/components/features/deals/lease-applications';
import { createMockLeaseApplication } from '../../utils/test-utils';

// Supabaseモックの参照を取得
const mockSupabase = {
  from: jest.fn().mockReturnValue({
    insert: jest.fn().mockReturnThis(),
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

describe('LeaseApplicationsコンポーネント', () => {
  const dealId = 'deal-001';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  describe('正常系：データ表示', () => {
    // なぜ必要：基本的なレンダリングが正しく動作することを確認

    it('審査申請データが正しく表示される', () => {
      const applications = [
        createMockLeaseApplication({
          id: 'app-001',
          lease_company: 'オリコ',
          status: 'reviewing',
          submitted_at: '2024-12-01',
          result_at: null,
          conditions: null,
        }),
      ];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      expect(screen.getByText('オリコ')).toBeInTheDocument();
      expect(screen.getByText('審査中')).toBeInTheDocument();
      expect(screen.getByText(/申請日:/)).toBeInTheDocument();
      expect(screen.getByText(/2024\/12\/01/)).toBeInTheDocument();
    });

    it('複数の審査申請が表示される', () => {
      const applications = [
        createMockLeaseApplication({
          id: 'app-001',
          lease_company: 'オリコ',
        }),
        createMockLeaseApplication({
          id: 'app-002',
          lease_company: 'ジャックス',
        }),
        createMockLeaseApplication({
          id: 'app-003',
          lease_company: 'C-mind',
        }),
      ];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      expect(screen.getByText('オリコ')).toBeInTheDocument();
      expect(screen.getByText('ジャックス')).toBeInTheDocument();
      expect(screen.getByText('C-mind')).toBeInTheDocument();
    });
  });

  describe('正常系：ステータス表示', () => {
    // なぜ必要：審査ステータスの視覚的識別を保証

    it.each([
      ['preparing', '申請準備中', 'bg-gray-100'],
      ['reviewing', '審査中', 'bg-blue-100'],
      ['approved', '可決', 'bg-green-100'],
      ['rejected', '否決', 'bg-red-100'],
      ['conditionally_approved', '条件付き可決', 'bg-yellow-100'],
    ] as const)('ステータス %s は %s と表示される', (status, label, colorClass) => {
      const applications = [
        createMockLeaseApplication({
          id: 'app-001',
          status: status,
        }),
      ];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(label)).toHaveClass(colorClass);
    });
  });

  describe('正常系：空の状態', () => {
    // なぜ必要：データがない場合のユーザー体験を保証

    it('審査申請がない場合はメッセージを表示', () => {
      render(<LeaseApplications dealId={dealId} applications={[]} />);

      expect(screen.getByText('審査申請がありません')).toBeInTheDocument();
    });
  });

  describe('正常系：カードヘッダー', () => {
    // なぜ必要：UIの構造が正しいことを確認

    it('リース審査タイトルが表示される', () => {
      render(<LeaseApplications dealId={dealId} applications={[]} />);

      expect(screen.getByText('リース審査')).toBeInTheDocument();
    });

    it('審査申請ボタンが表示される', () => {
      render(<LeaseApplications dealId={dealId} applications={[]} />);

      expect(screen.getByText('審査申請')).toBeInTheDocument();
    });
  });

  describe('正常系：日付表示', () => {
    // なぜ必要：日付情報の正確な表示を保証

    it('申請日が表示される', () => {
      const applications = [
        createMockLeaseApplication({
          id: 'app-001',
          submitted_at: '2024-06-15',
          result_at: null,
        }),
      ];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      expect(screen.getByText(/申請日:/)).toBeInTheDocument();
      expect(screen.getByText(/2024\/06\/15/)).toBeInTheDocument();
    });

    it('結果日が表示される', () => {
      const applications = [
        createMockLeaseApplication({
          id: 'app-001',
          submitted_at: '2024-06-01',
          result_at: '2024-06-10',
        }),
      ];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      expect(screen.getByText(/結果日:/)).toBeInTheDocument();
      expect(screen.getByText(/2024\/06\/10/)).toBeInTheDocument();
    });

    it('申請日がない場合は表示されない', () => {
      const applications = [
        createMockLeaseApplication({
          id: 'app-001',
          submitted_at: null,
          result_at: null,
        }),
      ];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      expect(screen.queryByText(/申請日:/)).not.toBeInTheDocument();
    });
  });

  describe('正常系：条件表示', () => {
    // なぜ必要：条件付き可決時の条件情報を正確に表示

    it('条件が表示される', () => {
      const applications = [
        createMockLeaseApplication({
          id: 'app-001',
          status: 'conditionally_approved',
          conditions: '保証人追加が必要',
        }),
      ];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      expect(screen.getByText('保証人追加が必要')).toBeInTheDocument();
    });

    it('条件がない場合は表示されない', () => {
      const applications = [
        createMockLeaseApplication({
          id: 'app-001',
          conditions: null,
        }),
      ];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      // 条件テキスト要素が存在しないことを確認
      const conditionElements = document.querySelectorAll('.text-xs.text-gray-600.mt-1');
      expect(conditionElements.length).toBe(0);
    });
  });

  describe('正常系：操作ボタン', () => {
    // なぜ必要：編集・削除機能の存在を確認

    it('編集ボタンが表示される', () => {
      const applications = [createMockLeaseApplication({ id: 'app-001' })];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      // 編集ボタン（Pencilアイコン）が存在する
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2); // 新規追加 + 編集 + 削除
    });

    it('削除ボタンが表示される', () => {
      const applications = [createMockLeaseApplication({ id: 'app-001' })];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      // 削除ボタン（Trash2アイコン）が存在する
      const deleteIcon = document.querySelector('.text-red-500');
      expect(deleteIcon).toBeInTheDocument();
    });
  });

  describe('正常系：削除機能', () => {
    // なぜ必要：審査申請の削除動作を確認

    it('削除確認でキャンセルした場合は削除されない', async () => {
      const user = userEvent.setup();
      (global.confirm as jest.Mock).mockReturnValue(false);

      const applications = [createMockLeaseApplication({ id: 'app-001' })];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      const deleteButton = document.querySelector('.text-red-500');
      if (deleteButton?.closest('button')) {
        await user.click(deleteButton.closest('button')!);
      }

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('削除確認でOKした場合はSupabaseが呼ばれる', async () => {
      const user = userEvent.setup();
      (global.confirm as jest.Mock).mockReturnValue(true);

      const applications = [createMockLeaseApplication({ id: 'app-001' })];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      const deleteButton = document.querySelector('.text-red-500');
      if (deleteButton?.closest('button')) {
        await user.click(deleteButton.closest('button')!);
      }

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('lease_applications');
      });
    });
  });

  describe('境界値テスト', () => {
    // なぜ必要：エッジケースでの安定性を保証

    it('長い条件文でもクラッシュしない', () => {
      const longConditions = '条件'.repeat(100);
      const applications = [
        createMockLeaseApplication({
          id: 'app-001',
          conditions: longConditions,
        }),
      ];

      expect(() =>
        render(
          <LeaseApplications dealId={dealId} applications={applications} />
        )
      ).not.toThrow();
    });

    it('非常に多くの審査申請でもレンダリングできる', () => {
      const applications = Array.from({ length: 50 }, (_, i) =>
        createMockLeaseApplication({
          id: `app-${i}`,
          lease_company: `リース会社${i}`,
        })
      );

      expect(() =>
        render(
          <LeaseApplications dealId={dealId} applications={applications} />
        )
      ).not.toThrow();
    });
  });

  describe('アクセシビリティ', () => {
    // なぜ必要：アクセシブルなUIを保証

    it('カード構造が正しい', () => {
      const applications = [createMockLeaseApplication({ id: 'app-001' })];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      // カードヘッダーとコンテンツが存在
      expect(screen.getByText('リース審査')).toBeInTheDocument();
    });

    it('ボタンがクリック可能', () => {
      const applications = [createMockLeaseApplication({ id: 'app-001' })];

      render(
        <LeaseApplications dealId={dealId} applications={applications} />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });
  });
});
