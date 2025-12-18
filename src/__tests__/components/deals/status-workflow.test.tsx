/**
 * StatusWorkflowコンポーネントのテスト
 *
 * なぜこのテストが必要か：
 * - ステータスワークフローは案件の進捗管理の中核
 * - フェーズ遷移の視覚的表示を保証
 * - ステータス変更機能の動作を検証
 */
import { render, screen, waitFor } from '../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { StatusWorkflow } from '@/components/features/deals/status-workflow';
import { createMockDeal } from '../../utils/test-utils';

// Supabaseモックの参照を取得
const mockSupabase = {
  from: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('StatusWorkflowコンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系：フェーズ表示', () => {
    // なぜ必要：フェーズの進行状況を正確に表示

    it('すべてのフェーズラベルが表示される', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'in_negotiation',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('営業フェーズ')).toBeInTheDocument();
      expect(screen.getByText('契約フェーズ')).toBeInTheDocument();
      expect(screen.getByText('工事フェーズ')).toBeInTheDocument();
      expect(screen.getByText('完了フェーズ')).toBeInTheDocument();
    });

    it('営業フェーズの案件では営業フェーズがアクティブ', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'in_negotiation',
      });

      render(<StatusWorkflow deal={deal} />);

      // 「営業フェーズのステータス」というタイトルが表示される
      expect(screen.getByText('営業フェーズのステータス')).toBeInTheDocument();
    });

    it('契約フェーズの案件では契約フェーズがアクティブ', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'document_collection',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('契約フェーズのステータス')).toBeInTheDocument();
    });

    it('工事フェーズの案件では工事フェーズがアクティブ', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'survey_scheduling',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('工事フェーズのステータス')).toBeInTheDocument();
    });

    it('完了フェーズの案件では完了フェーズがアクティブ', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'delivery_completed',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('完了フェーズのステータス')).toBeInTheDocument();
    });
  });

  describe('正常系：営業フェーズのステータス', () => {
    // なぜ必要：営業フェーズ内のすべてのステータスが選択可能であることを保証

    it('営業フェーズのすべてのステータスボタンが表示される', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'appointment_acquired',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('アポ獲得')).toBeInTheDocument();
      expect(screen.getByText('商談中')).toBeInTheDocument();
      expect(screen.getByText('見積提出')).toBeInTheDocument();
      expect(screen.getByText('商談成立')).toBeInTheDocument();
      expect(screen.getByText('失注')).toBeInTheDocument();
    });
  });

  describe('正常系：契約フェーズのステータス', () => {
    // なぜ必要：契約フェーズ内のすべてのステータスが選択可能であることを保証

    it('契約フェーズのすべてのステータスボタンが表示される', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'contract_type_selection',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('契約種別選択')).toBeInTheDocument();
      expect(screen.getByText('書類収集中')).toBeInTheDocument();
      expect(screen.getByText('審査依頼中')).toBeInTheDocument();
      expect(screen.getByText('審査待ち')).toBeInTheDocument();
      expect(screen.getByText('可決')).toBeInTheDocument();
      expect(screen.getByText('否決')).toBeInTheDocument();
    });
  });

  describe('正常系：工事フェーズのステータス', () => {
    // なぜ必要：工事フェーズ内のすべてのステータスが選択可能であることを保証

    it('工事フェーズのすべてのステータスボタンが表示される', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'survey_scheduling',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('下見調整中')).toBeInTheDocument();
      expect(screen.getByText('下見完了')).toBeInTheDocument();
      expect(screen.getByText('工事調整中')).toBeInTheDocument();
      expect(screen.getByText('工事完了')).toBeInTheDocument();
    });
  });

  describe('正常系：完了フェーズのステータス', () => {
    // なぜ必要：完了フェーズ内のすべてのステータスが選択可能であることを保証

    it('完了フェーズのすべてのステータスボタンが表示される', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'delivery_completed',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('納品完了')).toBeInTheDocument();
      expect(screen.getByText('入金待ち')).toBeInTheDocument();
      expect(screen.getByText('完了')).toBeInTheDocument();
    });
  });

  describe('正常系：現在のステータスの強調表示', () => {
    // なぜ必要：現在のステータスが視覚的に識別できることを保証

    it('現在のステータスボタンはdisabled状態', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'in_negotiation',
      });

      render(<StatusWorkflow deal={deal} />);

      const currentStatusButton = screen.getByRole('button', { name: '商談中' });
      expect(currentStatusButton).toBeDisabled();
    });

    it('他のステータスボタンはクリック可能', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'in_negotiation',
      });

      render(<StatusWorkflow deal={deal} />);

      const otherStatusButton = screen.getByRole('button', {
        name: 'アポ獲得',
      });
      expect(otherStatusButton).not.toBeDisabled();
    });
  });

  describe('正常系：ステータス変更', () => {
    // なぜ必要：ステータス変更が正しく動作することを保証

    it('ステータスボタンをクリックするとSupabaseが呼ばれる', async () => {
      const user = userEvent.setup();
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'appointment_acquired',
      });

      render(<StatusWorkflow deal={deal} />);

      const nextStatusButton = screen.getByRole('button', { name: '商談中' });
      await user.click(nextStatusButton);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('deals');
      });
    });
  });

  describe('正常系：次のフェーズへ進むボタン', () => {
    // なぜ必要：フェーズ間の遷移が可能であることを保証

    it('最終フェーズ以外では「次のフェーズへ進む」ボタンが表示される', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'deal_won',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('契約フェーズへ進む')).toBeInTheDocument();
    });

    it('契約フェーズでは「工事フェーズへ進む」ボタンが表示される', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'review_approved',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('工事フェーズへ進む')).toBeInTheDocument();
    });

    it('工事フェーズでは「完了フェーズへ進む」ボタンが表示される', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'installation_completed',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('完了フェーズへ進む')).toBeInTheDocument();
    });

    it('完了フェーズでは「次のフェーズへ進む」ボタンが表示されない', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'completed',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.queryByText(/へ進む/)).not.toBeInTheDocument();
    });

    it('次のフェーズへ進むボタンをクリックするとSupabaseが呼ばれる', async () => {
      const user = userEvent.setup();
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'deal_won',
      });

      render(<StatusWorkflow deal={deal} />);

      const nextPhaseButton = screen.getByText('契約フェーズへ進む');
      await user.click(nextPhaseButton);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('deals');
      });
    });
  });

  describe('正常系：フェーズ進行インジケーター', () => {
    // なぜ必要：フェーズの完了状態が視覚的に表示されることを保証

    it('ステータスカードタイトルが表示される', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'in_negotiation',
      });

      render(<StatusWorkflow deal={deal} />);

      expect(screen.getByText('ステータス')).toBeInTheDocument();
    });
  });

  describe('境界値テスト', () => {
    // なぜ必要：エッジケースでの安定性を保証

    it('各フェーズの最初のステータスでも正常にレンダリングされる', () => {
      const statuses = [
        'appointment_acquired',
        'contract_type_selection',
        'survey_scheduling',
        'delivery_completed',
      ];

      statuses.forEach((status) => {
        const deal = createMockDeal({
          id: 'deal-001',
          status,
        });

        expect(() => render(<StatusWorkflow deal={deal} />)).not.toThrow();
      });
    });

    it('各フェーズの最後のステータスでも正常にレンダリングされる', () => {
      const statuses = [
        'deal_lost',
        'review_rejected',
        'installation_completed',
        'completed',
      ];

      statuses.forEach((status) => {
        const deal = createMockDeal({
          id: 'deal-001',
          status,
        });

        expect(() => render(<StatusWorkflow deal={deal} />)).not.toThrow();
      });
    });
  });

  describe('アクセシビリティ', () => {
    // なぜ必要：アクセシブルなUIを保証

    it('ステータスボタンがすべてクリック可能な構造', () => {
      const deal = createMockDeal({
        id: 'deal-001',
        status: 'in_negotiation',
      });

      render(<StatusWorkflow deal={deal} />);

      const buttons = screen.getAllByRole('button');
      // 現在のステータス以外はすべてクリック可能
      const enabledButtons = buttons.filter(
        (button) => !button.hasAttribute('disabled')
      );
      expect(enabledButtons.length).toBeGreaterThan(0);
    });
  });
});
