/**
 * 定数のユニットテスト
 *
 * なぜこのテストが必要か：
 * - 定数はアプリケーション全体で使用される重要な値
 * - ラベルの誤りはUI表示に直接影響する
 * - ステップマッピングの不整合はワークフローの破綻を招く
 */
import {
  BUSINESS_TYPE_LABELS,
  CONTRACT_TYPE_LABELS,
  DEAL_STATUS_LABELS,
  CONTRACT_STEP_LABELS,
  CONTRACT_STAGE_LABELS,
  STEP_TO_STAGE,
  STAGE_STEPS,
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
      expect(CONTRACT_TYPE_LABELS.property).toBe('物件');
      expect(CONTRACT_TYPE_LABELS.line).toBe('回線');
      expect(CONTRACT_TYPE_LABELS.maintenance).toBe('保守');
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

  describe('CONTRACT_STEP_LABELS（契約ステップラベル）', () => {
    // なぜ必要：ワークフロー画面で正しいステップ名が表示されることを保証
    it('商談中ステージのステップに日本語ラベルが定義されている', () => {
      expect(CONTRACT_STEP_LABELS.商談待ち).toBe('商談待ち');
      expect(CONTRACT_STEP_LABELS.商談日程調整中).toBe('商談日程調整中');
    });

    it('審査・申込中ステージのステップに日本語ラベルが定義されている', () => {
      expect(CONTRACT_STEP_LABELS['審査・申込対応中']).toBe('審査・申込対応中');
      expect(CONTRACT_STEP_LABELS['審査・申込待ち']).toBe('審査・申込待ち');
    });

    it('下見・工事中ステージのステップに日本語ラベルが定義されている', () => {
      expect(CONTRACT_STEP_LABELS.下見調整中).toBe('下見調整中');
      expect(CONTRACT_STEP_LABELS.下見実施待ち).toBe('下見実施待ち');
      expect(CONTRACT_STEP_LABELS.工事日程調整中).toBe('工事日程調整中');
      expect(CONTRACT_STEP_LABELS.工事実施待ち).toBe('工事実施待ち');
    });

    it('全ステップが定義されている', () => {
      expect(Object.keys(CONTRACT_STEP_LABELS).length).toBeGreaterThan(10);
    });
  });

  describe('CONTRACT_STAGE_LABELS（契約ステージラベル）', () => {
    // なぜ必要：ワークフロー進行状況の表示に使用
    it('すべてのステージに日本語ラベルが定義されている', () => {
      expect(CONTRACT_STAGE_LABELS.商談中).toBe('商談中');
      expect(CONTRACT_STAGE_LABELS['審査・申込中']).toBe('審査・申込中');
      expect(CONTRACT_STAGE_LABELS['下見・工事中']).toBe('下見・工事中');
      expect(CONTRACT_STAGE_LABELS.契約中).toBe('契約中');
      expect(CONTRACT_STAGE_LABELS.入金中).toBe('入金中');
      expect(CONTRACT_STAGE_LABELS.請求中).toBe('請求中');
      expect(CONTRACT_STAGE_LABELS.完了).toBe('完了');
      expect(CONTRACT_STAGE_LABELS.否決).toBe('否決');
    });

    it('定義されているステージは8種類である', () => {
      expect(Object.keys(CONTRACT_STAGE_LABELS)).toHaveLength(8);
    });
  });

  describe('STEP_TO_STAGE（ステップからステージへのマッピング）', () => {
    // なぜ必要：ステップが正しいステージに属していることを保証
    // これが壊れるとワークフローの進行状況表示が崩壊する

    it('商談中ステージのステップが正しくマッピングされている', () => {
      expect(STEP_TO_STAGE.商談待ち).toBe('商談中');
      expect(STEP_TO_STAGE.商談日程調整中).toBe('商談中');
    });

    it('審査・申込中ステージのステップが正しくマッピングされている', () => {
      expect(STEP_TO_STAGE['審査・申込対応中']).toBe('審査・申込中');
      expect(STEP_TO_STAGE['審査・申込待ち']).toBe('審査・申込中');
    });

    it('下見・工事中ステージのステップが正しくマッピングされている', () => {
      expect(STEP_TO_STAGE.下見調整中).toBe('下見・工事中');
      expect(STEP_TO_STAGE.下見実施待ち).toBe('下見・工事中');
      expect(STEP_TO_STAGE.工事日程調整中).toBe('下見・工事中');
      expect(STEP_TO_STAGE.工事実施待ち).toBe('下見・工事中');
    });

    it('完了ステージのステップが正しくマッピングされている', () => {
      expect(STEP_TO_STAGE.クローズ).toBe('完了');
    });

    it('否決ステージのステップが正しくマッピングされている', () => {
      expect(STEP_TO_STAGE.対応検討中).toBe('否決');
      expect(STEP_TO_STAGE.失注).toBe('否決');
    });
  });

  describe('STAGE_STEPS（ステージ内ステップ一覧）', () => {
    // なぜ必要：各ステージ内で選択可能なステップの定義

    it('商談中ステージには2つのステップが含まれる', () => {
      expect(STAGE_STEPS.商談中).toHaveLength(2);
      expect(STAGE_STEPS.商談中).toContain('商談待ち');
      expect(STAGE_STEPS.商談中).toContain('商談日程調整中');
    });

    it('審査・申込中ステージには2つのステップが含まれる', () => {
      expect(STAGE_STEPS['審査・申込中']).toHaveLength(2);
      expect(STAGE_STEPS['審査・申込中']).toContain('審査・申込対応中');
      expect(STAGE_STEPS['審査・申込中']).toContain('審査・申込待ち');
    });

    it('下見・工事中ステージには4つのステップが含まれる', () => {
      expect(STAGE_STEPS['下見・工事中']).toHaveLength(4);
      expect(STAGE_STEPS['下見・工事中']).toContain('下見調整中');
      expect(STAGE_STEPS['下見・工事中']).toContain('工事実施待ち');
    });

    it('各ステージのステップはSTEP_TO_STAGEと整合性がある', () => {
      Object.entries(STAGE_STEPS).forEach(([stage, steps]) => {
        steps.forEach((step) => {
          expect(STEP_TO_STAGE[step]).toBe(stage);
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
      expect(TASK_STATUS_LABELS.未着手).toBe('未着手');
      expect(TASK_STATUS_LABELS.進行中).toBe('進行中');
      expect(TASK_STATUS_LABELS.完了).toBe('完了');
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
