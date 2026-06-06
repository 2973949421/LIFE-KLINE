import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  AiJsonParseError,
  extractAssistantContent,
  extractJsonBlock,
  parseAssistantJson,
} from '../lib/server/life-kline/ai-json.ts';

describe('ai json parsing', () => {
  it('extracts json from markdown fenced content', () => {
    const block = extractJsonBlock('```json\n{"ok":true,"nested":{"value":1}}\n```');
    assert.deepStrictEqual(JSON.parse(block), { ok: true, nested: { value: 1 } });
  });

  it('extracts balanced json with surrounding text', () => {
    const parsed = parseAssistantJson('前置说明 {"rows":[{"analysis":"包含 } 字符","score":60}]} 后置说明');
    assert.deepStrictEqual(parsed, { rows: [{ analysis: '包含 } 字符', score: 60 }] });
  });

  it('joins text-like array content and ignores reasoning-only parts', () => {
    const content = extractAssistantContent({
      choices: [
        {
          message: {
            content: [
              { type: 'reasoning', text: 'should be ignored by parser later' },
              { type: 'text', text: '{"ok":' },
              { content: 'true}' },
            ],
          },
        },
      ],
    });

    assert.strictEqual(content, '{"ok":\ntrue}');
    assert.deepStrictEqual(parseAssistantJson(content), { ok: true });
  });

  it('returns empty string for empty assistant content', () => {
    assert.strictEqual(extractAssistantContent({ choices: [{ message: { content: [] } }] }), '');
  });

  it('throws a diagnostic error for half json', () => {
    assert.throws(() => parseAssistantJson('{"rows":[{"score":60}'), AiJsonParseError);
  });

  it('throws a diagnostic error for non-json content', () => {
    assert.throws(() => parseAssistantJson('无法给出结构化结果'), /content_preview=/);
  });
});
