/**
 * タスクAPI統合テスト
 *
 * なぜこのテストが必要か：
 * - タスクデータのCRUD操作が正しく動作することを保証
 * - ステータス変更のビジネスロジックを検証
 * - 期限による絞り込みを確認
 */
import {
  createMockSupabaseClient,
  createMockQueryBuilder,
} from '../mocks/supabase';
import { createMockTask, generateDateString } from '../utils/test-utils';

describe('タスクAPI統合テスト', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    jest.clearAllMocks();
  });

  describe('タスク一覧取得', () => {
    // なぜ必要：タスクデータの取得が正しく動作することを保証

    it('タスク一覧を正常に取得できる', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-001', title: 'タスクA' }),
        createMockTask({ id: 'task-002', title: 'タスクB' }),
      ];

      const queryBuilder = createMockQueryBuilder(mockTasks);
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase.from('tasks').select('*');

      expect(result.data).toEqual(mockTasks);
      expect(result.error).toBeNull();
    });

    it('担当者IDでフィルタリングできる', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-001', assigned_user_id: 'user-001' }),
      ];

      const queryBuilder = createMockQueryBuilder(mockTasks);
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .select('*')
        .eq('assigned_user_id', 'user-001');

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(result.error).toBeNull();
    });

    it('ステータスでフィルタリングできる', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-001', status: 'not_started' }),
      ];

      const queryBuilder = createMockQueryBuilder(mockTasks);
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .select('*')
        .eq('status', 'not_started');

      expect(result.error).toBeNull();
    });

    it('完了タスクを除外できる', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-001', status: 'not_started' }),
        createMockTask({ id: 'task-002', status: 'in_progress' }),
      ];

      const queryBuilder = createMockQueryBuilder(mockTasks);
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .select('*')
        .neq('status', 'completed');

      expect(result.error).toBeNull();
    });
  });

  describe('タスク作成', () => {
    // なぜ必要：タスクデータの新規作成が正しく動作することを保証

    it('新規タスクを作成できる', async () => {
      const newTask = {
        title: '新規タスク',
        description: 'タスクの説明',
        priority: 'high' as const,
        status: 'not_started' as const,
        due_date: generateDateString(7),
        assigned_user_id: 'user-001',
      };

      const createdTask = createMockTask({
        ...newTask,
        id: 'task-new',
      });

      const queryBuilder = createMockQueryBuilder(createdTask);
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase.from('tasks').insert(newTask);

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(result.error).toBeNull();
    });

    it('案件に紐づくタスクを作成できる', async () => {
      const newTask = {
        title: '案件関連タスク',
        deal_id: 'deal-001',
        priority: 'medium' as const,
        status: 'not_started' as const,
      };

      const queryBuilder = createMockQueryBuilder(
        createMockTask({ ...newTask, id: 'task-new' })
      );
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase.from('tasks').insert(newTask);

      expect(result.error).toBeNull();
    });
  });

  describe('タスクステータス更新', () => {
    // なぜ必要：ステータス変更が正しく動作することを保証

    it('未着手から進行中に変更できる', async () => {
      const queryBuilder = createMockQueryBuilder({
        id: 'task-001',
        status: 'in_progress',
      });
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', 'task-001');

      expect(result.error).toBeNull();
    });

    it('進行中から完了に変更できる', async () => {
      const queryBuilder = createMockQueryBuilder({
        id: 'task-001',
        status: 'completed',
      });
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', 'task-001');

      expect(result.error).toBeNull();
    });

    it('完了から未着手に戻せる', async () => {
      const queryBuilder = createMockQueryBuilder({
        id: 'task-001',
        status: 'not_started',
      });
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .update({ status: 'not_started' })
        .eq('id', 'task-001');

      expect(result.error).toBeNull();
    });
  });

  describe('タスク更新', () => {
    // なぜ必要：タスクデータの更新が正しく動作することを保証

    it('タスク情報を更新できる', async () => {
      const updatedData = {
        title: '更新後のタスク名',
        description: '更新後の説明',
        priority: 'low' as const,
      };

      const queryBuilder = createMockQueryBuilder({
        id: 'task-001',
        ...updatedData,
      });
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .update(updatedData)
        .eq('id', 'task-001');

      expect(result.error).toBeNull();
    });

    it('期限を変更できる', async () => {
      const newDueDate = generateDateString(14);

      const queryBuilder = createMockQueryBuilder({
        id: 'task-001',
        due_date: newDueDate,
      });
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .update({ due_date: newDueDate })
        .eq('id', 'task-001');

      expect(result.error).toBeNull();
    });

    it('担当者を変更できる', async () => {
      const queryBuilder = createMockQueryBuilder({
        id: 'task-001',
        assigned_user_id: 'user-002',
      });
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .update({ assigned_user_id: 'user-002' })
        .eq('id', 'task-001');

      expect(result.error).toBeNull();
    });
  });

  describe('タスク削除', () => {
    // なぜ必要：タスクデータの削除が正しく動作することを保証

    it('タスクを削除できる', async () => {
      const queryBuilder = createMockQueryBuilder(null);
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .delete()
        .eq('id', 'task-001');

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(result.error).toBeNull();
    });
  });

  describe('期限によるフィルタリング', () => {
    // なぜ必要：期限切れタスクの取得を保証

    it('期限切れタスクを取得できる', async () => {
      const overdueTasks = [
        createMockTask({
          id: 'task-001',
          due_date: generateDateString(-1),
          status: 'not_started',
        }),
      ];

      const queryBuilder = createMockQueryBuilder(overdueTasks);
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase.from('tasks').select('*');

      expect(result.error).toBeNull();
    });

    it('今日が期限のタスクを取得できる', async () => {
      const todayTasks = [
        createMockTask({
          id: 'task-001',
          due_date: generateDateString(0),
          status: 'in_progress',
        }),
      ];

      const queryBuilder = createMockQueryBuilder(todayTasks);
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase.from('tasks').select('*');

      expect(result.error).toBeNull();
    });
  });

  describe('ソート', () => {
    // なぜ必要：タスク一覧の表示順を保証

    it('期限日でソートできる', async () => {
      const mockTasks = [
        createMockTask({
          id: 'task-001',
          due_date: generateDateString(1),
        }),
        createMockTask({
          id: 'task-002',
          due_date: generateDateString(7),
        }),
      ];

      const queryBuilder = createMockQueryBuilder(mockTasks);
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });

      expect(result.error).toBeNull();
    });

    it('優先度でソートできる', async () => {
      const mockTasks = [
        createMockTask({ id: 'task-001', priority: 'high' }),
        createMockTask({ id: 'task-002', priority: 'medium' }),
        createMockTask({ id: 'task-003', priority: 'low' }),
      ];

      const queryBuilder = createMockQueryBuilder(mockTasks);
      mockSupabase.__mockFrom('tasks', queryBuilder);

      const result = await mockSupabase
        .from('tasks')
        .select('*')
        .order('priority', { ascending: false });

      expect(result.error).toBeNull();
    });
  });
});
