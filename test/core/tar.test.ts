import assert from 'node:assert';
import { join, relative, resolve } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { read_tar } from '@/core/tar';
import type { ArchiveEntry, CleanedEntryWithMode } from '@/types/fs';
import { is_gzip_archive } from '@/utils/tar';

const data_dir = join(process.cwd(), 'test', '_data_');

const filename = relative(
  join(process.cwd(), 'test'),
  fileURLToPath(import.meta.url)
).replace('.test', '');

describe(filename, async () => {
  describe('read_tar', async () => {
    test('base.tar', async (context) => {
      const tar_path = join(data_dir, 'base.tar');
      const [entries, map] = await read_tar(
        tar_path,
        await is_gzip_archive(tar_path)
      );

      assert.strictEqual(entries.length, 2);
      assert.deepStrictEqual(entries[0], <ArchiveEntry>{
        path: 'a.txt',
        cleaned_path: 'a.txt',
        type: 'file',
        stats: {
          mtime: entries[0].stats.mtime,
          uid: 1000,
          gid: 1000,
          mode: 0o100664,
        },
      });
      assert.deepStrictEqual(entries[1], <ArchiveEntry>{
        path: 'b.txt',
        cleaned_path: 'b.txt',
        type: 'file',
        stats: {
          mtime: entries[1].stats.mtime,
          uid: 1000,
          gid: 1000,
          mode: 0o100664,
        },
      });
      assert.strictEqual(map.size, 2);
      assert.deepStrictEqual(map.get(resolve(entries[0].path)), <
        CleanedEntryWithMode
      >{
        cleaned_path: entries[0].cleaned_path,
        mode: entries[0].stats.mode,
      });
      assert.deepStrictEqual(map.get(resolve(entries[1].path)), <
        CleanedEntryWithMode
      >{
        cleaned_path: entries[1].cleaned_path,
        mode: entries[1].stats.mode,
      });
    });

    test('base.tgz', async (context) => {
      const tar_path = join(data_dir, 'base.tgz');
      const [entries, map] = await read_tar(
        tar_path,
        await is_gzip_archive(tar_path)
      );

      assert.strictEqual(entries.length, 2);
      assert.deepStrictEqual(entries[0], <ArchiveEntry>{
        path: 'a.txt',
        cleaned_path: 'a.txt',
        type: 'file',
        stats: {
          mtime: entries[0].stats.mtime,
          uid: 1000,
          gid: 1000,
          mode: 0o100664,
        },
      });
      assert.deepStrictEqual(entries[1], <ArchiveEntry>{
        path: 'b.txt',
        cleaned_path: 'b.txt',
        type: 'file',
        stats: {
          mtime: entries[1].stats.mtime,
          uid: 1000,
          gid: 1000,
          mode: 0o100664,
        },
      });
      assert.strictEqual(map.size, 2);
      assert.deepStrictEqual(map.get(resolve(entries[0].path)), <
        CleanedEntryWithMode
      >{
        cleaned_path: entries[0].cleaned_path,
        mode: entries[0].stats.mode,
      });
      assert.deepStrictEqual(map.get(resolve(entries[1].path)), <
        CleanedEntryWithMode
      >{
        cleaned_path: entries[1].cleaned_path,
        mode: entries[1].stats.mode,
      });
    });
  });
});
