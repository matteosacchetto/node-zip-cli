import assert from 'node:assert';
import { lstat, mkdir, rm, writeFile } from 'node:fs/promises';
import { symlink } from 'node:fs/promises';
import { platform } from 'node:os';
import { join, relative, resolve } from 'node:path';
import {
  after,
  afterEach,
  before,
  beforeEach,
  describe,
  mock,
  test,
} from 'node:test';
import { fileURLToPath } from 'node:url';
import { is_windows } from '@/core/constants';
import { create_tar, read_tar } from '@/core/tar';
import { list_entries } from '@/core/walk';
import type { ArchiveEntry, CleanedEntryWithMode } from '@/types/fs';
import { is_gzip_archive } from '@/utils/tar';

const data_dir = join(process.cwd(), 'test', '_data_');
const write_dir = join(process.cwd(), 'test', '_write_');

const format_date = (date: Date) => {
  // In the tar archive the mtime has milliseconds set to 0
  return new Date(Math.floor(date.getTime() / 1000) * 1000);
};

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

  describe('create_tar', async () => {
    const create_tar_dir = join(write_dir, 'create_tar');

    before(async () => {
      await mkdir(create_tar_dir);
      await mkdir(join(create_tar_dir, 'dir-1'));
      await writeFile(join(create_tar_dir, 'dir-1', 'a.txt'), 'a');
      await writeFile(join(create_tar_dir, 'dir-1', 'b.txt'), 'b');
      await mkdir(join(create_tar_dir, 'dir-2'));
      await writeFile(join(create_tar_dir, 'dir-2', 'c.txt'), 'c');
      await writeFile(join(create_tar_dir, 'dir-2', 'd.txt'), 'd');
      await writeFile(join(create_tar_dir, 'e.txt'), 'e');

      if (!is_windows) {
        await symlink('e.txt', join(create_tar_dir, 'symlink-e'));
        await symlink('dir-1', join(create_tar_dir, 'symlink-dir-1'));
      }
    });

    after(async () => {
      await rm(create_tar_dir, { recursive: true });
    });

    beforeEach(async () => {
      mock.method(process.stderr, 'write', (msg: string, err: () => void) => {
        return msg;
      });
    });

    afterEach(async () => {
      mock.restoreAll();
    });

    test('0 files', async () => {
      await create_tar(
        join(create_tar_dir, 'out-0.tar'),
        [],
        new Map<string, CleanedEntryWithMode>(),
        0,
        false,
        is_windows
      );

      assert.rejects(() => lstat(join(create_tar_dir, 'out-0.tar')));
    });

    test(
      '1 symlink',
      {
        skip:
          platform() === 'win32'
            ? 'Windows does not support symlinks'
            : undefined,
      },
      async () => {
        const [files, conflicting_files, map] = await list_entries(
          [join(create_tar_dir, 'symlink-e')],
          is_windows,
          'none',
          'keep',
          false,
          [],
          'none'
        );

        assert.strictEqual(files.length, 1);
        assert.strictEqual(conflicting_files.length, 0);
        assert.strictEqual(map.size, 1);

        const output_path = join(create_tar_dir, 'out-1.zip');
        await create_tar(output_path, files, map, 1, false, is_windows);

        const [entries] = await read_tar(output_path, false);

        assert.strictEqual(entries.length, 1);
        assert.strictEqual(entries[0].path, 'symlink-e');
        assert.strictEqual(entries[0].cleaned_path, 'symlink-e');
        assert.strictEqual(entries[0].type, 'symlink');
        assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
        assert.strictEqual(
          entries[0].stats.mtime.getTime(),
          format_date(files[0].stats.mtime).getTime()
        );
      }
    );

    test('1 file', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_tar_dir, 'e.txt')],
        is_windows,
        'none',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 1);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 1);

      const output_path = join(create_tar_dir, 'out-2.tar');
      await create_tar(output_path, files, map, 1, false, is_windows);

      const [entries] = await read_tar(output_path, false);

      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].path, 'e.txt');
      assert.strictEqual(entries[0].cleaned_path, 'e.txt');
      assert.strictEqual(entries[0].type, 'file');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );
    });

    test('2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_tar_dir, 'dir-1')],
        is_windows,
        'none',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 2);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 2);

      const output_path = join(create_tar_dir, 'out-3.tar');
      await create_tar(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_tar(output_path, false);

      assert.strictEqual(entries.length, 2);

      assert.strictEqual(entries[0].path, 'a.txt');
      assert.strictEqual(entries[0].cleaned_path, 'a.txt');
      assert.strictEqual(entries[0].type, 'file');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(entries[1].path, 'b.txt');
      assert.strictEqual(entries[1].cleaned_path, 'b.txt');
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );
    });

    test('1 directory, 2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_tar_dir, 'dir-1')],
        is_windows,
        'last',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 3);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 3);

      const output_path = join(create_tar_dir, 'out-4.tar');
      await create_tar(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_tar(output_path, false);

      assert.strictEqual(entries.length, 3);

      assert.strictEqual(entries[0].path, 'dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(entries[1].path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );

      assert.strictEqual(entries[2].path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.strictEqual(
        entries[2].stats.mtime.getTime(),
        format_date(files[2].stats.mtime).getTime()
      );
    });

    test('2 directories, 2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [join(create_tar_dir, 'dir-1'), join(create_tar_dir, 'dir-2')],
        is_windows,
        'last',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 6);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 6);

      const output_path = join(create_tar_dir, 'out-5.tar');
      await create_tar(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_tar(output_path, false);

      assert.strictEqual(entries.length, 6);

      assert.strictEqual(entries[0].path, 'dir-1');
      assert.strictEqual(entries[0].cleaned_path, 'dir-1');
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(entries[1].path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].cleaned_path, join('dir-1', 'a.txt'));
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );

      assert.strictEqual(entries[2].path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].cleaned_path, join('dir-1', 'b.txt'));
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.strictEqual(
        entries[2].stats.mtime.getTime(),
        format_date(files[2].stats.mtime).getTime()
      );

      assert.strictEqual(entries[3].path, 'dir-2');
      assert.strictEqual(entries[3].cleaned_path, 'dir-2');
      assert.strictEqual(entries[3].type, 'directory');
      assert.strictEqual(entries[3].stats.mode, files[3].stats.mode);
      assert.strictEqual(
        entries[3].stats.mtime.getTime(),
        format_date(files[3].stats.mtime).getTime()
      );

      assert.strictEqual(entries[4].path, join('dir-2', 'c.txt'));
      assert.strictEqual(entries[4].cleaned_path, join('dir-2', 'c.txt'));
      assert.strictEqual(entries[4].type, 'file');
      assert.strictEqual(entries[4].stats.mode, files[4].stats.mode);
      assert.strictEqual(
        entries[4].stats.mtime.getTime(),
        format_date(files[4].stats.mtime).getTime()
      );

      assert.strictEqual(entries[5].path, join('dir-2', 'd.txt'));
      assert.strictEqual(entries[5].cleaned_path, join('dir-2', 'd.txt'));
      assert.strictEqual(entries[5].type, 'file');
      assert.strictEqual(entries[5].stats.mode, files[5].stats.mode);
      assert.strictEqual(
        entries[5].stats.mtime.getTime(),
        format_date(files[5].stats.mtime).getTime()
      );
    });

    test('1 directory (with 2 parents), 2 files', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [relative('.', join(create_tar_dir, 'dir-1'))],
        is_windows,
        'full',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 3);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 3);

      const output_path = join(create_tar_dir, 'out-6.tar');
      await create_tar(output_path, files, map, 2, false, is_windows);

      const [entries] = await read_tar(output_path, false);

      assert.strictEqual(entries.length, 3);

      assert.strictEqual(
        entries[0].path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(
        entries[0].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[1].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(
        entries[1].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[2].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(
        entries[2].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.strictEqual(
        entries[2].stats.mtime.getTime(),
        format_date(files[2].stats.mtime).getTime()
      );
    });

    test('1 directory (with 2 parents), 2 files: gzip 9', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [relative('.', join(create_tar_dir, 'dir-1'))],
        is_windows,
        'full',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 3);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 3);

      const output_path = join(create_tar_dir, 'out-7.tgz');
      await create_tar(output_path, files, map, 2, 9, is_windows);

      const [entries] = await read_tar(output_path, true);

      assert.strictEqual(entries.length, 3);

      assert.strictEqual(
        entries[0].path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(
        entries[0].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[1].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(
        entries[1].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[2].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(
        entries[2].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.strictEqual(
        entries[2].stats.mtime.getTime(),
        format_date(files[2].stats.mtime).getTime()
      );
    });

    test('1 directory (with 2 parents), 2 files: gzip true', async () => {
      const [files, conflicting_files, map] = await list_entries(
        [relative('.', join(create_tar_dir, 'dir-1'))],
        is_windows,
        'full',
        'none',
        false,
        [],
        'none'
      );

      assert.strictEqual(files.length, 3);
      assert.strictEqual(conflicting_files.length, 0);
      assert.strictEqual(map.size, 3);

      const output_path = join(create_tar_dir, 'out-8.tgz');
      await create_tar(output_path, files, map, 2, true, is_windows);

      const [entries] = await read_tar(output_path, true);

      assert.strictEqual(entries.length, 3);

      assert.strictEqual(
        entries[0].path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(
        entries[0].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1')
      );
      assert.strictEqual(entries[0].type, 'directory');
      assert.strictEqual(entries[0].stats.mode, files[0].stats.mode);
      assert.strictEqual(
        entries[0].stats.mtime.getTime(),
        format_date(files[0].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[1].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(
        entries[1].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'a.txt')
      );
      assert.strictEqual(entries[1].type, 'file');
      assert.strictEqual(entries[1].stats.mode, files[1].stats.mode);
      assert.strictEqual(
        entries[1].stats.mtime.getTime(),
        format_date(files[1].stats.mtime).getTime()
      );

      assert.strictEqual(
        entries[2].path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(
        entries[2].cleaned_path,
        join('test', '_write_', 'create_tar', 'dir-1', 'b.txt')
      );
      assert.strictEqual(entries[2].type, 'file');
      assert.strictEqual(entries[2].stats.mode, files[2].stats.mode);
      assert.strictEqual(
        entries[2].stats.mtime.getTime(),
        format_date(files[2].stats.mtime).getTime()
      );
    });
  });
});
