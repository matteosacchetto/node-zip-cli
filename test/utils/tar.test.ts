import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { is_gzip } from '@/utils/tar';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('is_gzip', async (context) => {
    test('gzip', async (context) => {
      const buffer = Buffer.from([0x1f, 0x8b, 0x08]);
      assert.strictEqual(is_gzip(buffer), true);
    });

    test('non gzip', async (context) => {
      const buffer = Buffer.from([0x2e, 0x63, 0x38]);
      assert.strictEqual(is_gzip(buffer), false);
    });

    test('buffer too short', async (context) => {
      const buffer = Buffer.from([0x1f, 0x8b]);
      assert.strictEqual(is_gzip(buffer), false);
    });
  });
});
