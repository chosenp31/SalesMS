/**
 * 定数のユニットテスト
 *
 * なぜこのテストが必要か：
 * - 定数はアプリケーション全体で使用される重要な値
 * - ラベルの誤りはUI表示に直接影響する
 * - ステータスマッピングの不整合はワークフローの破綻を招く
 */
import {
  BUSINESS_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
  DEAL_STATUS_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_PHASE_LABELS,
  STATUS_TO_PHASE,
  PHASE_STATUSES,
  ACTIVITY_TYPE_LABELS,
  LEASE_APPLICATION_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  USER_ROLE_LABELS,
  LEASE_COMPANIES,
  PRODUCT_CATEGORIES,
  CONTRACT_MONTHS_OPTIONS,
} from '@/constants';

describe('定数テスト', () => {
  describe('BUSINESS_TYPE_LABELS（事業形態ラベル）', () => {
    // なぜ必要：顧客登録時に正しいラベルが表示されることを保証
    it('すべての事業形態に日本語ラベルが定義されている', () => {
      expect(BUSINESS_TYPE_LABELS.corporation).toBe('法人');
      expect(BUSINESS_TYPE_LABELS.sole_proprietor).toBe('個人事業主');
      expect(BUSINESS_TYPE_LABELS.new_corporation).toBe('新設法人');
    });

    it('定義されている事業形態は3種類である', () => {
      expect(Object.keys(BUSINESS_TYPE_LABELS)).toHaveLength(3);
    });
  });

  describe('CONTRACT_TYPE_LABELS（契約種別ラベル）', () => {
    // なぜ必要：契約登録時に正しい契約種別が選択できることを保証
    it('すべての契約種別に日本語ラベルが定義されている', () => {
      expect(CONTRACT_TYPE_LABELS.lease).toBe('リース');
      expect(CONTRACT_TYPE_LABELS.rental).toBe('レンタル');
      expect(CONTRACT_TYPE_LABELS.installment).toBe('割賦');
    });

    it('定義されている契約種別は3種類である', () => {
      expect(Object.keys(CONTRACT_TYPE_LABELS)).toHaveLength(3);
    });
  });

  describe('DEAL_STATUS_LABELS（商談ステータスラベル）', () => {
    // なぜ必要：商談の状態表示に使用
    it('すべての商談ステータスに日本語ラベルが定義されている', () => {
      expect(DEAL_STATUS_LABELS.active).toBe('進行中');
      expect(DEAL_STATUS_LABELS.won).toBe('成約');
      expect(DEAL_STATUS_LABELS.lost).toBe('失注');
      expect(DEAL_STATUS_LABELS.pending).toBe('保留');
    });

    it('定義されている商談ステータスは4種類である', () => {
      expect(Object.keys(DEAL_STATUS_LABELS)).toHaveLength(4);
    });
  });

  describe('CONTRACT_STATUS_LABELS（契約ステータスラベル）', () => {
    // なぜ必要：ワークフロー画面で正しいステータス名が表示されることを保証
    it('営業フェーズのステータスに日本語ラベルが定義されている', () => {
      expect(CONTRACT_STATUS_LABELS.negotiating).toBe('商談中');
      expect(CONTRACT_STATUS_LABELS.quote_submitted).toBe('見積提出');
      expect(CONTRACT_STATUS_LABELS.accepted).toBe('受注確定');
      expect(CONTRACT_STATUS_LABELS.rejected).toBe('失注');
    });

    it('契約フェーズのステータスに日本語ラベルが定義されている', () => {
      expect(CONTRACT_STATUS_LABELS.document_collection).toBe('書類収集中');
      expect(CONTRACT_STATUS_LABELS.review_requested).toBe('審査依頼中');
      expect(CONTRACT_STATUS_LABELS.review_pending).toBe('審査待ち');
      expect(CONTRACT_STATUS_LABELS.review_approved).toBe('可決');
      expect(CONTRACT_STATUS_LABELS.review_rejected).toBe('否決');
    });

    it('工事フェーズのステータスに日本語ラベルが定義されている', () => {
      expect(CONTRACT_STATUS_LABELS.survey_scheduling).toBe('下見調整中');
      expect(CONTRACT_STATUS_LABELS.survey_completed).toBe('下見完了');
      expect(CONTRACT_STATUS_LABELS.installation_scheduling).toBe('工事調整中');
      expect(CONTRACT_STATUS_LABELS.installation_completed).toBe('工事完了');
    });

    it('完了フェーズのステータスに日本語ラベルが定義されている', () => {
      expect(CONTRACT_STATUS_LABELS.delivered).toBe('納品完了');
      expect(CONTRACT_STATUS_LABELS.payment_pending).toBe('入金待ち');
      expect(CONTRACT_STATUS_LABELS.completed).toBe('完了');
    });

    it('全16種類のステータスが定義されている', () => {
      expect(Object.keys(CONTRACT_STATUS_LABELS)).toHaveLength(16);
    });
  });

  describe('CONTRACT_PHASE_LABELS（契約フェーズラベル）', () => {
    // なぜ必要：ワークフロー進行状況の表示に使用
    it('すべてのフェーズに日本語ラベルが定義されている', () => {
      expect(CONTRACT_PHASE_LABELS.sales).toBe('営業フェーズ');
      expect(CONTRACT_PHASE_LABELS.contract).toBe('契約フェーズ');
      expect(CONTRACT_PHASE_LABELS.installation).toBe('工事フェーズ');
      expect(CONTRACT_PHASE_LABELS.completion).toBe('完了フェーズ');
    });

    it('定義されているフェーズは4種類である', () => {
      expect(Object.keys(CONTRACT_PHASE_LABELS)).toHaveLength(4);
    });
  });

  describe('STATUS_TO_PHASE（ステータスからフェーズへのマッピング）', () => {
    // なぜ必要：ステータスが正しいフェーズに属していることを保証
    // これが壊れるとワークフローの進行状況表示が崩壊する

    it('営業フェーズのステータスが正しくマッピングされている', () => {
      const salesStatuses = [
        'negotiating',
        'quote_submitted',
        'accepted',
        'rejected',
      ];
      salesStatuses.forEach((status) => {
        expect(STATUS_TO_PHASE[status]).toBe('sales');
      });
    });

    it('契約フェーズのステータスが正しくマッピングされている', () => {
      const contractStatuses = [
        'document_collection',
        'review_requested',
        'review_pending',
        'review_approved',
        'review_rejected',
      ];
      contractStatuses.forEach((status) => {
        expect(STATUS_TO_PHASE[status]).toBe('contract');
      });
    });

    it('工事フェーズのステータスが正しくマッピングされている', () => {
      const installationStatuses = [
        'survey_scheduling',
        'survey_completed',
        'installation_scheduling',
        'installation_completed',
      ];
      installationStatuses.forEach((status) => {
        expect(STATUS_TO_PHASE[status]).toBe('installation');
      });
    });

    it('完了フェーズのステータスが正しくマッピングされている', () => {
      const completionStatuses = [
        'delivered',
        'payment_pending',
        'completed',
      ];
      completionStatuses.forEach((status) => {
        expect(STATUS_TO_PHASE[status]).toBe('completion');
      });
    });

    it('CONTRACT_STATUS_LABELSの全ステータスがマッピングされている', () => {
      const statusKeys = Object.keys(CONTRACT_STATUS_LABELS);
      const mappedStatuses = Object.keys(STATUS_TO_PHASE);

      statusKeys.forEach((status) => {
        expect(mappedStatuses).toContain(status);
      });
    });
  });

  describe('PHASE_STATUSES（フェーズ内ステータス一覧）', () => {
    // なぜ必要：各フェーズ内で選択可能なステータスの定義

    it('営業フェーズには4つのステータスが含まれる', () => {
      expect(PHASE_STATUSES.sales).toHaveLength(4);
      expect(PHASE_STATUSES.sales).toContain('negotiating');
      expect(PHASE_STATUSES.sales).toContain('rejected');
    });

    it('契約フェーズには5つのステータスが含まれる', () => {
      expect(PHASE_STATUSES.contract).toHaveLength(5);
      expect(PHASE_STATUSES.contract).toContain('review_approved');
      expect(PHASE_STATUSES.contract).toContain('review_rejected');
    });

    it('工事フェーズには4つのステータスが含まれる', () => {
      expect(PHASE_STATUSES.installation).toHaveLength(4);
      expect(PHASE_STATUSES.installation).toContain('installation_completed');
    });

    it('完了フェーズには3つのステータスが含まれる', () => {
      expect(PHASE_STATUSES.completion).toHaveLength(3);
      expect(PHASE_STATUSES.completion).toContain('completed');
    });

    it('各フェーズのステータスはSTATUS_TO_PHASEと整合性がある', () => {
      Object.entries(PHASE_STATUSES).forEach(([phase, statuses]) => {
        statuses.forEach((status) => {
          expect(STATUS_TO_PHASE[status]).toBe(phase);
        });
      });
    });
  });

  describe('ACTIVITY_TYPE_LABELS（活動種別ラベル）', () => {
    // なぜ必要：活動履歴の種別表示に使用
    it('すべての活動種別に日本語ラベルが定義されている', () => {
      expect(ACTIVITY_TYPE_LABELS.phone).toBe('電話');
      expect(ACTIVITY_TYPE_LABELS.visit).toBe('訪問');
      expect(ACTIVITY_TYPE_LABELS.email).toBe('メール');
      expect(ACTIVITY_TYPE_LABELS.online_meeting).toBe('オンライン商談');
      expect(ACTIVITY_TYPE_LABELS.other).toBe('その他');
    });

    it('定義されている活動種別は5種類である', () => {
      expect(Object.keys(ACTIVITY_TYPE_LABELS)).toHaveLength(5);
    });
  });

  describe('LEASE_APPLICATION_STATUS_LABELS（リース審査ステータスラベル）', () => {
    // なぜ必要：リース審査の進捗表示に使用
    it('すべてのリース審査ステータスに日本語ラベルが定義されている', () => {
      expect(LEASE_APPLICATION_STATUS_LABELS.preparing).toBe('申請準備中');
      expect(LEASE_APPLICATION_STATUS_LABELS.reviewing).toBe('審査中');
      expect(LEASE_APPLICATION_STATUS_LABELS.approved).toBe('可決');
      expect(LEASE_APPLICATION_STATUS_LABELS.rejected).toBe('否決');
      expect(LEASE_APPLICATION_STATUS_LABELS.conditionally_approved).toBe('条件付き可決');
    });

    it('定義されているリース審査ステータスは5種類である', () => {
      expect(Object.keys(LEASE_APPLICATION_STATUS_LABELS)).toHaveLength(5);
    });
  });

  describe('PAYMENT_STATUS_LABELS（入金ステータスラベル）', () => {
    // なぜ必要：入金管理画面のステータス表示に使用
    it('すべての入金ステータスに日本語ラベルが定義されている', () => {
      expect(PAYMENT_STATUS_LABELS.pending).toBe('未入金');
      expect(PAYMENT_STATUS_LABELS.paid).toBe('入金済');
    });

    it('定義されている入金ステータスは2種類である', () => {
      expect(Object.keys(PAYMENT_STATUS_LABELS)).toHaveLength(2);
    });
  });

  describe('PAYMENT_TYPE_LABELS（入金種別ラベル）', () => {
    // なぜ必要：入金種別の表示に使用
    it('すべての入金種別に日本語ラベルが定義されている', () => {
      expect(PAYMENT_TYPE_LABELS.initial).toBe('初回');
      expect(PAYMENT_TYPE_LABELS.monthly).toBe('月額');
      expect(PAYMENT_TYPE_LABELS.final).toBe('最終');
      expect(PAYMENT_TYPE_LABELS.other).toBe('その他');
    });

    it('定義されている入金種別は4種類である', () => {
      expect(Object.keys(PAYMENT_TYPE_LABELS)).toHaveLength(4);
    });
  });

  describe('TASK_STATUS_LABELS（タスクステータスラベル）', () => {
    // なぜ必要：タスク管理画面のステータス表示に使用
    it('すべてのタスクステータスに日本語ラベルが定義されている', () => {
      expect(TASK_STATUS_LABELS.not_started).toBe('未着手');
      expect(TASK_STATUS_LABELS.in_progress).toBe('進行中');
      expect(TASK_STATUS_LABELS.completed).toBe('完了');
    });

    it('定義されているタスクステータスは3種類である', () => {
      expect(Object.keys(TASK_STATUS_LABELS)).toHaveLength(3);
    });
  });

  describe('TASK_PRIORITY_LABELS（タスク優先度ラベル）', () => {
    // なぜ必要：タスクの重要度表示に使用
    it('すべてのタスク優先度に日本語ラベルが定義されている', () => {
      expect(TASK_PRIORITY_LABELS.high).toBe('高');
      expect(TASK_PRIORITY_LABELS.medium).toBe('中');
      expect(TASK_PRIORITY_LABELS.low).toBe('低');
    });

    it('定義されているタスク優先度は3種類である', () => {
      expect(Object.keys(TASK_PRIORITY_LABELS)).toHaveLength(3);
    });
  });

  describe('USER_ROLE_LABELS（ユーザーロールラベル）', () => {
    // なぜ必要：ユーザー管理画面の権限表示に使用
    it('すべてのユーザーロールに日本語ラベルが定義されている', () => {
      expect(USER_ROLE_LABELS.admin).toBe('管理者');
      expect(USER_ROLE_LABELS.manager).toBe('マネージャー');
      expect(USER_ROLE_LABELS.sales).toBe('営業');
    });

    it('定義されているユーザーロールは3種類である', () => {
      expect(Object.keys(USER_ROLE_LABELS)).toHaveLength(3);
    });
  });

  describe('LEASE_COMPANIES（リース会社リスト）', () => {
    // なぜ必要：リース会社選択ドロップダウンに使用
    it('リース会社リストに必要な会社が含まれている', () => {
      expect(LEASE_COMPANIES).toContain('C-mind');
      expect(LEASE_COMPANIES).toContain('オリコ');
      expect(LEASE_COMPANIES).toContain('ジャックス');
      expect(LEASE_COMPANIES).toContain('その他');
    });

    it('定義されているリース会社は4社である', () => {
      expect(LEASE_COMPANIES).toHaveLength(4);
    });
  });

  describe('PRODUCT_CATEGORIES（商品カテゴリリスト）', () => {
    // なぜ必要：契約登録時の商品カテゴリ選択に使用
    it('商品カテゴリリストに必要なカテゴリが含まれている', () => {
      expect(PRODUCT_CATEGORIES).toContain('複合機');
      expect(PRODUCT_CATEGORIES).toContain('ビジネスフォン');
      expect(PRODUCT_CATEGORIES).toContain('UTM');
      expect(PRODUCT_CATEGORIES).toContain('LED');
      expect(PRODUCT_CATEGORIES).toContain('エアコン');
      expect(PRODUCT_CATEGORIES).toContain('その他');
    });

    it('定義されている商品カテゴリは6種類である', () => {
      expect(PRODUCT_CATEGORIES).toHaveLength(6);
    });
  });

  describe('CONTRACT_MONTHS_OPTIONS（契約期間オプション）', () => {
    // なぜ必要：契約期間選択に使用
    it('契約期間オプションに必要な選択肢が含まれている', () => {
      const values = CONTRACT_MONTHS_OPTIONS.map(opt => opt.value);
      expect(values).toContain(12);
      expect(values).toContain(36);
      expect(values).toContain(60);
      expect(values).toContain(84);
    });

    it('定義されている契約期間オプションは7種類である', () => {
      expect(CONTRACT_MONTHS_OPTIONS).toHaveLength(7);
    });
  });
});
