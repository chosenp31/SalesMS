/**
 * ActivityListコンポーネントのテスト
 *
 * なぜこのテストが必要か：
 * - 活動履歴は営業プロセスの追跡に重要
 * - 活動タイプ別のアイコン・色の表示を検証
 * - 日時フォーマットの正確性を確認
 */
import { render, screen } from '../../utils/test-utils';
import { ActivityList } from '@/components/features/activities/activity-list';
import { createMockActivity, createMockUser } from '../../utils/test-utils';

describe('ActivityListコンポーネント', () => {
  describe('正常系：データ表示', () => {
    // なぜ必要：基本的なレンダリングが正しく動作することを確認

    it('活動データが正しく表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          activity_type: 'phone',
          content: 'テスト電話の内容',
          user: createMockUser({ name: '担当者A' }),
          created_at: '2024-12-15T10:30:00Z',
        }),
      ];

      render(<ActivityList activities={activities} />);

      expect(screen.getByText('電話')).toBeInTheDocument();
      expect(screen.getByText('テスト電話の内容')).toBeInTheDocument();
      expect(screen.getByText('担当者A')).toBeInTheDocument();
      expect(screen.getByText(/2024\/12\/15/)).toBeInTheDocument();
    });

    it('複数の活動データが表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          content: '活動内容1',
          activity_type: 'phone',
        }),
        createMockActivity({
          id: 'activity-002',
          content: '活動内容2',
          activity_type: 'visit',
        }),
        createMockActivity({
          id: 'activity-003',
          content: '活動内容3',
          activity_type: 'email',
        }),
      ];

      render(<ActivityList activities={activities} />);

      expect(screen.getByText('活動内容1')).toBeInTheDocument();
      expect(screen.getByText('活動内容2')).toBeInTheDocument();
      expect(screen.getByText('活動内容3')).toBeInTheDocument();
    });
  });

  describe('正常系：活動タイプ表示', () => {
    // なぜ必要：活動タイプの正確な表示と視覚的識別を保証

    it.each([
      ['phone', '電話'],
      ['visit', '訪問'],
      ['email', 'メール'],
      ['online_meeting', 'オンライン商談'],
      ['other', 'その他'],
    ])('活動タイプ %s は %s と表示される', (activityType, label) => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          activity_type: activityType as
            | 'phone'
            | 'visit'
            | 'email'
            | 'online_meeting'
            | 'other',
        }),
      ];

      render(<ActivityList activities={activities} />);

      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  describe('正常系：活動タイプ別カラー', () => {
    // なぜ必要：視覚的な活動タイプの識別を保証

    it('電話活動は青色で表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          activity_type: 'phone',
        }),
      ];

      render(<ActivityList activities={activities} />);

      const iconContainer = document.querySelector('.bg-blue-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('訪問活動は緑色で表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          activity_type: 'visit',
        }),
      ];

      render(<ActivityList activities={activities} />);

      const iconContainer = document.querySelector('.bg-green-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('メール活動は黄色で表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          activity_type: 'email',
        }),
      ];

      render(<ActivityList activities={activities} />);

      const iconContainer = document.querySelector('.bg-yellow-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('オンライン商談は紫色で表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          activity_type: 'online_meeting',
        }),
      ];

      render(<ActivityList activities={activities} />);

      const iconContainer = document.querySelector('.bg-purple-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('その他活動は灰色で表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          activity_type: 'other',
        }),
      ];

      render(<ActivityList activities={activities} />);

      const iconContainer = document.querySelector('.bg-gray-100');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('正常系：空の状態', () => {
    // なぜ必要：データがない場合のユーザー体験を保証

    it('活動履歴がない場合はメッセージを表示', () => {
      render(<ActivityList activities={[]} />);

      expect(screen.getByText('活動履歴がありません')).toBeInTheDocument();
    });
  });

  describe('正常系：日時表示', () => {
    // なぜ必要：日時フォーマットの正確性を保証

    it('日時が正しいフォーマットで表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          created_at: '2024-06-15T14:30:00Z',
        }),
      ];

      render(<ActivityList activities={activities} />);

      // 日本語ロケールでフォーマット: yyyy/MM/dd HH:mm
      // UTCからJST変換後の時刻が表示される
      expect(screen.getByText(/2024\/06\/15/)).toBeInTheDocument();
    });
  });

  describe('正常系：担当者表示', () => {
    // なぜ必要：活動の実施者を正確に表示

    it('担当者名が表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          user: createMockUser({ name: '営業担当者' }),
        }),
      ];

      render(<ActivityList activities={activities} />);

      expect(screen.getByText('営業担当者')).toBeInTheDocument();
    });

    it('担当者情報がない場合は「不明」と表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          user: undefined,
        }),
      ];

      render(<ActivityList activities={activities} />);

      expect(screen.getByText('不明')).toBeInTheDocument();
    });
  });

  describe('正常系：コンテンツ表示', () => {
    // なぜ必要：活動内容の完全な表示を保証

    it('改行を含む内容が正しく表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          content: '1行目\n2行目\n3行目',
        }),
      ];

      render(<ActivityList activities={activities} />);

      // whitespace-pre-wrapにより改行が保持される
      const contentElement = screen.getByText(/1行目/);
      expect(contentElement).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('境界値テスト', () => {
    // なぜ必要：エッジケースでの安定性を保証

    it('長い活動内容でもクラッシュしない', () => {
      const longContent = '活動内容'.repeat(100);
      const activities = [
        createMockActivity({
          id: 'activity-001',
          content: longContent,
        }),
      ];

      expect(() => render(<ActivityList activities={activities} />)).not.toThrow();
    });

    it('非常に多くの活動データでもレンダリングできる', () => {
      const activities = Array.from({ length: 100 }, (_, i) =>
        createMockActivity({
          id: `activity-${i}`,
          content: `活動内容${i}`,
        })
      );

      expect(() => render(<ActivityList activities={activities} />)).not.toThrow();
    });

    it('特殊文字を含む内容も表示される', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          content: '<script>alert("test")</script>',
        }),
      ];

      render(<ActivityList activities={activities} />);

      // XSS対策：HTMLがエスケープされてテキストとして表示される
      expect(
        screen.getByText('<script>alert("test")</script>')
      ).toBeInTheDocument();
    });

    it('空の内容でもクラッシュしない', () => {
      const activities = [
        createMockActivity({
          id: 'activity-001',
          content: '',
        }),
      ];

      expect(() => render(<ActivityList activities={activities} />)).not.toThrow();
    });
  });

  describe('アクセシビリティ', () => {
    // なぜ必要：アクセシブルなUIを保証

    it('活動アイテムのコンテナが存在する', () => {
      const activities = [createMockActivity({ id: 'activity-001' })];

      render(<ActivityList activities={activities} />);

      const container = document.querySelector('.space-y-4');
      expect(container).toBeInTheDocument();
    });

    it('アイコンコンテナが丸形で表示される', () => {
      const activities = [createMockActivity({ id: 'activity-001' })];

      render(<ActivityList activities={activities} />);

      const iconContainer = document.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});
