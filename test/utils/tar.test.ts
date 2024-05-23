import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { get_full_mode, is_gzip, is_gzip_archive } from '@/utils/tar';

const data_dir = join(process.cwd(), 'test', '_data_');

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('get_full_mode', async (context) => {
    test('directory', async () => {
      assert.strictEqual(get_full_mode(0o755, 'directory'), 0o40755);
    });

    test('file', async () => {
      assert.strictEqual(get_full_mode(0o644, 'file'), 0o100644);
    });

    test('symlink', async () => {
      assert.strictEqual(get_full_mode(0o777, 'symlink'), 0o120777);
    });

    test('empty', async () => {
      assert.strictEqual(
        get_full_mode(0o777, 'empty' as unknown as 'file'),
        0o777
      );
    });
  });

  describe('is_gzip_archive', async () => {
    test('empty file', async () => {
      assert.ok(!(await is_gzip_archive(join(data_dir, 'empty'))));
    });

    test('tar archive', async () => {
      assert.ok(!(await is_gzip_archive(join(data_dir, 'base.tar'))));
    });

    test('tgz archive', async () => {
      assert.ok(await is_gzip_archive(join(data_dir, 'base.tgz')));
    });
  });

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
