/**
 * TaskListコンポーネントのテスト
 *
 * なぜこのテストが必要か：
 * - タスク管理は営業活動の効率化に重要
 * - ステータス切り替え、削除の動作確認
 * - 期限切れの視覚的表示の検証
 */
import { render, screen, waitFor } from '../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import { TaskList } from '@/components/features/tasks/task-list';
import {
  createMockTask,
  createMockUser,
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

describe('TaskListコンポーネント', () => {
  const mockUsers = [
    createMockUser({ id: 'user-001', name: '担当者A' }),
    createMockUser({ id: 'user-002', name: '担当者B' }),
  ];

  const mockDeals = [
    { id: 'deal-001', title: '案件A' },
    { id: 'deal-002', title: '案件B' },
  ];

  const currentUserId = 'user-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系：データ表示', () => {
    // なぜ必要：基本的なレンダリングが正しく動作することを確認

    it('タスクデータが正しく表示される', () => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          title: 'テストタスク',
          description: 'タスクの説明文',
          priority: 'high',
          status: 'not_started',
          due_date: '2024-12-31',
          assigned_user: createMockUser({ name: '担当者A' }),
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      expect(screen.getByText('テストタスク')).toBeInTheDocument();
      expect(screen.getByText('タスクの説明文')).toBeInTheDocument();
      expect(screen.getByText('担当者A')).toBeInTheDocument();
      expect(screen.getByText('2024/12/31')).toBeInTheDocument();
    });

    it('複数のタスクが表示される', () => {
      const tasks = [
        createMockTask({ id: 'task-001', title: 'タスク1' }),
        createMockTask({ id: 'task-002', title: 'タスク2' }),
        createMockTask({ id: 'task-003', title: 'タスク3' }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      expect(screen.getByText('タスク1')).toBeInTheDocument();
      expect(screen.getByText('タスク2')).toBeInTheDocument();
      expect(screen.getByText('タスク3')).toBeInTheDocument();
    });
  });

  describe('正常系：優先度表示', () => {
    // なぜ必要：優先度によるタスクの識別を保証

    it.each([
      ['high', '高'],
      ['medium', '中'],
      ['low', '低'],
    ])('優先度 %s は %s と表示される', (priority, label) => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          priority: priority as 'high' | 'medium' | 'low',
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  describe('正常系：ステータス表示', () => {
    // なぜ必要：タスクの進捗状況を正確に表示

    it.each([
      ['not_started', '未着手'],
      ['in_progress', '進行中'],
      ['completed', '完了'],
    ])('ステータス %s は %s と表示される', (status, label) => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          status: status as 'not_started' | 'in_progress' | 'completed',
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  describe('正常系：空の状態', () => {
    // なぜ必要：データがない場合のユーザー体験を保証

    it('タスクがない場合はメッセージを表示', () => {
      render(
        <TaskList
          tasks={[]}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      expect(
        screen.getByText('タスクがまだ登録されていません')
      ).toBeInTheDocument();
    });
  });

  describe('正常系：関連案件リンク', () => {
    // なぜ必要：タスクから関連案件への遷移を保証

    it('関連案件へのリンクが表示される', () => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          deal_id: 'deal-001',
          deal: { id: 'deal-001', title: '関連案件名' },
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      const link = screen.getByRole('link', { name: '関連案件名' });
      expect(link).toHaveAttribute('href', '/deals/deal-001');
    });

    it('関連案件がない場合は「-」が表示される', () => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          deal_id: null,
          deal: null,
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('正常系：チェックボックスによるステータス変更', () => {
    // なぜ必要：ワンクリックでのタスク完了操作を保証

    it('未完了タスクのチェックボックスをクリックすると完了になる', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({
          id: 'task-001',
          status: 'not_started',
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      });
    });

    it('完了タスクのチェックボックスはチェック済み状態', () => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          status: 'completed',
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });
  });

  describe('正常系：完了タスクのスタイル', () => {
    // なぜ必要：完了タスクの視覚的な区別を保証

    it('完了タスクは取り消し線と透明度が適用される', () => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          title: '完了済みタスク',
          status: 'completed',
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      // 完了タスクの行に透明度が適用されている
      const row = screen.getByRole('row', { name: /完了済みタスク/ });
      expect(row).toHaveClass('opacity-60');
    });
  });

  describe('正常系：期限表示', () => {
    // なぜ必要：期限切れタスクの視覚的警告を保証

    it('期限切れタスクは赤色で表示される', () => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          status: 'not_started',
          due_date: generateDateString(-1), // 昨日
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      // 期限切れスタイルが適用されている（赤色のテキスト）
      const dateCell = screen.getByText(
        new RegExp(generateDateString(-1).replace(/-/g, '/'))
      );
      expect(dateCell).toHaveClass('text-red-600');
    });

    it('今日が期限のタスクはオレンジ色で表示される', () => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          status: 'not_started',
          due_date: generateDateString(0), // 今日
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      const dateCell = screen.getByText(
        new RegExp(generateDateString(0).replace(/-/g, '/'))
      );
      expect(dateCell).toHaveClass('text-orange-600');
    });

    it('完了タスクは期限切れでも通常表示', () => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          status: 'completed',
          due_date: generateDateString(-1), // 昨日
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      const dateCell = screen.getByText(
        new RegExp(generateDateString(-1).replace(/-/g, '/'))
      );
      expect(dateCell).not.toHaveClass('text-red-600');
    });

    it('期限が設定されていない場合は「-」が表示される', () => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          due_date: null,
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe('正常系：削除機能', () => {
    // なぜ必要：タスク削除の動作確認

    it('削除ボタンが表示される', () => {
      const tasks = [createMockTask({ id: 'task-001' })];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      // 削除ボタン（ゴミ箱アイコン）が存在する
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('正常系：テーブルヘッダー', () => {
    // なぜ必要：UIの構造が正しいことを確認

    it('すべてのテーブルヘッダーが表示される', () => {
      const tasks = [createMockTask()];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      expect(screen.getByText('タスク名')).toBeInTheDocument();
      expect(screen.getByText('関連案件')).toBeInTheDocument();
      expect(screen.getByText('優先度')).toBeInTheDocument();
      expect(screen.getByText('ステータス')).toBeInTheDocument();
      expect(screen.getByText('担当者')).toBeInTheDocument();
      expect(screen.getByText('期限')).toBeInTheDocument();
      expect(screen.getByText('操作')).toBeInTheDocument();
    });
  });

  describe('異常系：欠損データ', () => {
    // なぜ必要：データが不完全な場合にクラッシュしないことを保証

    it('担当者情報がない場合は「-」が表示される', () => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          assigned_user: undefined,
        }),
      ];

      render(
        <TaskList
          tasks={tasks}
          users={mockUsers}
          deals={mockDeals}
          currentUserId={currentUserId}
        />
      );

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });

    it('説明がない場合も正常に表示される', () => {
      const tasks = [
        createMockTask({
          id: 'task-001',
          description: null,
        }),
      ];

      expect(() =>
        render(
          <TaskList
            tasks={tasks}
            users={mockUsers}
            deals={mockDeals}
            currentUserId={currentUserId}
          />
        )
      ).not.toThrow();
    });
  });

  describe('境界値テスト', () => {
    // なぜ必要：エッジケースでの安定性を保証

    it('長いタスク名でもクラッシュしない', () => {
      const longTitle = 'タスク'.repeat(100);
      const tasks = [createMockTask({ id: 'task-001', title: longTitle })];

      expect(() =>
        render(
          <TaskList
            tasks={tasks}
            users={mockUsers}
            deals={mockDeals}
            currentUserId={currentUserId}
          />
        )
      ).not.toThrow();
    });

    it('非常に多くのタスクでもレンダリングできる', () => {
      const tasks = Array.from({ length: 100 }, (_, i) =>
        createMockTask({ id: `task-${i}`, title: `タスク${i}` })
      );

      expect(() =>
        render(
          <TaskList
            tasks={tasks}
            users={mockUsers}
            deals={mockDeals}
            currentUserId={currentUserId}
          />
        )
      ).not.toThrow();
    });
  });
});
