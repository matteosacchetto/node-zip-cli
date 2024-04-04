import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { clean_base_dir } from '@/utils/path';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('clean_base_dir', async () => {
    test('test/utils', async () => {
      assert.strictEqual(clean_base_dir('test/utils'), 'test');
    });

    test('test', async () => {
      assert.strictEqual(clean_base_dir('test'), '.');
    });

    test('.', async () => {
      assert.strictEqual(clean_base_dir('.'), '.');
    });
  });
});
