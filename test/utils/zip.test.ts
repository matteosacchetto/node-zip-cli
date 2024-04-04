import assert from 'node:assert';
import { join, relative } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { is_symlink } from '@/utils/zip';
import JSZip from 'jszip';

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('is_symlink', async () => {
    test('symlink', async (context) => {
      const archive = new JSZip();

      archive.file('test', 'test.link', {
        dir: false,
        unixPermissions: 0o120777,
      });

      const entries = Object.entries(archive.files);

      assert.ok(is_symlink(entries[0][1]));
    });

    test('file', async (context) => {
      const archive = new JSZip();

      archive.file('test', '', {
        dir: false,
        unixPermissions: 0o100664,
      });

      const entries = Object.entries(archive.files);

      assert.ok(!is_symlink(entries[0][1]));
    });

    test('dir', async (context) => {
      const archive = new JSZip();

      archive.file('test', null, {
        unixPermissions: 0o40775,
        dir: true,
      });

      const entries = Object.entries(archive.files);

      assert.ok(!is_symlink(entries[0][1]));
    });
  });
});
