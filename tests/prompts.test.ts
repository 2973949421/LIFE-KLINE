import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFile } from 'fs/promises';
import path from 'path';

describe('prompts', () => {
  const promptsDir = path.join(process.cwd(), 'content/prompts');

  describe('life-kline/skill.md', () => {
    it('exists and is non-empty', async () => {
      const filePath = path.join(promptsDir, 'life-kline/skill.md');
      const content = await readFile(filePath, 'utf-8');
      assert.ok(content.length > 0, 'skill.md should be non-empty');
    });
  });

  describe('life-kline/schema.json', () => {
    it('exists and is valid JSON', async () => {
      const filePath = path.join(promptsDir, 'life-kline/schema.json');
      const content = await readFile(filePath, 'utf-8');
      assert.ok(content.length > 0, 'schema.json should be non-empty');

      // Should parse as valid JSON
      const parsed = JSON.parse(content);
      assert.ok(typeof parsed === 'object', 'schema.json should parse as object');
    });
  });

  describe('hepan-kline/skill.md', () => {
    it('exists and is non-empty', async () => {
      const filePath = path.join(promptsDir, 'hepan-kline/skill.md');
      const content = await readFile(filePath, 'utf-8');
      assert.ok(content.length > 0, 'hepan skill.md should be non-empty');
    });
  });
});