import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { is_symlink } from '@/utils/zip';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('is_symlink', async () => {
    test('symlink', async (context) => {
      const mode = 0o120777;
      assert.ok(is_symlink(mode));
    });

    test('file', async (context) => {
      const mode = 0o100664;
      assert.ok(!is_symlink(mode));
    });

    test('dir', async (context) => {
      const mode = 0o40775;
      assert.ok(!is_symlink(mode));
    });
  });
});
